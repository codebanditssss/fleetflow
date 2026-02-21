import { NextRequest, NextResponse } from "next/server";
import { loginWithCredentials, SESSION_COOKIE, sessionCookieMaxAge } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const result = await loginWithCredentials(body.email, body.password);
  if (!result) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ user: result.user });
  response.cookies.set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookieMaxAge()
  });
  return response;
}
