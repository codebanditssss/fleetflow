"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/theme-toggle";
import {
    IconVehicles,
    IconDashboard,
    IconSafety,
    IconFinance,
    IconTrips,
    IconWrench,
    IconDrivers
} from "@/components/dashboard/icons";

const ROLES = [
    {
        id: "manager",
        title: "Fleet Manager",
        subtitle: "Complete Operational Control",
        description: "Oversee your entire fleet infrastructure from a single pane of glass. Approve team access, manage asset lifecycles, and track high-level performance metrics.",
        points: ["Centralized User Management", "Fleet Health Monitoring", "Executive Data Summaries"],
        icon: IconDashboard
    },
    {
        id: "dispatcher",
        title: "Operations Dispatcher",
        subtitle: "Efficient Trip Coordination",
        description: "The operational engine of your supply chain. Seamlessly coordinate trips, validate vehicle weight limits, and pair the right drivers with the right assets.",
        points: ["Smart Cargo Validation", "Real-time Trip Tracking", "Driver Availability Sync"],
        icon: IconTrips
    },
    {
        id: "safety",
        title: "Safety & Compliance",
        subtitle: "Risk Mitigation & Standards",
        description: "Never miss a renewal. Monitor driver certifications, manage vehicle maintenance logs, and ensure every asset on the road meets your safety standards.",
        points: ["Document Expiry Alerts", "Maintenance Scheduling", "Compliance Watchlists"],
        icon: IconSafety
    },
    {
        id: "finance",
        title: "Financial Analyst",
        subtitle: "Cost Optimization & Auditing",
        description: "Turn data into savings. Audit fuel expenditures, track maintenance ROI, and generate detailed reports for financial stakeholders.",
        points: ["Expenditure Analytics", "Fuel Cost Tracking", "Professional CSV Exports"],
        icon: IconFinance
    }
];

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <div style={s.page}>
            {/* Minimal Navigation */}
            <nav style={s.nav}>
                <div style={s.navContainer}>
                    <div style={s.logoGroup}>
                        <div style={s.logoIcon}><IconVehicles size={18} /></div>
                        <span style={s.logoText}>FleetFlow</span>
                    </div>
                    <div style={s.navRight}>
                        <ThemeToggle />
                        <Link href="/login" style={s.primaryBtnNav}>Sign In</Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section style={s.hero}>
                    <div style={s.container}>
                        <div style={s.heroContent}>
                            <h1 style={s.heroTitle}>
                                The Intelligent Core of <br />
                                <span style={s.textGradient}>Modern Logistics</span>
                            </h1>
                            <p style={s.heroSub}>
                                A unified platform designed to streamline fleet operations,
                                automate compliance, and provide total financial clarity.
                                Built for teams that move the world.
                            </p>
                            <div style={s.heroActions}>
                                <Link href="/login" style={s.btnMain}>Get Started</Link>
                                <a href="#features" style={s.btnGhost}>View Features</a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Role Switcher Section */}
                <section style={s.rolesSection}>
                    <div style={s.container}>
                        <div style={s.sectionHeader}>
                            <h2 style={s.sectionTitle}>Designed for Every Role</h2>
                            <p style={s.sectionSub}>Tailored interfaces and tools for every member of your operational team.</p>
                        </div>

                        <div style={s.roleCard}>
                            <div style={s.roleSidebar}>
                                {ROLES.map((role, idx) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setActiveTab(idx)}
                                        style={{
                                            ...s.roleTabBtn,
                                            ...(activeTab === idx ? s.roleTabBtnActive : {})
                                        }}
                                    >
                                        {role.title}
                                    </button>
                                ))}
                            </div>
                            <div style={s.roleContent}>
                                <div style={s.roleHeader}>
                                    <div style={s.roleIconCircle}>
                                        {(() => {
                                            const Icon = ROLES[activeTab].icon;
                                            return <Icon size={24} />;
                                        })()}
                                    </div>
                                    <div>
                                        <h3 style={s.roleDisplayTitle}>{ROLES[activeTab].title}</h3>
                                        <span style={s.roleSubtitle}>{ROLES[activeTab].subtitle}</span>
                                    </div>
                                </div>
                                <p style={s.roleDescription}>{ROLES[activeTab].description}</p>
                                <div style={s.pointsGrid}>
                                    {ROLES[activeTab].points.map((point, i) => (
                                        <div key={i} style={s.pointItem}>
                                            <div style={s.pointBullet} />
                                            {point}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" style={s.featuresGridSection}>
                    <div style={s.container}>
                        <div style={s.sectionHeader}>
                            <h2 style={s.sectionTitle}>Enterprise Capabilities</h2>
                            <p style={s.sectionSub}>Built-in modules to handle every facet of the supply chain lifecycle.</p>
                        </div>
                        <div style={s.grid}>
                            <FeatureBox
                                title="Command Center"
                                desc="A real-time overview of your entire operation with powerful filtering and analytics."
                                Icon={IconDashboard}
                            />
                            <FeatureBox
                                title="Unified Registry"
                                desc="Manage vehicles, drivers, and technical specifications in one centralized database."
                                Icon={IconVehicles}
                            />
                            <FeatureBox
                                title="Digital Dispatch"
                                desc="Automated trip scheduling with capacity checks and real-time status updates."
                                Icon={IconTrips}
                            />
                            <FeatureBox
                                title="Audit & Finance"
                                desc="Transparent tracking of fuel, maintenance, and operational costs for better ROI."
                                Icon={IconFinance}
                            />
                        </div>
                    </div>
                </section>

                {/* Team / Hackathon Banner */}
                <section style={s.bannerSection}>
                    <div style={s.container}>
                        <div style={s.banner}>
                            <div style={s.bannerText}>
                                <h2 style={s.bannerTitle}>Built by Team Rocket</h2>
                                <p style={s.bannerSubText}>Open source core developed for the 2026 Fleet Innovation Hackathon.</p>
                            </div>
                            <a href="https://github.com/Annieeeee11/fleetflow" target="_blank" rel="noopener noreferrer" style={s.bannerBtn}>
                                View Source on GitHub
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Redesigned Footer */}
            <footer style={s.footer}>
                <div style={s.container}>
                    <div style={s.footerTop}>
                        <div style={s.footerBrand}>
                            <div style={s.logoGroup}>
                                <div style={s.logoIcon}><IconVehicles size={18} /></div>
                                <span style={s.logoText}>FleetFlow</span>
                            </div>
                            <p style={s.footerBio}>
                                The next-generation coordination layer for global logistics.
                                Secure, scalable, and built for speed.
                            </p>
                        </div>
                        <div style={s.footerLinks}>
                            <div style={s.linkCol}>
                                <h4 style={s.linkHeader}>Platform</h4>
                                <Link href="/login" style={s.footerLink}>Dashboard</Link>
                                <Link href="/login" style={s.footerLink}>Security</Link>
                                <Link href="/login" style={s.footerLink}>Audit Trails</Link>
                            </div>
                            <div style={s.linkCol}>
                                <h4 style={s.linkHeader}>Company</h4>
                                <span style={s.footerLink}>Team Rocket</span>
                                <a href="https://github.com/Annieeeee11/fleetflow" style={s.footerLink}>GitHub Repo</a>
                                <span style={s.footerLink}>Hackathon '26</span>
                            </div>
                        </div>
                    </div>
                    <div style={s.footerBottom}>
                        <p style={s.copyText}>© 2026 FleetFlow. All rights reserved.</p>
                        <div style={s.footerSocials}>
                            <span style={s.socialText}>Gujarat Vidyapith x Odoo Submission</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureBox({ title, desc, Icon }: any) {
    return (
        <div style={s.featureBox}>
            <div style={s.featureIcon}><Icon size={20} /></div>
            <h3 style={s.featureTitle}>{title}</h3>
            <p style={s.featureDesc}>{desc}</p>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: {
        backgroundColor: "var(--background)",
        minHeight: "100vh",
        color: "var(--foreground)",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    },
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 24px",
    },
    nav: {
        height: "80px",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "color-mix(in oklch, var(--background) 80%, transparent)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
    },
    navContainer: {
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    logoGroup: { display: "flex", alignItems: "center", gap: "10px" },
    logoIcon: {
        width: "36px", height: "36px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "8px",
    },
    logoText: { fontSize: "20px", fontWeight: 700, letterSpacing: "-0.5px" },
    navRight: { display: "flex", alignItems: "center", gap: "20px" },
    secondaryBtn: {
        fontSize: "14px", fontWeight: 500, color: "var(--foreground)", textDecoration: "none"
    },
    primaryBtnNav: {
        padding: "10px 20px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        borderRadius: "var(--radius)",
        fontSize: "14px", fontWeight: 600, textDecoration: "none",
    },

    // Hero
    hero: { padding: "120px 0 80px", textAlign: "center" },
    heroContent: { maxWidth: "800px", margin: "0 auto" },
    heroTitle: {
        fontSize: "clamp(48px, 8vw, 72px)",
        fontWeight: 800,
        lineHeight: "1.1",
        marginBottom: "24px",
        letterSpacing: "-0.03em"
    },
    textGradient: { color: "var(--primary)" },
    heroSub: {
        fontSize: "19px",
        color: "var(--muted-foreground)",
        lineHeight: "1.6",
        marginBottom: "48px",
        maxWidth: "640px",
        margin: "0 auto 48px"
    },
    heroActions: { display: "flex", gap: "16px", justifyContent: "center" },
    btnMain: {
        padding: "16px 36px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        borderRadius: "var(--radius)",
        fontSize: "16px", fontWeight: 600, textDecoration: "none",
        boxShadow: "var(--shadow-md)"
    },
    btnGhost: {
        padding: "16px 36px",
        backgroundColor: "transparent",
        color: "var(--foreground)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        fontSize: "16px", fontWeight: 600, textDecoration: "none"
    },

    // Roles
    rolesSection: { padding: "80px 0" },
    sectionHeader: { textAlign: "center", marginBottom: "56px" },
    sectionTitle: { fontSize: "36px", fontWeight: 700, marginBottom: "16px" },
    sectionSub: { fontSize: "16px", color: "var(--muted-foreground)" },
    roleCard: {
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)"
    },
    roleSidebar: {
        padding: "32px",
        borderRight: "1px solid var(--border)",
        backgroundColor: "color-mix(in oklch, var(--secondary) 30%, transparent)",
        display: "flex", flexDirection: "column", gap: "8px"
    },
    roleTabBtn: {
        padding: "16px 20px",
        textAlign: "left",
        backgroundColor: "transparent",
        border: "none",
        borderRadius: "8px",
        color: "var(--muted-foreground)",
        fontSize: "15px", fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s"
    },
    roleTabBtnActive: {
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
    },
    roleContent: { padding: "48px" },
    roleHeader: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" },
    roleIconCircle: {
        width: "56px", height: "56px",
        borderRadius: "50%",
        backgroundColor: "var(--secondary)",
        color: "var(--primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid var(--border)"
    },
    roleDisplayTitle: { fontSize: "28px", fontWeight: 700, margin: 0 },
    roleSubtitle: { fontSize: "14px", color: "var(--primary)", fontWeight: 600, textTransform: "uppercase" },
    roleDescription: { fontSize: "17px", color: "var(--muted-foreground)", lineHeight: "1.7", marginBottom: "32px" },
    pointsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    pointItem: { display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: 500 },
    pointBullet: { width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)" },

    // Features Grid
    featuresGridSection: { padding: "80px 0", backgroundColor: "var(--secondary)" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" },
    featureBox: {
        padding: "32px",
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
    },
    featureIcon: { marginBottom: "20px", color: "var(--primary)" },
    featureTitle: { fontSize: "18px", fontWeight: 700, marginBottom: "12px" },
    featureDesc: { fontSize: "14px", color: "var(--muted-foreground)", lineHeight: "1.6" },

    // Banner
    bannerSection: { padding: "80px 0" },
    banner: {
        padding: "60px",
        backgroundColor: "var(--primary)",
        borderRadius: "24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: "var(--primary-foreground)"
    },
    bannerTitle: { fontSize: "32px", fontWeight: 800, marginBottom: "8px" },
    bannerSubText: { fontSize: "16px", opacity: 0.9 },
    bannerBtn: {
        padding: "16px 32px",
        backgroundColor: "var(--background)",
        color: "var(--primary)",
        borderRadius: "var(--radius)",
        fontSize: "16px", fontWeight: 700, textDecoration: "none"
    },

    // Footer
    footer: {
        padding: "100px 0 60px",
        borderTop: "1px solid var(--border)",
        backgroundColor: "color-mix(in oklch, var(--secondary) 25%, transparent)"
    },
    footerTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: "60px",
        marginBottom: "80px",
        flexWrap: "wrap"
    },
    footerBrand: {
        maxWidth: "320px",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
    },
    footerBio: {
        fontSize: "14px",
        color: "var(--muted-foreground)",
        lineHeight: "1.6"
    },
    footerLinks: {
        display: "flex",
        gap: "80px",
        flexWrap: "wrap"
    },
    linkCol: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },
    linkHeader: {
        fontSize: "13px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1px",
        color: "var(--foreground)",
        marginBottom: "8px"
    },
    footerLink: {
        fontSize: "14px",
        color: "var(--muted-foreground)",
        textDecoration: "none",
        transition: "color 0.2s",
        cursor: "pointer"
    },
    footerBottom: {
        paddingTop: "40px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px"
    },
    copyText: {
        fontSize: "13px",
        color: "var(--muted-foreground)"
    },
    footerSocials: {
        display: "flex",
        gap: "20px"
    },
    socialText: {
        fontSize: "12px",
        fontWeight: 600,
        color: "var(--primary)",
        letterSpacing: "0.5px"
    }
};
