"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/providers/theme-provider";

function SunIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export default function DashboardPage() {
    const supabase = createClient();
    const router = useRouter();
    const { theme, toggle } = useTheme();

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/login");
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            fontFamily: "inherit",
        }}>
            <span style={{ fontSize: "15px", color: "var(--muted-foreground)" }}>
                Dashboard — coming next!
            </span>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

                {/* Theme toggle */}
                <button
                    onClick={toggle}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 14px",
                        backgroundColor: "var(--secondary)",
                        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--foreground)",
                        fontSize: "13px", fontWeight: 500,
                        cursor: "pointer", fontFamily: "inherit",
                    }}
                >
                    {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>

                {/* Sign out */}
                <button
                    onClick={handleSignOut}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "8px 14px",
                        backgroundColor: "transparent",
                        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
                        borderRadius: "var(--radius)",
                        color: "var(--muted-foreground)",
                        fontSize: "13px", fontWeight: 500,
                        cursor: "pointer", fontFamily: "inherit",
                    }}
                >
                    Sign out
                </button>

            </div>
        </div>
    );
}
