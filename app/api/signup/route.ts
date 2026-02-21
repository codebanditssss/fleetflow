import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookieMaxAge, SESSION_COOKIE, signupWithCredentials } from "@/lib/auth";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["manager", "dispatcher", "safety_officer", "financial_analyst"]).default("dispatcher")
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: first?.message ?? "Invalid signup payload.",
        field: first?.path?.[0] ?? null
      },
      { status: 400 }
    );
  }

  const result = await signupWithCredentials(parsed.data);
  if (!result) {
    return NextResponse.json({ message: "Email is already registered." }, { status: 409 });
  }

  const response = NextResponse.json({ user: result.user }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookieMaxAge()
  });
  return response;
}
