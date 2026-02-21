"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    IconDashboard,
    IconVehicles,
    IconTrips,
    IconDrivers,
    IconSafety,
    IconFinance,
} from "./icons";

const NAV = [
    { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
    { href: "/dashboard/vehicles", label: "Vehicles", Icon: IconVehicles },
    { href: "/dashboard/trips", label: "Trips", Icon: IconTrips },
    { href: "/dashboard/drivers", label: "Drivers", Icon: IconDrivers },
    { href: "/dashboard/safety", label: "Safety", Icon: IconSafety },
    { href: "/dashboard/finance", label: "Finance", Icon: IconFinance },
];

function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function roleLabel(role: string) {
    return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
    fullName: string;
    role: string;
}

export default function Sidebar({ fullName, role }: Props) {
    const pathname = usePathname();

    return (
        <aside style={s.sidebar}>
            {/* Logo */}
            <div style={s.logoRow}>
                <div style={s.logoBox}>
                    <IconVehicles size={16} />
                </div>
                <span style={s.logoText}>FleetFlow</span>
            </div>

            {/* Nav */}
            <nav style={s.nav}>
                {NAV.map(({ href, label, Icon }) => {
                    const active =
                        href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(href);
                    return (
                        <Link key={href} href={href} style={{ textDecoration: "none" }}>
                            <div style={{ ...s.navItem, ...(active ? s.navItemActive : {}) }}>
                                <span style={{ ...s.navIcon, ...(active ? s.navIconActive : {}) }}>
                                    <Icon size={15} />
                                </span>
                                <span style={{ ...s.navLabel, ...(active ? s.navLabelActive : {}) }}>
                                    {label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User block — identity only, sign out is in topbar dropdown */}
            <div style={s.userBlock}>
                <div style={s.divider} />
                <div style={s.userRow}>
                    <div style={s.avatar}>{initials(fullName)}</div>
                    <div style={s.userInfo}>
                        <span style={s.userName}>{fullName}</span>
                        <span style={s.userRole}>{roleLabel(role)}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

const s: Record<string, React.CSSProperties> = {
    sidebar: {
        width: "220px",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--sidebar)",
        borderRightWidth: "1px",
        borderRightStyle: "solid",
        borderRightColor: "var(--border)",
        zIndex: 40,
    },
    logoRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 16px",
        height: "56px",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: "var(--border)",
        flexShrink: 0,
    },
    logoBox: {
        width: "28px", height: "28px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius)",
    },
    logoText: {
        fontSize: "14px", fontWeight: 700,
        color: "var(--sidebar-foreground)",
        letterSpacing: "0.5px",
    },
    nav: {
        flex: 1,
        overflowY: "auto",
        padding: "12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    navItem: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px",
        borderRadius: "var(--radius)",
        cursor: "pointer",
    },
    navItemActive: {
        backgroundColor: "var(--sidebar-accent)",
    },
    navIcon: { color: "var(--muted-foreground)", display: "flex", alignItems: "center", flexShrink: 0 },
    navIconActive: { color: "var(--sidebar-foreground)" },
    navLabel: { fontSize: "13px", fontWeight: 400, color: "var(--muted-foreground)" },
    navLabelActive: { color: "var(--sidebar-foreground)", fontWeight: 500 },

    userBlock: {
        padding: "8px 8px 14px",
        flexShrink: 0,
    },
    divider: {
        height: "1px",
        backgroundColor: "var(--border)",
        marginBottom: "12px",
    },
    userRow: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: "4px 8px",
    },
    avatar: {
        width: "30px", height: "30px",
        borderRadius: "50%",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: 700, flexShrink: 0,
    },
    userInfo: {
        display: "flex", flexDirection: "column", gap: "1px",
        overflow: "hidden",
    },
    userName: {
        fontSize: "12px", fontWeight: 600,
        color: "var(--sidebar-foreground)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    },
    userRole: {
        fontSize: "10px",
        color: "var(--muted-foreground)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    },
};
