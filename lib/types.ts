export type Role = "manager" | "dispatcher" | "safety_officer" | "financial_analyst";

export type VehicleType = "truck" | "van" | "bike";
export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";

export type DriverStatus = "available" | "on_duty" | "off_duty" | "suspended";

export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";

export type UserSession = {
  email: string;
  name: string;
  role: Role;
};

export type Vehicle = {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  maxCapacityKg: number;
  odometerKm: number;
  type: VehicleType;
  status: VehicleStatus;
  region: string;
  outOfService: boolean;
};

export type Driver = {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  safetyScore: number;
  complaints: number;
  completionRate?: number;
  status: DriverStatus;
  region: string;
};

export type Trip = {
  id: string;
  origin: string;
  destination: string;
  cargoWeightKg: number;
  distanceKm?: number | null;
  revenue?: number | null;
  estimatedFuelCost?: number | null;
  vehicleId: string;
  driverId: string;
  region: string;
  status: TripStatus;
  createdAt: string;
};

export type ServiceStatus = "open" | "in_progress" | "completed";

export type ServiceLog = {
  id: string;
  vehicleId: string;
  issue: string;
  serviceDate: string;
  cost: number;
  status: ServiceStatus;
  notes?: string | null;
  createdAt: string;
};

export type ExpenseStatus = "new" | "done";

export type Expense = {
  id: string;
  tripId?: string | null;
  driverId: string;
  vehicleId: string;
  distanceKm?: number | null;
  fuelCost: number;
  miscCost: number;
  status: ExpenseStatus;
  notes?: string | null;
  spentAt: string;
};
