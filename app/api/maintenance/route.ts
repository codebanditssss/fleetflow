import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toServiceLog, toVehicle } from "@/lib/store";
import { refreshVehicleAvailability } from "@/lib/rules";
import { clearAppCache } from "@/lib/cache";

const createServiceSchema = z.object({
  vehicleId: z.string().min(1),
  issue: z.string().min(3),
  serviceDate: z.string().min(8),
  cost: z.number().min(0),
  notes: z.string().optional()
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_maintenance") && !can(session.role, "view_dashboard")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const logsRaw = await prisma.serviceLog.findMany({
    where: !status || status === "all" ? {} : { status: status as "open" | "in_progress" | "completed" },
    orderBy: { createdAt: "desc" }
  });
  const vehiclesRaw = await prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } });

  return NextResponse.json({
    logs: logsRaw.map(toServiceLog),
    vehicles: vehiclesRaw.map(toVehicle)
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_maintenance")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid service log payload." }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
  if (!vehicle) {
    return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });
  }

  const log = await prisma.serviceLog.create({
    data: {
      vehicleId: parsed.data.vehicleId,
      issue: parsed.data.issue,
      serviceDate: new Date(parsed.data.serviceDate),
      cost: parsed.data.cost,
      notes: parsed.data.notes,
      status: "open"
    }
  });

  await refreshVehicleAvailability(parsed.data.vehicleId);
  await clearAppCache();
  return NextResponse.json({ log: toServiceLog(log) }, { status: 201 });
}
