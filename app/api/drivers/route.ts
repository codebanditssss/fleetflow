import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toDriver } from "@/lib/store";
import { lockExpiredDrivers } from "@/lib/rules";
import { cacheGet, cacheSet, clearAppCache } from "@/lib/cache";
import { Driver } from "@/lib/types";

const createDriverSchema = z.object({
  name: z.string().min(2),
  licenseNumber: z.string().min(3),
  licenseExpiry: z.string().min(8),
  safetyScore: z.number().min(0).max(100).default(80),
  complaints: z.number().min(0).default(0),
  status: z.enum(["available", "on_duty", "off_duty", "suspended"]).optional(),
  region: z.string().min(2)
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "view_driver_profiles") && !can(session.role, "view_dashboard")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await lockExpiredDrivers();
  const cacheKey = `drivers:${session.email}`;
  const cached = cacheGet<{ drivers: Driver[] }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "private, max-age=20" } });
  }
  const [driversRaw, tripsRaw] = await Promise.all([
    prisma.driver.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.trip.findMany()
  ]);

  const completionMap = new Map<string, { completed: number; total: number }>();
  for (const trip of tripsRaw) {
    const row = completionMap.get(trip.driverId) ?? { completed: 0, total: 0 };
    if (trip.status === "completed" || trip.status === "cancelled") {
      row.total += 1;
      if (trip.status === "completed") {
        row.completed += 1;
      }
    }
    completionMap.set(trip.driverId, row);
  }

  const drivers = driversRaw.map((driver) => {
    const base = toDriver(driver);
    const stats = completionMap.get(driver.id);
    return {
      ...base,
      completionRate: stats && stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    };
  });

  const payload = { drivers };
  cacheSet(cacheKey, payload, 20000);
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, max-age=20" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "view_driver_profiles")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid driver payload." }, { status: 400 });
  }

  const driver = await prisma.driver
    .create({
      data: {
        ...parsed.data,
        licenseExpiry: new Date(parsed.data.licenseExpiry),
        status: parsed.data.status ?? "available"
      }
    })
    .catch(() => null);

  if (!driver) {
    return NextResponse.json({ message: "Driver creation failed. License number may already exist." }, { status: 409 });
  }
  clearAppCache();
  return NextResponse.json({ driver: toDriver(driver) }, { status: 201 });
}
