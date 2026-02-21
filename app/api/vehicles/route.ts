import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toVehicle } from "@/lib/store";
import { Vehicle } from "@/lib/types";
import { clearAppCache } from "@/lib/cache";

const createVehicleSchema = z.object({
  name: z.string().min(2),
  model: z.string().min(2),
  licensePlate: z.string().min(3),
  maxCapacityKg: z.number().positive(),
  odometerKm: z.number().min(0),
  type: z.enum(["truck", "van", "bike"]),
  region: z.string().min(2)
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const rawVehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } });
  const dbVehicles = rawVehicles.map(toVehicle);
  const type = request.nextUrl.searchParams.get("type");
  const status = request.nextUrl.searchParams.get("status");
  const region = request.nextUrl.searchParams.get("region");

  const vehicles = dbVehicles.filter((vehicle: Vehicle) => {
    const typeOk = !type || type === "all" || vehicle.type === type;
    const statusOk = !status || status === "all" || vehicle.status === status;
    const regionOk = !region || region === "all" || vehicle.region === region;
    return typeOk && statusOk && regionOk;
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_vehicles")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid vehicle data." }, { status: 400 });
  }

  const vehicle = await prisma.vehicle
    .create({
      data: {
        ...parsed.data,
        status: "available",
        outOfService: false
      }
    })
    .catch(() => null);

  if (!vehicle) {
    return NextResponse.json({ message: "License plate must be unique." }, { status: 409 });
  }
  await clearAppCache();
  return NextResponse.json({ vehicle: toVehicle(vehicle) }, { status: 201 });
}
