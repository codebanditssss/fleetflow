import { prisma } from "@/lib/prisma";
import { Driver, Expense, ServiceLog, Trip, Vehicle } from "@/lib/types";

export function toVehicle(model: {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  maxCapacityKg: number;
  odometerKm: number;
  type: string;
  status: string;
  region: string;
  outOfService: boolean;
}): Vehicle {
  return {
    id: model.id,
    name: model.name,
    model: model.model,
    licensePlate: model.licensePlate,
    maxCapacityKg: model.maxCapacityKg,
    odometerKm: model.odometerKm,
    type: model.type as Vehicle["type"],
    status: model.status as Vehicle["status"],
    region: model.region,
    outOfService: model.outOfService
  };
}

export function toDriver(model: {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: Date;
  safetyScore: number;
  complaints: number;
  status: string;
  region: string;
}): Driver {
  return {
    id: model.id,
    name: model.name,
    licenseNumber: model.licenseNumber,
    licenseExpiry: model.licenseExpiry.toISOString().slice(0, 10),
    safetyScore: model.safetyScore,
    complaints: model.complaints,
    status: model.status as Driver["status"],
    region: model.region
  };
}

export function toTrip(model: {
  id: string;
  origin: string;
  destination: string;
  cargoWeightKg: number;
  distanceKm: number | null;
  revenue: number | null;
  estimatedFuelCost: number | null;
  vehicleId: string;
  driverId: string;
  region: string;
  status: string;
  createdAt: Date;
}): Trip {
  return {
    id: model.id,
    origin: model.origin,
    destination: model.destination,
    cargoWeightKg: model.cargoWeightKg,
    distanceKm: model.distanceKm,
    revenue: model.revenue,
    estimatedFuelCost: model.estimatedFuelCost,
    vehicleId: model.vehicleId,
    driverId: model.driverId,
    region: model.region,
    status: model.status as Trip["status"],
    createdAt: model.createdAt.toISOString()
  };
}

export function toServiceLog(model: {
  id: string;
  vehicleId: string;
  issue: string;
  serviceDate: Date;
  cost: number;
  status: string;
  notes: string | null;
  createdAt: Date;
}): ServiceLog {
  return {
    id: model.id,
    vehicleId: model.vehicleId,
    issue: model.issue,
    serviceDate: model.serviceDate.toISOString().slice(0, 10),
    cost: model.cost,
    status: model.status as ServiceLog["status"],
    notes: model.notes,
    createdAt: model.createdAt.toISOString()
  };
}

export function toExpense(model: {
  id: string;
  tripId: string | null;
  driverId: string;
  vehicleId: string;
  distanceKm: number | null;
  fuelCost: number;
  miscCost: number;
  status: string;
  notes: string | null;
  spentAt: Date;
}): Expense {
  return {
    id: model.id,
    tripId: model.tripId,
    driverId: model.driverId,
    vehicleId: model.vehicleId,
    distanceKm: model.distanceKm,
    fuelCost: model.fuelCost,
    miscCost: model.miscCost,
    status: model.status as Expense["status"],
    notes: model.notes,
    spentAt: model.spentAt.toISOString().slice(0, 10)
  };
}

export async function fetchFleetSnapshot(): Promise<{ vehicles: Vehicle[]; drivers: Driver[]; trips: Trip[] }> {
  const [vehiclesRaw, driversRaw, tripsRaw] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.driver.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.trip.findMany({ orderBy: { createdAt: "desc" } })
  ]);
  return {
    vehicles: vehiclesRaw.map(toVehicle),
    drivers: driversRaw.map(toDriver),
    trips: tripsRaw.map(toTrip)
  };
}
