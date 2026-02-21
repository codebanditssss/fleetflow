"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { DEMO_USER_HINTS, ROLE_LABELS } from "@/lib/constants";
import { Driver, Expense, Role, ServiceLog, Trip, TripStatus, UserSession, Vehicle } from "@/lib/types";

type DashboardData = {
  kpis: {
    activeFleet: number;
    maintenanceAlerts: number;
    utilizationRate: number;
    pendingCargo: number;
  };
  safety: {
    expiringLicenses: number;
    lowSafetyDrivers: number;
  };
  vehicles: Vehicle[];
  trips: Trip[];
};

type TripsData = {
  trips: Trip[];
  availableVehicles: Vehicle[];
  availableDrivers: Driver[];
};

type MaintenanceData = {
  logs: ServiceLog[];
  vehicles: Vehicle[];
};

type ExpenseData = {
  expenses: Expense[];
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
};

type DriverData = {
  drivers: Driver[];
};

type AnalyticsData = {
  cards: {
    totalFuelCost: number;
    utilizationRate: number;
    fleetRoi: number;
    deadStockCount: number;
    totalExpenseCost: number;
  };
  monthlySummary: Array<{
    month: string;
    revenue: number;
    fuelCost: number;
    maintenanceCost: number;
    netProfit: number;
  }>;
};

type Tab = "dashboard" | "vehicles" | "trips" | "maintenance" | "expenses" | "drivers" | "analytics";

const baseFilters = { type: "all", status: "all", region: "all" };

function toCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function HomePage(): React.JSX.Element {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("dashboard");

  const [loginEmail, setLoginEmail] = useState("manager@fleetflow.local");
  const [loginPassword, setLoginPassword] = useState("fleet123");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<Role>("dispatcher");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devResetToken, setDevResetToken] = useState("");

  const [filters, setFilters] = useState(baseFilters);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tripsData, setTripsData] = useState<TripsData | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [vehicleForm, setVehicleForm] = useState({
    name: "",
    model: "",
    licensePlate: "",
    maxCapacityKg: 0,
    odometerKm: 0,
    type: "truck",
    region: "North"
  });

  const [tripForm, setTripForm] = useState({
    origin: "",
    destination: "",
    cargoWeightKg: 0,
    distanceKm: 0,
    revenue: 0,
    estimatedFuelCost: 0,
    vehicleId: "",
    driverId: "",
    region: "North"
  });

  const [serviceForm, setServiceForm] = useState({
    vehicleId: "",
    issue: "",
    serviceDate: new Date().toISOString().slice(0, 10),
    cost: 0,
    notes: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    tripId: "",
    driverId: "",
    vehicleId: "",
    distanceKm: 0,
    fuelCost: 0,
    miscCost: 0,
    notes: "",
    spentAt: new Date().toISOString().slice(0, 10)
  });

  const [driverForm, setDriverForm] = useState({
    name: "",
    licenseNumber: "",
    licenseExpiry: new Date().toISOString().slice(0, 10),
    safetyScore: 80,
    complaints: 0,
    region: "North"
  });

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleSort, setVehicleSort] = useState("model");
  const [vehicleGroup, setVehicleGroup] = useState("none");
  const [vehiclePage, setVehiclePage] = useState(1);

  const [tripSearch, setTripSearch] = useState("");
  const [tripSort, setTripSort] = useState("createdAt");
  const [tripGroup, setTripGroup] = useState("none");
  const [tripPage, setTripPage] = useState(1);

  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceSort, setServiceSort] = useState("serviceDate");
  const [serviceGroup, setServiceGroup] = useState("none");
  const [servicePage, setServicePage] = useState(1);

  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseSort, setExpenseSort] = useState("spentAt");
  const [expenseGroup, setExpenseGroup] = useState("none");
  const [expensePage, setExpensePage] = useState(1);

  const [driverSearch, setDriverSearch] = useState("");
  const [driverSort, setDriverSort] = useState("name");
  const [driverGroup, setDriverGroup] = useState("none");
  const [driverPage, setDriverPage] = useState(1);

  const tabsForRole = useMemo<Record<Role, Tab[]>>(
    () => ({
      manager: ["dashboard", "vehicles", "trips", "maintenance", "expenses", "drivers", "analytics"],
      dispatcher: ["dashboard", "trips"],
      safety_officer: ["dashboard", "maintenance", "drivers"],
      financial_analyst: ["dashboard", "expenses", "analytics"]
    }),
    []
  );

  const availableTabs: Tab[] = session ? tabsForRole[session.role] : ["dashboard"];
  const canManageVehicles = session?.role === "manager";
  const canManageTrips = session?.role === "manager" || session?.role === "dispatcher";
  const canManageMaintenance = session?.role === "manager" || session?.role === "safety_officer";
  const canManageExpenses = session?.role === "manager" || session?.role === "financial_analyst";
  const canManageDrivers = session?.role === "manager" || session?.role === "safety_officer";

  const pageSize = 8;

  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.toLowerCase().trim();
    const list = vehicles.filter((v) => {
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.licensePlate.toLowerCase().includes(q) ||
        v.region.toLowerCase().includes(q)
      );
    });
    const sorted = [...list].sort((a, b) => {
      if (vehicleSort === "capacity") return b.maxCapacityKg - a.maxCapacityKg;
      if (vehicleSort === "status") return a.status.localeCompare(b.status);
      if (vehicleSort === "odometer") return b.odometerKm - a.odometerKm;
      return a.model.localeCompare(b.model);
    });
    return sorted;
  }, [vehicles, vehicleSearch, vehicleSort]);
  const pagedVehicles = filteredVehicles.slice((vehiclePage - 1) * pageSize, vehiclePage * pageSize);

  const filteredTrips = useMemo(() => {
    const list = tripsData?.trips ?? [];
    const q = tripSearch.toLowerCase().trim();
    const searched = list.filter((t) => {
      if (!q) return true;
      return (
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.region.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      );
    });
    return [...searched].sort((a, b) => {
      if (tripSort === "cargo") return b.cargoWeightKg - a.cargoWeightKg;
      if (tripSort === "status") return a.status.localeCompare(b.status);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tripsData, tripSearch, tripSort]);
  const pagedTrips = filteredTrips.slice((tripPage - 1) * pageSize, tripPage * pageSize);

  const filteredServiceLogs = useMemo(() => {
    const list = maintenanceData?.logs ?? [];
    const q = serviceSearch.toLowerCase().trim();
    const searched = list.filter((s) => (!q ? true : s.issue.toLowerCase().includes(q) || s.vehicleId.toLowerCase().includes(q)));
    return [...searched].sort((a, b) => {
      if (serviceSort === "cost") return b.cost - a.cost;
      if (serviceSort === "status") return a.status.localeCompare(b.status);
      return b.serviceDate.localeCompare(a.serviceDate);
    });
  }, [maintenanceData, serviceSearch, serviceSort]);
  const pagedServiceLogs = filteredServiceLogs.slice((servicePage - 1) * pageSize, servicePage * pageSize);

  const filteredExpenses = useMemo(() => {
    const list = expenseData?.expenses ?? [];
    const q = expenseSearch.toLowerCase().trim();
    const searched = list.filter((e) =>
      !q
        ? true
        : (e.tripId ?? "").toLowerCase().includes(q) ||
          e.driverId.toLowerCase().includes(q) ||
          e.vehicleId.toLowerCase().includes(q) ||
          (e.notes ?? "").toLowerCase().includes(q)
    );
    return [...searched].sort((a, b) => {
      if (expenseSort === "fuel") return b.fuelCost - a.fuelCost;
      if (expenseSort === "misc") return b.miscCost - a.miscCost;
      if (expenseSort === "status") return a.status.localeCompare(b.status);
      return b.spentAt.localeCompare(a.spentAt);
    });
  }, [expenseData, expenseSearch, expenseSort]);
  const pagedExpenses = filteredExpenses.slice((expensePage - 1) * pageSize, expensePage * pageSize);

  const filteredDrivers = useMemo(() => {
    const list = driverData?.drivers ?? [];
    const q = driverSearch.toLowerCase().trim();
    const searched = list.filter((d) =>
      !q ? true : d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q) || d.region.toLowerCase().includes(q)
    );
    return [...searched].sort((a, b) => {
      if (driverSort === "safety") return b.safetyScore - a.safetyScore;
      if (driverSort === "complaints") return b.complaints - a.complaints;
      if (driverSort === "expiry") return a.licenseExpiry.localeCompare(b.licenseExpiry);
      if (driverSort === "completion") return (b.completionRate ?? 0) - (a.completionRate ?? 0);
      return a.name.localeCompare(b.name);
    });
  }, [driverData, driverSearch, driverSort]);
  const pagedDrivers = filteredDrivers.slice((driverPage - 1) * pageSize, driverPage * pageSize);

  useEffect(() => {
    void bootSession();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const tokenInUrl = new URLSearchParams(window.location.search).get("resetToken");
    if (tokenInUrl) {
      setResetToken(tokenInUrl);
      setDevResetToken(tokenInUrl);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    const tasks: Array<Promise<void>> = [loadDashboard()];
    if (availableTabs.includes("vehicles")) {
      tasks.push(loadVehicles());
    }
    if (availableTabs.includes("trips")) {
      tasks.push(loadTrips());
    }
    if (availableTabs.includes("maintenance")) {
      tasks.push(loadMaintenance());
    }
    if (availableTabs.includes("expenses")) {
      tasks.push(loadExpenses());
    }
    if (availableTabs.includes("drivers")) {
      tasks.push(loadDrivers());
    }
    if (availableTabs.includes("analytics")) {
      tasks.push(loadAnalytics());
    }
    void Promise.all(tasks);
  }, [session, filters, availableTabs]);

  async function bootSession(): Promise<void> {
    try {
      setLoading(true);
      const response = await fetch("/api/me");
      if (!response.ok) {
        setSession(null);
        return;
      }
      const payload = (await response.json()) as { user: UserSession };
      setSession(payload.user);
      setTab("dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function login(): Promise<void> {
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    await bootSession();
  }

  async function signup(): Promise<void> {
    setError("");
    if (!signupName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!signupEmail.trim()) {
      setError("Email is required.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: signupRole
      })
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    await bootSession();
  }

  async function requestReset(): Promise<void> {
    setError("");
    const email = (resetEmail || loginEmail).trim();
    if (!email) {
      setError("Enter your email in Sign In or Reset Email first.");
      return;
    }
    const response = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const payload = (await response.json()) as { message: string; token?: string };
    if (!response.ok) {
      setError(payload.message);
      return;
    }
    setError(payload.message);
    if (payload.token) {
      setDevResetToken(payload.token);
      setResetToken(payload.token);
    }
  }

  async function submitReset(): Promise<void> {
    setError("");
    if (!resetToken.trim()) {
      setError("Reset token is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword })
    });
    const payload = (await response.json()) as { message: string };
    if (!response.ok) {
      setError(payload.message);
      return;
    }
    setResetToken("");
    setNewPassword("");
    setError(payload.message);
  }

  async function logout(): Promise<void> {
    await fetch("/api/logout", { method: "POST" });
    setSession(null);
    setDashboard(null);
    setVehicles([]);
    setTripsData(null);
    setMaintenanceData(null);
    setExpenseData(null);
    setDriverData(null);
    setAnalytics(null);
  }

  async function loadDashboard(): Promise<void> {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/dashboard?${query}`);
    if (response.ok) {
      setDashboard((await response.json()) as DashboardData);
    }
  }

  async function loadVehicles(): Promise<void> {
    const response = await fetch("/api/vehicles");
    if (response.ok) {
      setVehicles(((await response.json()) as { vehicles: Vehicle[] }).vehicles);
    }
  }

  async function loadTrips(): Promise<void> {
    const response = await fetch("/api/trips");
    if (response.ok) {
      setTripsData((await response.json()) as TripsData);
    }
  }

  async function loadMaintenance(): Promise<void> {
    const response = await fetch("/api/maintenance");
    if (response.ok) {
      setMaintenanceData((await response.json()) as MaintenanceData);
    }
  }

  async function loadExpenses(): Promise<void> {
    const response = await fetch("/api/expenses");
    if (response.ok) {
      setExpenseData((await response.json()) as ExpenseData);
    }
  }

  async function loadDrivers(): Promise<void> {
    const response = await fetch("/api/drivers");
    if (response.ok) {
      setDriverData((await response.json()) as DriverData);
    }
  }

  async function loadAnalytics(): Promise<void> {
    const response = await fetch("/api/analytics");
    if (response.ok) {
      setAnalytics((await response.json()) as AnalyticsData);
    }
  }

  async function createVehicle(): Promise<void> {
    setError("");
    const response = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vehicleForm)
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    setVehicleForm({
      name: "",
      model: "",
      licensePlate: "",
      maxCapacityKg: 0,
      odometerKm: 0,
      type: "truck",
      region: "North"
    });
    await Promise.all([loadVehicles(), loadDashboard()]);
  }

  async function retireVehicle(id: string, outOfService: boolean): Promise<void> {
    const response = await fetch(`/api/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outOfService })
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    await Promise.all([loadVehicles(), loadDashboard(), loadTrips(), loadMaintenance()]);
  }

  async function createTrip(): Promise<void> {
    setError("");
    const response = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripForm)
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    setTripForm({
      origin: "",
      destination: "",
      cargoWeightKg: 0,
      distanceKm: 0,
      revenue: 0,
      estimatedFuelCost: 0,
      vehicleId: "",
      driverId: "",
      region: "North"
    });
    await Promise.all([loadTrips(), loadDashboard(), loadAnalytics()]);
  }

  async function updateTripStatus(id: string, status: TripStatus): Promise<void> {
    setError("");
    const response = await fetch(`/api/trips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    await Promise.all([loadTrips(), loadDashboard(), loadVehicles(), loadDrivers()]);
  }

  async function createServiceLog(): Promise<void> {
    setError("");
    const response = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serviceForm)
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    setServiceForm({
      vehicleId: "",
      issue: "",
      serviceDate: new Date().toISOString().slice(0, 10),
      cost: 0,
      notes: ""
    });
    await Promise.all([loadMaintenance(), loadVehicles(), loadDashboard(), loadTrips()]);
  }

  async function updateServiceStatus(id: string, status: "open" | "in_progress" | "completed"): Promise<void> {
    const response = await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    await Promise.all([loadMaintenance(), loadVehicles(), loadDashboard(), loadTrips()]);
  }

  async function createExpense(): Promise<void> {
    setError("");
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...expenseForm,
        tripId: expenseForm.tripId || undefined,
        driverId: expenseForm.driverId || undefined,
        vehicleId: expenseForm.vehicleId || undefined
      })
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    setExpenseForm({
      tripId: "",
      driverId: "",
      vehicleId: "",
      distanceKm: 0,
      fuelCost: 0,
      miscCost: 0,
      notes: "",
      spentAt: new Date().toISOString().slice(0, 10)
    });
    await Promise.all([loadExpenses(), loadAnalytics()]);
  }

  async function createDriver(): Promise<void> {
    setError("");
    const response = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(driverForm)
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    setDriverForm({
      name: "",
      licenseNumber: "",
      licenseExpiry: new Date().toISOString().slice(0, 10),
      safetyScore: 80,
      complaints: 0,
      region: "North"
    });
    await Promise.all([loadDrivers(), loadTrips(), loadDashboard()]);
  }

  async function updateDriverStatus(id: string, status: Driver["status"]): Promise<void> {
    const response = await fetch(`/api/drivers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      setError(((await response.json()) as { message: string }).message);
      return;
    }
    await Promise.all([loadDrivers(), loadTrips(), loadDashboard()]);
  }

  function nextLifecycle(status: TripStatus): TripStatus[] {
    if (status === "draft") {
      return ["dispatched", "cancelled"];
    }
    if (status === "dispatched") {
      return ["completed", "cancelled"];
    }
    return [];
  }

  function statusClass(status: string): string {
    return `badge status-${status}`;
  }

  function downloadReport(format: "csv" | "pdf"): void {
    window.open(`/api/analytics/report?format=${format}`, "_blank");
  }

  if (loading) {
    return <main className="shell">Loading FleetFlow...</main>;
  }

  if (!session) {
    return (
      <>
        <header className="topbar">
          <div className="topbar-inner">
            <div>
              <h1 className="text-2xl font-semibold m-0">FleetFlow</h1>
              <p className="muted m-0">Modular Fleet &amp; Logistics Management System</p>
            </div>
          </div>
        </header>
        <main className="shell">
          <section className="card card-pad max-w-3xl">
            <h2 className="text-xl font-semibold mt-0">Login &amp; Authentication</h2>
            <div className="grid-2">
              <article className="card card-pad">
                <h3 className="text-base mt-0 mb-2">Sign In</h3>
                <div className="form-grid">
                  <div>
                    <label>Email</label>
                    <input value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                  </div>
                  <div>
                    <label>Password</label>
                    <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
                  </div>
                </div>
                <div className="btn-row mt-3">
                  <button className="btn" onClick={() => void login()}>
                    Sign In
                  </button>
                  <button className="btn secondary" onClick={() => void requestReset()}>
                    Forgot Password
                  </button>
                </div>
                <div className="form-grid mt-3">
                  <div>
                    <label>Reset Email</label>
                    <input value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label>Reset Token</label>
                    <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} placeholder="token" />
                  </div>
                  <div>
                    <label>New Password</label>
                    <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                  </div>
                </div>
                <div className="btn-row mt-3">
                  <button className="btn secondary" onClick={() => void submitReset()}>
                    Reset Password
                  </button>
                </div>
                {devResetToken ? (
                  <p className="muted mt-2 mb-0">
                    Dev reset token: <code>{devResetToken}</code>
                  </p>
                ) : null}
              </article>
              <article className="card card-pad">
                <h3 className="text-base mt-0 mb-2">Sign Up</h3>
                <div className="form-grid">
                  <div>
                    <label>Name</label>
                    <input value={signupName} onChange={(event) => setSignupName(event.target.value)} />
                  </div>
                  <div>
                    <label>Email</label>
                    <input value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} />
                  </div>
                  <div>
                    <label>Password</label>
                    <input type="password" value={signupPassword} onChange={(event) => setSignupPassword(event.target.value)} />
                  </div>
                  <div>
                    <label>Role</label>
                    <select value={signupRole} onChange={(event) => setSignupRole(event.target.value as Role)}>
                      <option value="manager">Manager</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="safety_officer">Safety Officer</option>
                      <option value="financial_analyst">Financial Analyst</option>
                    </select>
                  </div>
                </div>
                <div className="btn-row mt-3">
                  <button className="btn" onClick={() => void signup()}>
                    Create Account
                  </button>
                </div>
              </article>
            </div>
            {error ? <p className="text-red-700 mt-3 mb-0">{error}</p> : null}
            <div className="mt-5">
              <h3 className="text-base mb-2">Seeded Users</h3>
              <p className="muted mt-0 mb-2">Default password: <code>fleet123</code></p>
              <ul className="muted m-0 pl-5">
                {DEMO_USER_HINTS.map((user) => (
                  <li key={user.email}>
                    {user.email} ({ROLE_LABELS[user.role]})
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <h1 className="text-2xl font-semibold m-0">FleetFlow</h1>
            <p className="muted m-0">Rule-based fleet, dispatch, safety, and finance operations</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-sm">
              <strong>{session.name}</strong> ({ROLE_LABELS[session.role]})
            </p>
            <button className="btn secondary mt-2" onClick={() => void logout()}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="shell">
        <nav className="tabs">
          {availableTabs.map((item) => (
            <button key={item} className={item === tab ? "active" : ""} onClick={() => setTab(item)}>
              {{
                dashboard: "Dashboard",
                vehicles: "Vehicle Registry",
                trips: "Trip Dispatcher",
                maintenance: "Maintenance",
                expenses: "Trip & Expense",
                drivers: "Performance",
                analytics: "Analytics"
              }[item]}
            </button>
          ))}
        </nav>
        {error ? <p className="text-red-700">{error}</p> : null}

        {tab === "dashboard" && dashboard ? (
          <section className="grid-2">
            <article className="card card-pad">
              <h2 className="mt-0">Command Center</h2>
              <p className="muted">Fleet snapshot with quick filters.</p>
              <div className="form-grid">
                <div>
                  <label>Vehicle Type</label>
                  <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                    <option value="all">All</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>
                <div>
                  <label>Status</label>
                  <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="in_shop">In Shop</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label>Region</label>
                  <select value={filters.region} onChange={(event) => setFilters({ ...filters, region: event.target.value })}>
                    <option value="all">All</option>
                    <option value="North">North</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                  </select>
                </div>
              </div>
            </article>
            <article className="card card-pad">
              <h3 className="mt-0">KPIs</h3>
              <div className="grid-4">
                <div className="kpi">Active Fleet<strong>{dashboard.kpis.activeFleet}</strong></div>
                <div className="kpi">Maintenance Alerts<strong>{dashboard.kpis.maintenanceAlerts}</strong></div>
                <div className="kpi">Utilization Rate<strong>{dashboard.kpis.utilizationRate}%</strong></div>
                <div className="kpi">Pending Cargo<strong>{dashboard.kpis.pendingCargo}</strong></div>
              </div>
              <div className="grid-2 mt-3">
                <p className="muted mb-0">Expiring Licenses: {dashboard.safety.expiringLicenses}</p>
                <p className="muted mb-0">Low Safety Drivers: {dashboard.safety.lowSafetyDrivers}</p>
              </div>
            </article>
          </section>
        ) : null}

        {tab === "vehicles" ? (
          <section className="grid-2">
            {canManageVehicles ? (
              <article className="card card-pad">
                <h2 className="mt-0">New Vehicle Registration</h2>
                <div className="form-grid">
                  <div><label>Name</label><input value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} /></div>
                  <div><label>Model</label><input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
                  <div><label>License Plate</label><input value={vehicleForm.licensePlate} onChange={(e) => setVehicleForm({ ...vehicleForm, licensePlate: e.target.value })} /></div>
                  <div><label>Max Payload (kg)</label><input type="number" value={vehicleForm.maxCapacityKg} onChange={(e) => setVehicleForm({ ...vehicleForm, maxCapacityKg: Number(e.target.value) })} /></div>
                  <div><label>Initial Odometer (km)</label><input type="number" value={vehicleForm.odometerKm} onChange={(e) => setVehicleForm({ ...vehicleForm, odometerKm: Number(e.target.value) })} /></div>
                  <div><label>Type</label><select value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}><option value="truck">Truck</option><option value="van">Van</option><option value="bike">Bike</option></select></div>
                  <div><label>Region</label><input value={vehicleForm.region} onChange={(e) => setVehicleForm({ ...vehicleForm, region: e.target.value })} /></div>
                </div>
                <div className="btn-row mt-3"><button className="btn" onClick={() => void createVehicle()}>Save Vehicle</button></div>
              </article>
            ) : null}
            <article className="card card-pad">
              <h3 className="mt-0">Vehicle Registry</h3>
              <div className="form-grid mb-3">
                <div><label>Search</label><input value={vehicleSearch} onChange={(e) => { setVehicleSearch(e.target.value); setVehiclePage(1); }} /></div>
                <div><label>Sort By</label><select value={vehicleSort} onChange={(e) => setVehicleSort(e.target.value)}><option value="model">Model</option><option value="capacity">Capacity</option><option value="odometer">Odometer</option><option value="status">Status</option></select></div>
                <div><label>Group By</label><select value={vehicleGroup} onChange={(e) => setVehicleGroup(e.target.value)}><option value="none">None</option><option value="type">Type</option><option value="status">Status</option><option value="region">Region</option></select></div>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Plate</th><th>Model</th><th>Type</th><th>Capacity</th><th>Odometer</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pagedVehicles.map((vehicle, idx) => (
                      <Fragment key={vehicle.id}>
                        {vehicleGroup !== "none" && (idx === 0 || (pagedVehicles[idx - 1] as any)[vehicleGroup] !== (vehicle as any)[vehicleGroup]) ? (
                          <tr><td colSpan={7} className="muted"><strong>{vehicleGroup}:</strong> {(vehicle as any)[vehicleGroup]}</td></tr>
                        ) : null}
                        <tr>
                          <td>{vehicle.licensePlate}</td>
                          <td>{vehicle.name} ({vehicle.model})</td>
                          <td>{vehicle.type}</td>
                          <td>{vehicle.maxCapacityKg}</td>
                          <td>{vehicle.odometerKm}</td>
                          <td><span className={statusClass(vehicle.status)}>{vehicle.status}</span></td>
                          <td>
                            {canManageVehicles ? (
                              vehicle.outOfService ? (
                                <button className="btn secondary" onClick={() => void retireVehicle(vehicle.id, false)}>Activate</button>
                              ) : (
                                <button className="btn warn" onClick={() => void retireVehicle(vehicle.id, true)}>Out of Service</button>
                              )
                            ) : (
                              <span className="muted">View only</span>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="btn-row mt-3">
                <button className="btn secondary" disabled={vehiclePage === 1} onClick={() => setVehiclePage((p) => Math.max(1, p - 1))}>Prev</button>
                <span className="muted">Page {vehiclePage} / {Math.max(1, Math.ceil(filteredVehicles.length / pageSize))}</span>
                <button className="btn secondary" disabled={vehiclePage >= Math.ceil(Math.max(1, filteredVehicles.length) / pageSize)} onClick={() => setVehiclePage((p) => p + 1)}>Next</button>
              </div>
            </article>
          </section>
        ) : null}

        {tab === "trips" && tripsData ? (
          <section className="grid-2">
            {canManageTrips ? (
              <article className="card card-pad">
                <h2 className="mt-0">New Trip Form</h2>
                <div className="form-grid">
                  <div><label>Origin</label><input value={tripForm.origin} onChange={(e) => setTripForm({ ...tripForm, origin: e.target.value })} /></div>
                  <div><label>Destination</label><input value={tripForm.destination} onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })} /></div>
                  <div><label>Cargo Weight (kg)</label><input type="number" value={tripForm.cargoWeightKg} onChange={(e) => setTripForm({ ...tripForm, cargoWeightKg: Number(e.target.value) })} /></div>
                  <div><label>Distance (km)</label><input type="number" value={tripForm.distanceKm} onChange={(e) => setTripForm({ ...tripForm, distanceKm: Number(e.target.value) })} /></div>
                  <div><label>Revenue</label><input type="number" value={tripForm.revenue} onChange={(e) => setTripForm({ ...tripForm, revenue: Number(e.target.value) })} /></div>
                  <div><label>Est. Fuel Cost</label><input type="number" value={tripForm.estimatedFuelCost} onChange={(e) => setTripForm({ ...tripForm, estimatedFuelCost: Number(e.target.value) })} /></div>
                  <div>
                    <label>Select Vehicle</label>
                    <select value={tripForm.vehicleId} onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}>
                      <option value="">Select</option>
                      {tripsData.availableVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.maxCapacityKg}kg)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Select Driver</label>
                    <select value={tripForm.driverId} onChange={(e) => setTripForm({ ...tripForm, driverId: e.target.value })}>
                      <option value="">Select</option>
                      {tripsData.availableDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>
                  <div><label>Region</label><input value={tripForm.region} onChange={(e) => setTripForm({ ...tripForm, region: e.target.value })} /></div>
                </div>
                <div className="btn-row mt-3"><button className="btn" onClick={() => void createTrip()}>Save Draft Trip</button></div>
              </article>
            ) : null}
            <article className="card card-pad">
              <h3 className="mt-0">Trip Lifecycle</h3>
              <div className="form-grid mb-3">
                <div><label>Search</label><input value={tripSearch} onChange={(e) => { setTripSearch(e.target.value); setTripPage(1); }} /></div>
                <div><label>Sort By</label><select value={tripSort} onChange={(e) => setTripSort(e.target.value)}><option value="createdAt">Created</option><option value="cargo">Cargo</option><option value="status">Status</option></select></div>
                <div><label>Group By</label><select value={tripGroup} onChange={(e) => setTripGroup(e.target.value)}><option value="none">None</option><option value="status">Status</option><option value="region">Region</option></select></div>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Route</th><th>Cargo</th><th>Status</th><th>Next</th></tr></thead>
                  <tbody>
                    {pagedTrips.map((trip, idx) => (
                      <Fragment key={trip.id}>
                        {tripGroup !== "none" && (idx === 0 || (pagedTrips[idx - 1] as any)[tripGroup] !== (trip as any)[tripGroup]) ? (
                          <tr key={`${trip.id}-group`}><td colSpan={4} className="muted"><strong>{tripGroup}:</strong> {(trip as any)[tripGroup]}</td></tr>
                        ) : null}
                        <tr>
                        <td>{trip.origin} {"->"} {trip.destination}</td>
                        <td>{trip.cargoWeightKg}</td>
                        <td><span className={statusClass(trip.status)}>{trip.status}</span></td>
                        <td>
                          <div className="btn-row">
                            {canManageTrips ? nextLifecycle(trip.status).map((next) => (
                              <button key={next} className={`btn ${next === "cancelled" ? "danger" : "secondary"}`} onClick={() => void updateTripStatus(trip.id, next)}>{next}</button>
                            )) : (
                              <span className="muted">View only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="btn-row mt-3">
                <button className="btn secondary" disabled={tripPage === 1} onClick={() => setTripPage((p) => Math.max(1, p - 1))}>Prev</button>
                <span className="muted">Page {tripPage} / {Math.max(1, Math.ceil(filteredTrips.length / pageSize))}</span>
                <button className="btn secondary" disabled={tripPage >= Math.ceil(Math.max(1, filteredTrips.length) / pageSize)} onClick={() => setTripPage((p) => p + 1)}>Next</button>
              </div>
            </article>
          </section>
        ) : null}

        {tab === "maintenance" && maintenanceData ? (
          <section className="grid-2">
            {canManageMaintenance ? (
              <article className="card card-pad">
                <h2 className="mt-0">Create New Service</h2>
                <p className="muted">Adding a service log automatically pushes vehicle to In Shop.</p>
                <div className="form-grid">
                  <div>
                    <label>Vehicle</label>
                    <select value={serviceForm.vehicleId} onChange={(e) => setServiceForm({ ...serviceForm, vehicleId: e.target.value })}>
                      <option value="">Select</option>
                      {maintenanceData.vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.licensePlate})</option>
                      ))}
                    </select>
                  </div>
                  <div><label>Issue / Service</label><input value={serviceForm.issue} onChange={(e) => setServiceForm({ ...serviceForm, issue: e.target.value })} /></div>
                  <div><label>Date</label><input type="date" value={serviceForm.serviceDate} onChange={(e) => setServiceForm({ ...serviceForm, serviceDate: e.target.value })} /></div>
                  <div><label>Cost</label><input type="number" value={serviceForm.cost} onChange={(e) => setServiceForm({ ...serviceForm, cost: Number(e.target.value) })} /></div>
                  <div><label>Notes</label><input value={serviceForm.notes} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })} /></div>
                </div>
                <div className="btn-row mt-3"><button className="btn" onClick={() => void createServiceLog()}>Create Service</button></div>
              </article>
            ) : null}
            <article className="card card-pad">
              <h3 className="mt-0">Maintenance Logs</h3>
              <div className="form-grid mb-3">
                <div><label>Search</label><input value={serviceSearch} onChange={(e) => { setServiceSearch(e.target.value); setServicePage(1); }} /></div>
                <div><label>Sort By</label><select value={serviceSort} onChange={(e) => setServiceSort(e.target.value)}><option value="serviceDate">Date</option><option value="cost">Cost</option><option value="status">Status</option></select></div>
                <div><label>Group By</label><select value={serviceGroup} onChange={(e) => setServiceGroup(e.target.value)}><option value="none">None</option><option value="status">Status</option><option value="vehicleId">Vehicle</option></select></div>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>ID</th><th>Vehicle</th><th>Issue</th><th>Date</th><th>Cost</th><th>Status</th><th>Update</th></tr></thead>
                  <tbody>
                    {pagedServiceLogs.map((log, idx) => (
                      <Fragment key={log.id}>
                        {serviceGroup !== "none" && (idx === 0 || (pagedServiceLogs[idx - 1] as any)[serviceGroup] !== (log as any)[serviceGroup]) ? (
                          <tr key={`${log.id}-group`}><td colSpan={7} className="muted"><strong>{serviceGroup}:</strong> {(log as any)[serviceGroup]}</td></tr>
                        ) : null}
                        <tr>
                        <td>{log.id.slice(0, 7)}</td>
                        <td>{log.vehicleId.slice(0, 7)}</td>
                        <td>{log.issue}</td>
                        <td>{log.serviceDate}</td>
                        <td>{toCurrency(log.cost)}</td>
                        <td><span className={statusClass(log.status)}>{log.status}</span></td>
                        <td>
                          <div className="btn-row">
                            {canManageMaintenance ? (
                              (["open", "in_progress", "completed"] as const).map((status) => (
                                <button key={status} className="btn secondary" onClick={() => void updateServiceStatus(log.id, status)}>{status}</button>
                              ))
                            ) : (
                              <span className="muted">View only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="btn-row mt-3">
                <button className="btn secondary" disabled={servicePage === 1} onClick={() => setServicePage((p) => Math.max(1, p - 1))}>Prev</button>
                <span className="muted">Page {servicePage} / {Math.max(1, Math.ceil(filteredServiceLogs.length / pageSize))}</span>
                <button className="btn secondary" disabled={servicePage >= Math.ceil(Math.max(1, filteredServiceLogs.length) / pageSize)} onClick={() => setServicePage((p) => p + 1)}>Next</button>
              </div>
            </article>
          </section>
        ) : null}

        {tab === "expenses" && expenseData ? (
          <section className="grid-2">
            {canManageExpenses ? (
              <article className="card card-pad">
                <h2 className="mt-0">Add an Expense</h2>
                <div className="form-grid">
                  <div>
                    <label>Trip ID (optional)</label>
                    <select value={expenseForm.tripId} onChange={(e) => setExpenseForm({ ...expenseForm, tripId: e.target.value })}>
                      <option value="">Manual</option>
                      {expenseData.trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>{trip.id.slice(0, 7)} - {trip.origin}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Driver</label>
                    <select value={expenseForm.driverId} onChange={(e) => setExpenseForm({ ...expenseForm, driverId: e.target.value })}>
                      <option value="">Select</option>
                      {expenseData.drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Vehicle</label>
                    <select value={expenseForm.vehicleId} onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}>
                      <option value="">Select</option>
                      {expenseData.vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
                      ))}
                    </select>
                  </div>
                  <div><label>Distance (km)</label><input type="number" value={expenseForm.distanceKm} onChange={(e) => setExpenseForm({ ...expenseForm, distanceKm: Number(e.target.value) })} /></div>
                  <div><label>Fuel Cost</label><input type="number" value={expenseForm.fuelCost} onChange={(e) => setExpenseForm({ ...expenseForm, fuelCost: Number(e.target.value) })} /></div>
                  <div><label>Misc Cost</label><input type="number" value={expenseForm.miscCost} onChange={(e) => setExpenseForm({ ...expenseForm, miscCost: Number(e.target.value) })} /></div>
                  <div><label>Date</label><input type="date" value={expenseForm.spentAt} onChange={(e) => setExpenseForm({ ...expenseForm, spentAt: e.target.value })} /></div>
                  <div><label>Notes</label><input value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} /></div>
                </div>
                <div className="btn-row mt-3"><button className="btn" onClick={() => void createExpense()}>Create Expense</button></div>
              </article>
            ) : null}
            <article className="card card-pad">
              <h3 className="mt-0">Expense Logs</h3>
              <div className="form-grid mb-3">
                <div><label>Search</label><input value={expenseSearch} onChange={(e) => { setExpenseSearch(e.target.value); setExpensePage(1); }} /></div>
                <div><label>Sort By</label><select value={expenseSort} onChange={(e) => setExpenseSort(e.target.value)}><option value="spentAt">Date</option><option value="fuel">Fuel</option><option value="misc">Misc</option><option value="status">Status</option></select></div>
                <div><label>Group By</label><select value={expenseGroup} onChange={(e) => setExpenseGroup(e.target.value)}><option value="none">None</option><option value="status">Status</option><option value="driverId">Driver</option><option value="vehicleId">Vehicle</option></select></div>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Trip</th><th>Driver</th><th>Vehicle</th><th>Fuel</th><th>Misc</th><th>Status</th></tr></thead>
                  <tbody>
                    {pagedExpenses.map((item, idx) => (
                      <Fragment key={item.id}>
                        {expenseGroup !== "none" && (idx === 0 || (pagedExpenses[idx - 1] as any)[expenseGroup] !== (item as any)[expenseGroup]) ? (
                          <tr key={`${item.id}-group`}><td colSpan={6} className="muted"><strong>{expenseGroup}:</strong> {(item as any)[expenseGroup]}</td></tr>
                        ) : null}
                        <tr>
                        <td>{item.tripId?.slice(0, 7) ?? "-"}</td>
                        <td>{item.driverId.slice(0, 7)}</td>
                        <td>{item.vehicleId.slice(0, 7)}</td>
                        <td>{toCurrency(item.fuelCost)}</td>
                        <td>{toCurrency(item.miscCost)}</td>
                        <td><span className={statusClass(item.status)}>{item.status}</span></td>
                      </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="btn-row mt-3">
                <button className="btn secondary" disabled={expensePage === 1} onClick={() => setExpensePage((p) => Math.max(1, p - 1))}>Prev</button>
                <span className="muted">Page {expensePage} / {Math.max(1, Math.ceil(filteredExpenses.length / pageSize))}</span>
                <button className="btn secondary" disabled={expensePage >= Math.ceil(Math.max(1, filteredExpenses.length) / pageSize)} onClick={() => setExpensePage((p) => p + 1)}>Next</button>
              </div>
            </article>
          </section>
        ) : null}

        {tab === "drivers" && driverData ? (
          <section className="grid-2">
            {canManageDrivers ? (
              <article className="card card-pad">
                <h2 className="mt-0">Driver Profile</h2>
                <div className="form-grid">
                  <div><label>Name</label><input value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} /></div>
                  <div><label>License #</label><input value={driverForm.licenseNumber} onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })} /></div>
                  <div><label>License Expiry</label><input type="date" value={driverForm.licenseExpiry} onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })} /></div>
                  <div><label>Safety Score</label><input type="number" value={driverForm.safetyScore} onChange={(e) => setDriverForm({ ...driverForm, safetyScore: Number(e.target.value) })} /></div>
                  <div><label>Complaints</label><input type="number" value={driverForm.complaints} onChange={(e) => setDriverForm({ ...driverForm, complaints: Number(e.target.value) })} /></div>
                  <div><label>Region</label><input value={driverForm.region} onChange={(e) => setDriverForm({ ...driverForm, region: e.target.value })} /></div>
                </div>
                <div className="btn-row mt-3"><button className="btn" onClick={() => void createDriver()}>Create Driver</button></div>
              </article>
            ) : null}
            <article className="card card-pad">
              <h3 className="mt-0">Driver Performance & Safety</h3>
              <div className="form-grid mb-3">
                <div><label>Search</label><input value={driverSearch} onChange={(e) => { setDriverSearch(e.target.value); setDriverPage(1); }} /></div>
                <div><label>Sort By</label><select value={driverSort} onChange={(e) => setDriverSort(e.target.value)}><option value="name">Name</option><option value="safety">Safety</option><option value="completion">Completion</option><option value="complaints">Complaints</option><option value="expiry">Expiry</option></select></div>
                <div><label>Group By</label><select value={driverGroup} onChange={(e) => setDriverGroup(e.target.value)}><option value="none">None</option><option value="status">Status</option><option value="region">Region</option></select></div>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Name</th><th>License</th><th>Expiry</th><th>Completion</th><th>Safety</th><th>Complaints</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pagedDrivers.map((driver, idx) => (
                      <Fragment key={driver.id}>
                        {driverGroup !== "none" && (idx === 0 || (pagedDrivers[idx - 1] as any)[driverGroup] !== (driver as any)[driverGroup]) ? (
                          <tr key={`${driver.id}-group`}><td colSpan={8} className="muted"><strong>{driverGroup}:</strong> {(driver as any)[driverGroup]}</td></tr>
                        ) : null}
                        <tr>
                        <td>{driver.name}</td>
                        <td>{driver.licenseNumber}</td>
                        <td>{driver.licenseExpiry}</td>
                        <td>{driver.completionRate ?? 0}%</td>
                        <td>{driver.safetyScore}%</td>
                        <td>{driver.complaints}</td>
                        <td><span className={statusClass(driver.status)}>{driver.status}</span></td>
                        <td>
                          <div className="btn-row">
                            {canManageDrivers ? (
                              <>
                                <button className="btn secondary" onClick={() => void updateDriverStatus(driver.id, "available")}>Available</button>
                                <button className="btn secondary" onClick={() => void updateDriverStatus(driver.id, "off_duty")}>Break</button>
                                <button className="btn danger" onClick={() => void updateDriverStatus(driver.id, "suspended")}>Suspend</button>
                              </>
                            ) : (
                              <span className="muted">View only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="btn-row mt-3">
                <button className="btn secondary" disabled={driverPage === 1} onClick={() => setDriverPage((p) => Math.max(1, p - 1))}>Prev</button>
                <span className="muted">Page {driverPage} / {Math.max(1, Math.ceil(filteredDrivers.length / pageSize))}</span>
                <button className="btn secondary" disabled={driverPage >= Math.ceil(Math.max(1, filteredDrivers.length) / pageSize)} onClick={() => setDriverPage((p) => p + 1)}>Next</button>
              </div>
            </article>
          </section>
        ) : null}

        {tab === "analytics" && analytics ? (
          <section className="grid-2">
            <article className="card card-pad">
              <h2 className="mt-0">Operational Analytics</h2>
              <div className="grid-4">
                <div className="kpi">Total Fuel Cost<strong>{toCurrency(analytics.cards.totalFuelCost)}</strong></div>
                <div className="kpi">Utilization Rate<strong>{analytics.cards.utilizationRate}%</strong></div>
                <div className="kpi">Fleet ROI<strong>{analytics.cards.fleetRoi}%</strong></div>
                <div className="kpi">Dead Stock Alerts<strong>{analytics.cards.deadStockCount}</strong></div>
              </div>
              <p className="muted mt-3 mb-0">Total Expense Cost: {toCurrency(analytics.cards.totalExpenseCost)}</p>
              <div className="btn-row mt-3">
                <button className="btn secondary" onClick={() => downloadReport("csv")}>Download CSV Report</button>
                <button className="btn secondary" onClick={() => downloadReport("pdf")}>Download PDF Report</button>
              </div>
            </article>
            <article className="card card-pad">
              <h3 className="mt-0">Financial Summary By Month</h3>
              <div className="overflow-x-auto">
                <table>
                  <thead><tr><th>Month</th><th>Revenue</th><th>Fuel+Misc</th><th>Maintenance</th><th>Net Profit</th></tr></thead>
                  <tbody>
                    {analytics.monthlySummary.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>{toCurrency(row.revenue)}</td>
                        <td>{toCurrency(row.fuelCost)}</td>
                        <td>{toCurrency(row.maintenanceCost)}</td>
                        <td>{toCurrency(row.netProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        ) : null}
      </main>
    </>
  );
}
