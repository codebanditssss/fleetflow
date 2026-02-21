import { prisma } from "@/lib/prisma";

export async function lockExpiredDrivers(): Promise<void> {
  const now = new Date();
  await prisma.driver.updateMany({
    where: {
      licenseExpiry: { lt: now },
      status: { not: "suspended" }
    },
    data: { status: "suspended" }
  });
}

export async function refreshVehicleAvailability(vehicleId: string): Promise<void> {
  const [vehicle, openLogs, activeTrip] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    prisma.serviceLog.count({
      where: {
        vehicleId,
        status: { in: ["open", "in_progress"] }
      }
    }),
    prisma.trip.findFirst({
      where: {
        vehicleId,
        status: { in: ["dispatched"] }
      }
    })
  ]);

  if (!vehicle) {
    return;
  }

  if (vehicle.outOfService) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "retired" }
    });
    return;
  }

  if (openLogs > 0) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "in_shop" }
    });
    return;
  }

  if (activeTrip) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: "on_trip" }
    });
    return;
  }

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: "available" }
  });
}
