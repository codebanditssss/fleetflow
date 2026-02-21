"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/theme-toggle";
import { IconVehicles, IconDashboard, IconSafety, IconFinance, IconTrips, IconWrench } from "@/components/dashboard/icons";

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <div style={s.page}>
            {/* Background HUD Lines */}
            <div style={s.hudLines} />

            <nav style={s.nav}>
                <div style={s.logoGroup}>
                    <div style={s.logoBox}><IconVehicles size={14} /></div>
                    <div style={s.logoTextGroup}>
                        <span style={s.logoText}>FLEETFLOW</span>
                        <span style={s.logoSub}>Version 1.0.2</span>
                    </div>
                </div>
                <div style={s.navRight}>
                    <ThemeToggle />
                    <Link href="/login" style={s.navLink}>Sign In</Link>
                </div>
            </nav>

            <main style={s.main}>
                {/* Hero HUD */}
                <section style={s.hero}>
                    <div style={s.heroContent}>
                        <h1 style={s.title}>
                            Intelligent <br />
                            <span style={s.accent}>Logistics Hub</span>
                        </h1>
                        <p style={s.heroText}>
                            Automated fleet coordination, real-time safety compliance,
                            and comprehensive financial auditing. Designed for the
                            modern supply chain ecosystem.
                        </p>

                        <div style={s.heroActions}>
                            <Link href="/login" style={s.primaryBtn}>
                                Launch Platform
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Modules Console */}
                <section style={s.console}>
                    <div style={s.consoleHeader}>
                        <h2 style={s.consoleTitle}>System Modules</h2>
                        <div style={s.consoleLine} />
                    </div>

                    <div style={s.moduleGrid}>
                        <ModuleItem id="01" Icon={IconDashboard} title="Command Center" desc="Real-time KPI visualization and advanced fleet filtering." />
                        <ModuleItem id="02" Icon={IconTrips} title="Smart Dispatch" desc="Atomic trip scheduling and vehicle capacity validation." />
                        <ModuleItem id="03" Icon={IconSafety} title="Safety Watch" desc="Compliance monitoring and driver document watchdog." />
                        <ModuleItem id="04" Icon={IconFinance} title="Audit Ledger" desc="Expense analytics and transparent transaction reporting." />
                        <ModuleItem id="05" Icon={IconWrench} title="Maintenance" desc="Asset lifecycle tracking and automated status updates." />
                        <ModuleItem id="06" Icon={IconVehicles} title="Asset Vault" desc="Centralized fleet registry and multi-type vehicle logs." />
                    </div>
                </section>
            </main>

            {/* Terminal Footer */}
            <footer style={s.footer}>
                <div style={s.footerContainer}>
                    <span style={s.footerInfo}>FleetFlow System // Team Rocket // 2026</span>
                    <span style={s.footerInfo}>Secure Session Active</span>
                </div>
            </footer>
        </div>
    );
}

function ModuleItem({ id, Icon, title, desc }: { id: string, Icon: any, title: string, desc: string }) {
    return (
        <div style={s.moduleCard}>
            <div style={s.moduleTop}>
                <span style={s.moduleId}>[{id}]</span>
                <Icon size={16} />
            </div>
            <h3 style={s.moduleTitle}>{title}</h3>
            <p style={s.moduleDesc}>{desc}</p>
            <div style={s.moduleCorner} />
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: {
        backgroundColor: "var(--background)",
        minHeight: "100vh",
        color: "var(--foreground)",
        fontFamily: "'Source Code Pro', monospace",
        overflowX: "hidden",
        position: "relative",
    },
    hudLines: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        opacity: 0.03,
        pointerEvents: "none",
    },
    nav: {
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(var(--background-rgb), 0.5)",
        backdropFilter: "blur(10px)",
        zIndex: 50,
    },
    logoGroup: { display: "flex", alignItems: "center", gap: "12px" },
    logoBox: {
        width: "28px", height: "28px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "2px",
    },
    logoTextGroup: { display: "flex", flexDirection: "column" },
    logoText: { fontSize: "14px", fontWeight: 700, letterSpacing: "1px" },
    logoSub: { fontSize: "9px", color: "var(--muted-foreground)", fontWeight: 500 },
    navRight: { display: "flex", alignItems: "center", gap: "24px" },
    navLink: {
        fontSize: "12px", color: "var(--foreground)", textDecoration: "none",
        border: "1px solid var(--border)", padding: "6px 16px", borderRadius: "var(--radius)"
    },

    main: { maxWidth: "1000px", margin: "0 auto", padding: "80px 24px" },

    hero: { marginBottom: "100px" },
    heroContent: { maxWidth: "700px" },
    title: {
        fontSize: "clamp(48px, 8vw, 72px)",
        fontWeight: 800,
        lineHeight: "0.9",
        letterSpacing: "-0.04em",
        marginBottom: "24px",
    },
    accent: { color: "var(--primary)" },
    heroText: {
        fontSize: "16px",
        color: "var(--muted-foreground)",
        maxWidth: "520px",
        lineHeight: "1.6",
        marginBottom: "40px"
    },
    heroActions: { display: "flex", alignItems: "center", gap: "24px" },
    primaryBtn: {
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        padding: "16px 32px",
        borderRadius: "var(--radius)",
        fontSize: "14px",
        fontWeight: 700,
        textDecoration: "none",
        boxShadow: "0 0 20px color-mix(in oklch, var(--primary) 20%, transparent)",
    },

    console: {},
    consoleHeader: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" },
    consoleTitle: { fontSize: "16px", fontWeight: 700, letterSpacing: "2px" },
    consoleLine: { flex: 1, height: "1px", backgroundColor: "var(--border)" },

    moduleGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1px",
        backgroundColor: "var(--border)",
        border: "1px solid var(--border)",
    },
    moduleCard: {
        padding: "32px",
        backgroundColor: "var(--background)",
        position: "relative",
    },
    moduleTop: { display: "flex", justifyContent: "space-between", marginBottom: "24px", color: "var(--muted-foreground)" },
    moduleId: { fontSize: "10px", fontWeight: 700 },
    moduleTitle: { fontSize: "16px", fontWeight: 700, marginBottom: "12px", letterSpacing: "0.5px" },
    moduleDesc: { fontSize: "12px", color: "var(--muted-foreground)", lineHeight: "1.5" },
    moduleCorner: {
        position: "absolute", bottom: "8px", right: "8px",
        width: "6px", height: "6px", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)"
    },

    footer: {
        borderTop: "1px solid var(--border)",
        padding: "24px 32px",
    },
    footerContainer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    footerInfo: { fontSize: "10px", color: "var(--muted-foreground)", letterSpacing: "1px" },
};
