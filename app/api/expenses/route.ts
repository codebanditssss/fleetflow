import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toDriver, toExpense, toTrip, toVehicle } from "@/lib/store";
import { clearAppCache } from "@/lib/cache";

const createExpenseSchema = z.object({
  tripId: z.string().optional(),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  distanceKm: z.number().min(0).optional(),
  fuelCost: z.number().min(0),
  miscCost: z.number().min(0).default(0),
  status: z.enum(["new", "done"]).optional(),
  notes: z.string().optional(),
  spentAt: z.string().optional()
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_expenses") && !can(session.role, "view_dashboard")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const [expensesRaw, tripsRaw, driversRaw, vehiclesRaw] = await Promise.all([
    prisma.expense.findMany({
      where: !status || status === "all" ? {} : { status: status as "new" | "done" },
      orderBy: { spentAt: "desc" }
    }),
    prisma.trip.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.driver.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return NextResponse.json({
    expenses: expensesRaw.map(toExpense),
    trips: tripsRaw.map(toTrip),
    drivers: driversRaw.map(toDriver),
    vehicles: vehiclesRaw.map(toVehicle)
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_expenses")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid expense payload." }, { status: 400 });
  }

  let trip = null as Awaited<ReturnType<typeof prisma.trip.findUnique>> | null;
  let driverId = parsed.data.driverId;
  let vehicleId = parsed.data.vehicleId;
  if (parsed.data.tripId) {
    trip = await prisma.trip.findUnique({ where: { id: parsed.data.tripId } });
    if (!trip) {
      return NextResponse.json({ message: "Trip not found." }, { status: 404 });
    }
    driverId = trip.driverId;
    vehicleId = trip.vehicleId;
  }

  if (!driverId || !vehicleId) {
    return NextResponse.json({ message: "Driver and vehicle are required (or provide Trip ID)." }, { status: 400 });
  }

  const [driver, vehicle] = await Promise.all([
    prisma.driver.findUnique({ where: { id: driverId } }),
    prisma.vehicle.findUnique({ where: { id: vehicleId } })
  ]);
  if (!driver || !vehicle) {
    return NextResponse.json({ message: "Driver or vehicle not found." }, { status: 404 });
  }

  const expense = await prisma.expense.create({
    data: {
      tripId: parsed.data.tripId,
      driverId,
      vehicleId,
      distanceKm: parsed.data.distanceKm ?? trip?.distanceKm ?? null,
      fuelCost: parsed.data.fuelCost,
      miscCost: parsed.data.miscCost ?? 0,
      status: parsed.data.status ?? "new",
      notes: parsed.data.notes,
      spentAt: parsed.data.spentAt ? new Date(parsed.data.spentAt) : new Date()
    }
  });

  clearAppCache();
  return NextResponse.json({ expense: toExpense(expense) }, { status: 201 });
}
