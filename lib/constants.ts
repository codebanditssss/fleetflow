import { Role } from "@/lib/types";

export const ROLE_LABELS: Record<Role, string> = {
  manager: "Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst"
};

export const DEMO_USER_HINTS: Array<{ email: string; role: Role }> = [
  { email: "manager@fleetflow.local", role: "manager" },
  { email: "dispatcher@fleetflow.local", role: "dispatcher" },
  { email: "safety@fleetflow.local", role: "safety_officer" },
  { email: "finance@fleetflow.local", role: "financial_analyst" }
];
