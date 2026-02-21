import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toVehicle } from "@/lib/store";
import { refreshVehicleAvailability } from "@/lib/rules";
import { clearAppCache } from "@/lib/cache";

const patchVehicleSchema = z.object({
  name: z.string().min(2).optional(),
  model: z.string().min(2).optional(),
  maxCapacityKg: z.number().positive().optional(),
  odometerKm: z.number().min(0).optional(),
  region: z.string().min(2).optional(),
  status: z.enum(["available", "on_trip", "in_shop", "retired"]).optional(),
  outOfService: z.boolean().optional()
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_vehicles")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid vehicle update payload." }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = { ...parsed.data };
  if (typeof parsed.data.outOfService === "boolean") {
    updates.status = parsed.data.outOfService ? "retired" : "available";
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: updates
  });

  await refreshVehicleAvailability(id);
  const refreshed = await prisma.vehicle.findUnique({ where: { id } });
  await clearAppCache();
  return NextResponse.json({ vehicle: toVehicle(refreshed ?? vehicle) });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_vehicles")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const exists = await prisma.vehicle.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });
  }

  const activeTrip = await prisma.trip.findFirst({
    where: {
      vehicleId: id,
      status: { in: ["draft", "dispatched"] }
    }
  });
  if (activeTrip) {
    return NextResponse.json(
      { message: "Cannot delete vehicle linked to an active trip. Mark it out of service instead." },
      { status: 409 }
    );
  }

  await prisma.vehicle.delete({ where: { id } });
  await clearAppCache();
  return NextResponse.json({ ok: true });
}
