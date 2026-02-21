import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.role, "view_analytics")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const [expenses, trips, services] = await Promise.all([
    prisma.expense.findMany(),
    prisma.trip.findMany(),
    prisma.serviceLog.findMany()
  ]);

  const monthly = new Map<string, { revenue: number; fuel: number; maintenance: number }>();
  for (const trip of trips) {
    const key = monthKey(trip.createdAt);
    const row = monthly.get(key) ?? { revenue: 0, fuel: 0, maintenance: 0 };
    row.revenue += trip.revenue ?? 0;
    monthly.set(key, row);
  }
  for (const expense of expenses) {
    const key = monthKey(expense.spentAt);
    const row = monthly.get(key) ?? { revenue: 0, fuel: 0, maintenance: 0 };
    row.fuel += expense.fuelCost + expense.miscCost;
    monthly.set(key, row);
  }
  for (const service of services) {
    const key = monthKey(service.serviceDate);
    const row = monthly.get(key) ?? { revenue: 0, fuel: 0, maintenance: 0 };
    row.maintenance += service.cost;
    monthly.set(key, row);
  }

  const rows = [...monthly.entries()]
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      fuel: data.fuel,
      maintenance: data.maintenance,
      net: data.revenue - data.fuel - data.maintenance
    }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  const format = request.nextUrl.searchParams.get("format");
  if (format === "csv") {
    const csv = [
      ["Month", "Revenue", "Fuel+Misc Cost", "Maintenance Cost", "Net Profit"].join(","),
      ...rows.map((row) => [row.month, row.revenue, row.fuel, row.maintenance, row.net].join(","))
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=fleetflow-report.csv"
      }
    });
  }

  const lines = [
    "FleetFlow Operational Analytics Report",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "Month | Revenue | Fuel+Misc | Maintenance | Net Profit",
    ...rows.map((row) => `${row.month} | ${row.revenue.toFixed(0)} | ${row.fuel.toFixed(0)} | ${row.maintenance.toFixed(0)} | ${row.net.toFixed(0)}`)
  ];
  const streamText = lines.join("\\n").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const contentStream = `BT /F1 11 Tf 40 800 Td 0 -14 Td (${streamText}) Tj ET`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(body.length);
    body += `${obj}\n`;
  }
  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=fleetflow-report.pdf"
    }
  });
}
