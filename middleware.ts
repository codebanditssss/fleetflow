import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    // Public routes — always accessible
    const publicRoutes = ["/login", "/auth/callback"];
    const isPublic = pathname === "/" || publicRoutes.some((r) => pathname.startsWith(r));

    if (isPublic) {
        // If already logged in and going to /login, check profile and route
        if (user && pathname === "/login") {
            const { data: profile } = await supabase
                .from("profiles")
                .select("status")
                .eq("id", user.id)
                .single();

            if (!profile) return NextResponse.redirect(new URL("/onboarding", request.url));
            if (profile.status === "pending") return NextResponse.redirect(new URL("/pending", request.url));
            if (profile.status === "approved") return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return supabaseResponse;
    }

    // Not logged in — send to login
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Logged in — fetch profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

    // No profile yet → must complete onboarding
    if (!profile) {
        if (pathname !== "/onboarding") {
            return NextResponse.redirect(new URL("/onboarding", request.url));
        }
        return supabaseResponse;
    }

    // Profile pending → hold at pending page
    if (profile.status === "pending") {
        if (pathname !== "/pending") {
            return NextResponse.redirect(new URL("/pending", request.url));
        }
        return supabaseResponse;
    }

    // Profile rejected → send back to login with message
    if (profile.status === "rejected") {
        if (pathname !== "/login") {
            return NextResponse.redirect(new URL("/login?error=rejected", request.url));
        }
        return supabaseResponse;
    }

    // Approved — allow through
    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
