import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("fleet123", 10);

  const users = [
    { email: "manager@fleetflow.local", name: "Maya Manager", role: "manager" },
    { email: "dispatcher@fleetflow.local", name: "Dev Dispatcher", role: "dispatcher" },
    { email: "safety@fleetflow.local", name: "Sana Safety", role: "safety_officer" },
    { email: "finance@fleetflow.local", name: "Farah Finance", role: "financial_analyst" }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: { ...user, passwordHash },
      update: {}
    });
  }

  const vehiclesCount = await prisma.vehicle.count();
  if (vehiclesCount === 0) {
    await prisma.vehicle.createMany({
      data: [
        {
          name: "Atlas",
          model: "Volvo FMX",
          licensePlate: "DL-1L-0912",
          maxCapacityKg: 12000,
          odometerKm: 184233,
          type: "truck",
          status: "available",
          region: "North",
          outOfService: false
        },
        {
          name: "Zephyr",
          model: "Ford Transit",
          licensePlate: "KA-05-ZX-8841",
          maxCapacityKg: 1800,
          odometerKm: 67214,
          type: "van",
          status: "in_shop",
          region: "West",
          outOfService: false
        },
        {
          name: "Bolt",
          model: "E-Cargo Bike X2",
          licensePlate: "MH-12-BK-2201",
          maxCapacityKg: 120,
          odometerKm: 8112,
          type: "bike",
          status: "available",
          region: "Central",
          outOfService: false
        }
      ]
    });
  }

  const driversCount = await prisma.driver.count();
  if (driversCount === 0) {
    await prisma.driver.createMany({
      data: [
        {
          name: "Aarav Singh",
          licenseNumber: "DL-AR-2213",
          licenseExpiry: new Date("2027-05-10T00:00:00.000Z"),
          safetyScore: 92,
          complaints: 1,
          status: "available",
          region: "North"
        },
        {
          name: "Riya Kapoor",
          licenseNumber: "DL-RK-7844",
          licenseExpiry: new Date("2026-09-22T00:00:00.000Z"),
          safetyScore: 88,
          complaints: 2,
          status: "available",
          region: "West"
        },
        {
          name: "Kabir Nair",
          licenseNumber: "DL-KN-1021",
          licenseExpiry: new Date("2026-03-03T00:00:00.000Z"),
          safetyScore: 75,
          complaints: 4,
          status: "off_duty",
          region: "Central"
        }
      ]
    });
  }

  const tripsCount = await prisma.trip.count();
  if (tripsCount === 0) {
    const vehicle = await prisma.vehicle.findFirst({ where: { name: "Atlas" } });
    const driver = await prisma.driver.findFirst({ where: { name: "Aarav Singh" } });
    if (vehicle && driver) {
      await prisma.trip.create({
        data: {
          origin: "North Hub",
          destination: "City Market",
          cargoWeightKg: 900,
          distanceKm: 120,
          revenue: 45000,
          estimatedFuelCost: 7000,
          vehicleId: vehicle.id,
          driverId: driver.id,
          region: "North",
          status: "draft"
        }
      });
    }
  }

  const maintenanceCount = await prisma.serviceLog.count();
  if (maintenanceCount === 0) {
    const van = await prisma.vehicle.findFirst({ where: { name: "Zephyr" } });
    if (van) {
      await prisma.serviceLog.create({
        data: {
          vehicleId: van.id,
          issue: "Brake line inspection",
          serviceDate: new Date("2026-02-20T00:00:00.000Z"),
          cost: 12000,
          status: "in_progress",
          notes: "Parts expected by end of week."
        }
      });
    }
  }

  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    const trip = await prisma.trip.findFirst();
    if (trip) {
      await prisma.expense.create({
        data: {
          tripId: trip.id,
          driverId: trip.driverId,
          vehicleId: trip.vehicleId,
          distanceKm: trip.distanceKm ?? 120,
          fuelCost: 9500,
          miscCost: 1200,
          status: "done",
          notes: "Fuel + tolls",
          spentAt: new Date("2026-02-20T00:00:00.000Z")
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
