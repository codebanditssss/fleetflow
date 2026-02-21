import { Driver, Trip, Vehicle } from "@/lib/types";

type Filters = {
  type?: string | null;
  status?: string | null;
  region?: string | null;
};

export function applyVehicleFilters(vehicles: Vehicle[], filters: Filters): Vehicle[] {
  return vehicles.filter((vehicle) => {
    const typeOk = !filters.type || filters.type === "all" || vehicle.type === filters.type;
    const statusOk = !filters.status || filters.status === "all" || vehicle.status === filters.status;
    const regionOk = !filters.region || filters.region === "all" || vehicle.region === filters.region;
    return typeOk && statusOk && regionOk;
  });
}

export function computeKpis(vehicles: Vehicle[], trips: Trip[]): {
  activeFleet: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  pendingCargo: number;
} {
  const activeFleet = vehicles.filter((vehicle) => vehicle.status === "on_trip").length;
  const maintenanceAlerts = vehicles.filter((vehicle) => vehicle.status === "in_shop").length;
  const operationalVehicles = vehicles.filter((vehicle) => !vehicle.outOfService).length;
  const utilizedVehicles = vehicles.filter((vehicle) =>
    vehicle.status === "on_trip" || vehicle.status === "in_shop"
  ).length;
  const utilizationRate = operationalVehicles === 0 ? 0 : Math.round((utilizedVehicles / operationalVehicles) * 100);
  const pendingCargo = trips.filter((trip) => trip.status === "draft").length;
  return { activeFleet, maintenanceAlerts, utilizationRate, pendingCargo };
}

export function safetySnapshot(drivers: Driver[]): {
  expiringLicenses: number;
  lowSafetyDrivers: number;
} {
  const today = new Date().toISOString().slice(0, 10);
  const expiringLicenses = drivers.filter((driver) => driver.licenseExpiry <= today).length;
  const lowSafetyDrivers = drivers.filter((driver) => driver.safetyScore < 80).length;
  return { expiringLicenses, lowSafetyDrivers };
}
