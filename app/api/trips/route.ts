import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toDriver, toTrip, toVehicle } from "@/lib/store";
import { Driver, Trip, Vehicle } from "@/lib/types";
import { lockExpiredDrivers } from "@/lib/rules";
import { clearAppCache } from "@/lib/cache";

const createTripSchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  cargoWeightKg: z.number().positive(),
  distanceKm: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  estimatedFuelCost: z.number().min(0).optional(),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  region: z.string().min(2)
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await lockExpiredDrivers();
  const [tripsRaw, vehiclesRaw, driversRaw] = await Promise.all([
    prisma.trip.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.driver.findMany({ orderBy: { createdAt: "desc" } })
  ]);
  const dbTrips = tripsRaw.map(toTrip);
  const dbVehicles = vehiclesRaw.map(toVehicle);
  const dbDrivers = driversRaw.map(toDriver);
  const region = request.nextUrl.searchParams.get("region");
  const trips = dbTrips.filter((trip: Trip) => !region || region === "all" || trip.region === region);

  return NextResponse.json({
    trips,
    availableVehicles: dbVehicles.filter((vehicle: Vehicle) => vehicle.status === "available" && !vehicle.outOfService),
    availableDrivers: dbDrivers.filter((driver: Driver) => driver.status === "available")
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_trips")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  await lockExpiredDrivers();

  const body = await request.json().catch(() => null);
  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid trip payload." }, { status: 400 });
  }

  const trip = await (async () => {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: parsed.data.driverId } });
    if (!vehicle || !driver) {
      throw new Error("RESOURCE_NOT_FOUND");
    }
    if (vehicle.status !== "available" || vehicle.outOfService) {
      throw new Error("VEHICLE_UNAVAILABLE");
    }
    if (driver.status !== "available") {
      throw new Error("DRIVER_UNAVAILABLE");
    }
    if (parsed.data.cargoWeightKg > vehicle.maxCapacityKg) {
      throw new Error("CAPACITY_EXCEEDED");
    }

    const nextTrip = await prisma.trip.create({
      data: {
        ...parsed.data,
        status: "draft"
      }
    });
    return toTrip(nextTrip);
  })().catch((error: Error) => error.message);

  if (typeof trip === "string") {
    const map: Record<string, { status: number; message: string }> = {
      RESOURCE_NOT_FOUND: { status: 404, message: "Selected vehicle or driver does not exist." },
      VEHICLE_UNAVAILABLE: { status: 409, message: "Selected vehicle is not available." },
      DRIVER_UNAVAILABLE: { status: 409, message: "Selected driver is not available." },
      CAPACITY_EXCEEDED: { status: 409, message: "Validation rule failed: CargoWeight exceeds MaxCapacity." }
    };
    const fallback = { status: 500, message: "Unexpected server error." };
    const error = map[trip] ?? fallback;
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  await clearAppCache();
  return NextResponse.json({ trip }, { status: 201 });
}
