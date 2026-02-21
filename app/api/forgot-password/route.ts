import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/auth";

const schema = z.object({
  email: z.string().email()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid email." }, { status: 400 });
  }

  const result = await requestPasswordReset(parsed.data.email);
  if (!result.userFound && process.env.NODE_ENV !== "production") {
    return NextResponse.json({
      message: "No account found for this email in current DB seed."
    });
  }
  return NextResponse.json({
    message:
      result.delivery === "none"
        ? "If the account exists, a reset token has been generated."
        : `If the account exists, reset details were sent via ${result.delivery}.`,
    token: result.token,
    delivery: result.delivery
  });
}
