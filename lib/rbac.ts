import { Role } from "@/lib/types";

type Action =
  | "view_dashboard"
  | "manage_vehicles"
  | "manage_trips"
  | "manage_maintenance"
  | "manage_expenses"
  | "view_driver_profiles"
  | "view_analytics";

const permissions: Record<Role, Action[]> = {
  manager: [
    "view_dashboard",
    "manage_vehicles",
    "manage_trips",
    "manage_maintenance",
    "manage_expenses",
    "view_driver_profiles",
    "view_analytics"
  ],
  dispatcher: ["view_dashboard", "manage_trips"],
  safety_officer: ["view_dashboard", "manage_maintenance", "view_driver_profiles"],
  financial_analyst: ["view_dashboard", "manage_expenses", "view_analytics"]
};

export function can(role: Role, action: Action): boolean {
  return permissions[role].includes(action);
}
