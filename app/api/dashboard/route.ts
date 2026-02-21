import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import { applyVehicleFilters, computeKpis, safetySnapshot } from "@/lib/dashboard";
import { can } from "@/lib/rbac";
import { fetchFleetSnapshot } from "@/lib/store";
import { lockExpiredDrivers } from "@/lib/rules";
import { cacheGet, cacheSet } from "@/lib/cache";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "view_dashboard")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await lockExpiredDrivers();
  const type = request.nextUrl.searchParams.get("type");
  const status = request.nextUrl.searchParams.get("status");
  const region = request.nextUrl.searchParams.get("region");
  const cacheKey = `dashboard:${session.email}:${type ?? "all"}:${status ?? "all"}:${region ?? "all"}`;
  const cached = cacheGet<{
    kpis: {
      activeFleet: number;
      maintenanceAlerts: number;
      utilizationRate: number;
      pendingCargo: number;
    };
    safety: { expiringLicenses: number; lowSafetyDrivers: number };
    vehicles: unknown[];
    trips: unknown[];
  }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "private, max-age=15"
      }
    });
  }

  const db = await fetchFleetSnapshot();

  const filteredVehicles = applyVehicleFilters(db.vehicles, { type, status, region });
  const kpis = computeKpis(filteredVehicles, db.trips);
  const safety = safetySnapshot(db.drivers);

  const payload = {
    kpis,
    safety,
    vehicles: filteredVehicles,
    trips: db.trips
  };
  cacheSet(cacheKey, payload, 15000);
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=15"
    }
  });
}
