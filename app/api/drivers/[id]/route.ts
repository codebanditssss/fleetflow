import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toDriver } from "@/lib/store";
import { lockExpiredDrivers } from "@/lib/rules";
import { clearAppCache } from "@/lib/cache";

const patchDriverSchema = z.object({
  name: z.string().min(2).optional(),
  licenseNumber: z.string().min(3).optional(),
  licenseExpiry: z.string().min(8).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  complaints: z.number().min(0).optional(),
  status: z.enum(["available", "on_duty", "off_duty", "suspended"]).optional(),
  region: z.string().min(2).optional()
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "view_driver_profiles")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid driver update payload." }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await prisma.driver.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Driver not found." }, { status: 404 });
  }

  const driver = await prisma.driver
    .update({
      where: { id },
      data: {
        ...parsed.data,
        licenseExpiry: parsed.data.licenseExpiry ? new Date(parsed.data.licenseExpiry) : undefined
      }
    })
    .catch(() => null);

  if (!driver) {
    return NextResponse.json({ message: "Update failed. License number may already exist." }, { status: 409 });
  }

  await lockExpiredDrivers();
  const refreshed = await prisma.driver.findUnique({ where: { id } });
  clearAppCache();
  return NextResponse.json({ driver: toDriver(refreshed ?? driver) });
}
