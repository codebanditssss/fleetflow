import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { deleteSessionByToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await deleteSessionByToken(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0
  });
  return response;
}
