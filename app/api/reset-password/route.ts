import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/lib/auth";

const schema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(6)
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: first?.message ?? "Invalid reset payload.",
        field: first?.path?.[0] ?? null
      },
      { status: 400 }
    );
  }

  const ok = await resetPassword(parsed.data);
  if (!ok) {
    return NextResponse.json({ message: "Invalid or expired reset token." }, { status: 400 });
  }
  return NextResponse.json({ message: "Password updated successfully. Please login again." });
}
