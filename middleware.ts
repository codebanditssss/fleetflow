import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "fleetflow_session";

const publicApi = new Set([
  "/api/login",
  "/api/signup",
  "/api/forgot-password",
  "/api/reset-password"
]);

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSession && !publicApi.has(pathname)) {
      return NextResponse.json(
        { message: "Unauthorized. Please login first." },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
