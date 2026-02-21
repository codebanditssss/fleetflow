"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function PendingPage() {
    const supabase = createClient();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [checking, setChecking] = useState(false);

    const checkStatus = useCallback(async () => {
        setChecking(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("status")
                .eq("id", user.id)
                .single();

            if (profile?.status === "approved") {
                router.push("/dashboard");
                return;
            }
        }
        setChecking(false);
    }, [supabase, router]);

    // Get email on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user?.email) setEmail(data.user.email);
        });
    }, []);

    // Auto-poll every 5 seconds
    useEffect(() => {
        checkStatus(); // check immediately on mount too
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/login");
    }

    return (
        <div style={s.page}>
            <div style={s.card}>

                {/* Logo */}
                <div style={s.logoRow}>
                    <div style={s.logoBox}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                            <rect x="1" y="3" width="15" height="13" />
                            <path d="M16 8h4l3 5v4h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                    </div>
                    <span style={s.logoText}>FleetFlow</span>
                </div>

                {/* Icon */}
                <div style={s.iconWrap}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>

                <h1 style={s.heading}>Request under review</h1>
                <p style={s.sub}>
                    Your onboarding request has been submitted. An admin will review your
                    details and proof of employment.
                </p>

                {email && (
                    <div style={s.emailNote}>
                        Submitted as <strong>{email}</strong>
                    </div>
                )}

                <div style={s.infoGrid}>
                    <div style={s.infoItem}>
                        <span style={s.tick}>✓</span>
                        <span style={s.infoText}>Profile submitted</span>
                    </div>
                    <div style={s.infoItem}>
                        <span style={s.pulse} />
                        <span style={s.infoText}>Awaiting admin approval</span>
                    </div>
                    <div style={{ ...s.infoItem, opacity: 0.35 }}>
                        <span style={s.infoIcon}>—</span>
                        <span style={s.infoText}>Access granted</span>
                    </div>
                </div>

                {/* Auto-checking notice */}
                <p style={s.autoCheck}>
                    {checking ? "Checking status…" : "Checking every 5 seconds — page will redirect automatically."}
                </p>

                {/* Manual check button */}
                <button style={s.checkBtn} onClick={checkStatus} disabled={checking}>
                    {checking ? "Checking…" : "Check now"}
                </button>

                <button style={s.signOutBtn} onClick={handleSignOut}>
                    Sign out
                </button>
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
      `}</style>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "var(--background)",
        padding: "24px",
    },
    card: {
        width: "100%", maxWidth: "400px",
        backgroundColor: "var(--card)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        padding: "36px 32px",
        boxShadow: "var(--shadow-md)",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
    },
    logoRow: {
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "28px", alignSelf: "flex-start",
    },
    logoBox: {
        width: "34px", height: "34px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius)", flexShrink: 0,
    },
    logoText: {
        fontSize: "16px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "0.5px",
    },
    iconWrap: {
        width: "64px", height: "64px",
        backgroundColor: "var(--secondary)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--muted-foreground)",
        marginBottom: "20px",
    },
    heading: {
        fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "10px",
    },
    sub: {
        fontSize: "13px", color: "var(--muted-foreground)", lineHeight: "1.6", marginBottom: "20px",
    },
    emailNote: {
        fontSize: "12px",
        padding: "10px 14px",
        backgroundColor: "var(--secondary)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        color: "var(--muted-foreground)",
        width: "100%", marginBottom: "20px", lineHeight: "1.5",
    },
    infoGrid: {
        width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px",
    },
    infoItem: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 12px",
        backgroundColor: "var(--secondary)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)", textAlign: "left",
    },
    tick: {
        fontSize: "13px", color: "oklch(0.7 0.17 150)", fontWeight: 700, flexShrink: 0,
    },
    pulse: {
        display: "inline-block",
        width: "8px", height: "8px", borderRadius: "50%",
        backgroundColor: "var(--ring)",
        flexShrink: 0,
        animation: "blink 1.5s ease-in-out infinite",
    },
    infoIcon: { fontSize: "13px", color: "var(--muted-foreground)", flexShrink: 0 },
    infoText: { fontSize: "13px", color: "var(--foreground)" },
    autoCheck: {
        fontSize: "11px", color: "var(--muted-foreground)",
        marginBottom: "14px", lineHeight: "1.5",
    },
    checkBtn: {
        padding: "8px 20px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        borderWidth: 0,
        borderRadius: "var(--radius)",
        fontSize: "13px", fontWeight: 500,
        cursor: "pointer", fontFamily: "inherit",
        marginBottom: "10px",
        width: "100%",
    },
    signOutBtn: {
        padding: "8px 20px",
        backgroundColor: "transparent",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        fontSize: "13px", fontWeight: 500,
        color: "var(--muted-foreground)",
        cursor: "pointer", fontFamily: "inherit",
        width: "100%",
    },
};
