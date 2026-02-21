import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { toServiceLog } from "@/lib/store";
import { refreshVehicleAvailability } from "@/lib/rules";
import { clearAppCache } from "@/lib/cache";

const patchServiceSchema = z.object({
  issue: z.string().min(3).optional(),
  serviceDate: z.string().min(8).optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["open", "in_progress", "completed"]).optional()
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "manage_maintenance")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid service update payload." }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await prisma.serviceLog.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Service log not found." }, { status: 404 });
  }

  const log = await prisma.serviceLog.update({
    where: { id },
    data: {
      issue: parsed.data.issue,
      serviceDate: parsed.data.serviceDate ? new Date(parsed.data.serviceDate) : undefined,
      cost: parsed.data.cost,
      notes: parsed.data.notes,
      status: parsed.data.status
    }
  });

  await refreshVehicleAvailability(log.vehicleId);
  clearAppCache();
  return NextResponse.json({ log: toServiceLog(log) });
}
