import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toTrip } from "@/lib/store";
import { lockExpiredDrivers } from "@/lib/rules";
import { clearAppCache } from "@/lib/cache";

const patchTripSchema = z.object({
  status: z.enum(["draft", "dispatched", "completed", "cancelled"]),
  vehicleId: z.string().optional(),
  driverId: z.string().optional()
});

const transitions: Record<string, string[]> = {
  draft: ["dispatched", "cancelled"],
  dispatched: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_trips")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  await lockExpiredDrivers();

  const body = await request.json().catch(() => null);
  const parsed = patchTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid trip update payload." }, { status: 400 });
  }

  const { id } = await context.params;

  const updated = await prisma
    .$transaction(async (tx: any) => {
      const trip = await tx.trip.findUnique({ where: { id } });
      if (!trip) {
        throw new Error("NOT_FOUND");
      }
      if (!transitions[trip.status].includes(parsed.data.status)) {
        throw new Error("INVALID_TRANSITION");
      }

      if (parsed.data.status === "dispatched") {
        const vehicle = await tx.vehicle.findUnique({ where: { id: parsed.data.vehicleId ?? trip.vehicleId } });
        const driver = await tx.driver.findUnique({ where: { id: parsed.data.driverId ?? trip.driverId } });
        if (!vehicle || !driver) {
          throw new Error("RESOURCE_NOT_FOUND");
        }
        if (vehicle.status !== "available" || vehicle.outOfService) {
          throw new Error("VEHICLE_UNAVAILABLE");
        }
        if (driver.status !== "available") {
          throw new Error("DRIVER_UNAVAILABLE");
        }
        if (trip.cargoWeightKg > vehicle.maxCapacityKg) {
          throw new Error("CAPACITY_EXCEEDED");
        }

        await tx.trip.update({
          where: { id: trip.id },
          data: {
            vehicleId: vehicle.id,
            driverId: driver.id,
            status: "dispatched"
          }
        });
        await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "on_trip" } });
        await tx.driver.update({ where: { id: driver.id }, data: { status: "on_duty" } });

        const next = await tx.trip.findUnique({ where: { id: trip.id } });
        return toTrip(next!);
      }

      if (parsed.data.status === "completed" || parsed.data.status === "cancelled") {
        const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
        const driver = await tx.driver.findUnique({ where: { id: trip.driverId } });
        if (vehicle && !vehicle.outOfService) {
          await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: "available" } });
        }
        if (driver && driver.status !== "suspended") {
          await tx.driver.update({ where: { id: driver.id }, data: { status: "off_duty" } });
        }
        const next = await tx.trip.update({ where: { id: trip.id }, data: { status: parsed.data.status } });
        return toTrip(next);
      }

      const next = await tx.trip.update({ where: { id: trip.id }, data: { status: parsed.data.status } });
      return toTrip(next);
    })
    .catch((error: Error) => error.message);

  if (typeof updated === "string") {
    const map: Record<string, { status: number; message: string }> = {
      NOT_FOUND: { status: 404, message: "Trip not found." },
      INVALID_TRANSITION: { status: 409, message: "Invalid lifecycle transition for this trip." },
      RESOURCE_NOT_FOUND: { status: 404, message: "Vehicle or driver not found." },
      VEHICLE_UNAVAILABLE: { status: 409, message: "Vehicle is not available." },
      DRIVER_UNAVAILABLE: { status: 409, message: "Driver is not available." },
      CAPACITY_EXCEEDED: { status: 409, message: "Validation rule failed: CargoWeight exceeds MaxCapacity." }
    };
    const fallback = { status: 500, message: "Unexpected server error." };
    const error = map[updated] ?? fallback;
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  await clearAppCache();
  return NextResponse.json({ trip: updated });
}
