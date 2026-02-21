"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const supabase = createClient();
    const router = useRouter();

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
            <span style={{ fontSize: "16px" }}>Dashboard — coming next!</span>
            <button
                onClick={handleSignOut}
                style={{
                    padding: "8px 20px",
                    backgroundColor: "transparent",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--muted-foreground)",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                }}
            >
                Sign out
            </button>
        </div>
    );
}
