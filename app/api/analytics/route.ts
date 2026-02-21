import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { cacheGet, cacheSet } from "@/lib/cache";

type MonthRow = {
  month: string;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  netProfit: number;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "view_analytics")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const cacheKey = `analytics:${session.email}`;
  const cached = cacheGet<{
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
  }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "private, max-age=30"
      }
    });
  }

  const [expenses, trips, vehicles, maintenanceLogs] = await Promise.all([
    prisma.expense.findMany(),
    prisma.trip.findMany(),
    prisma.vehicle.findMany(),
    prisma.serviceLog.findMany()
  ]);

  const totalFuelCost = expenses.reduce((sum, item) => sum + item.fuelCost, 0);
  const totalMiscCost = expenses.reduce((sum, item) => sum + item.miscCost, 0);
  const totalMaintenance = maintenanceLogs.reduce((sum, item) => sum + item.cost, 0);
  const totalRevenue = trips.reduce((sum, item) => sum + (item.revenue ?? 0), 0);

  const operationalVehicles = vehicles.filter((v) => !v.outOfService).length;
  const utilizedVehicles = vehicles.filter((v) => v.status === "on_trip" || v.status === "in_shop").length;
  const utilizationRate = operationalVehicles === 0 ? 0 : Math.round((utilizedVehicles / operationalVehicles) * 100);

  const roi = totalFuelCost + totalMiscCost + totalMaintenance === 0
    ? 0
    : Number((((totalRevenue - (totalFuelCost + totalMiscCost + totalMaintenance)) / (totalFuelCost + totalMiscCost + totalMaintenance)) * 100).toFixed(2));

  const idleVehicles = vehicles.filter((vehicle) => vehicle.status === "available" && !vehicle.outOfService).length;

  const monthMap = new Map<string, MonthRow>();
  for (const trip of trips) {
    const month = `${trip.createdAt.getUTCFullYear()}-${String(trip.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
    const row = monthMap.get(month) ?? { month, revenue: 0, fuelCost: 0, maintenanceCost: 0, netProfit: 0 };
    row.revenue += trip.revenue ?? 0;
    monthMap.set(month, row);
  }
  for (const expense of expenses) {
    const month = `${expense.spentAt.getUTCFullYear()}-${String(expense.spentAt.getUTCMonth() + 1).padStart(2, "0")}`;
    const row = monthMap.get(month) ?? { month, revenue: 0, fuelCost: 0, maintenanceCost: 0, netProfit: 0 };
    row.fuelCost += expense.fuelCost + expense.miscCost;
    monthMap.set(month, row);
  }
  for (const service of maintenanceLogs) {
    const month = `${service.serviceDate.getUTCFullYear()}-${String(service.serviceDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const row = monthMap.get(month) ?? { month, revenue: 0, fuelCost: 0, maintenanceCost: 0, netProfit: 0 };
    row.maintenanceCost += service.cost;
    monthMap.set(month, row);
  }

  const monthlySummary = [...monthMap.values()]
    .map((row) => ({
      ...row,
      netProfit: row.revenue - row.fuelCost - row.maintenanceCost
    }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  const payload = {
    cards: {
      totalFuelCost,
      utilizationRate,
      fleetRoi: roi,
      deadStockCount: idleVehicles,
      totalExpenseCost: totalFuelCost + totalMiscCost + totalMaintenance
    },
    monthlySummary
  };
  cacheSet(cacheKey, payload, 30000);
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=30"
    }
  });
}
