"use client";

import { usePathname } from "next/navigation";
import ProfileDropdown from "./profile-dropdown";
import ThemeToggle from "@/components/ui/theme-toggle";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/vehicles": "Vehicles",
    "/dashboard/trips": "Trips",
    "/dashboard/drivers": "Drivers",
    "/dashboard/safety": "Safety",
    "/dashboard/finance": "Finance",
};

import { IconMenu } from "./icons";

interface Props {
    fullName: string;
    role: string;
    avatarUrl: string | null;
    onToggleSidebar: () => void;
}

export default function Topbar({ fullName, role, avatarUrl, onToggleSidebar }: Props) {
    const pathname = usePathname();

    const title = PAGE_TITLES[pathname] ?? "Dashboard";

    return (
        <header style={s.topbar} className="dashboard-topbar">
            <div style={s.leftGroup}>
                <button
                    onClick={onToggleSidebar}
                    style={s.menuBtn}
                    className="md-show"
                >
                    <IconMenu size={20} />
                </button>
                <span style={s.title}>{title}</span>
            </div>
            <div style={s.right}>
                <ThemeToggle />
                <ProfileDropdown fullName={fullName} role={role} avatarUrl={avatarUrl} />
            </div>

            <style jsx global>{`
                .dashboard-topbar {
                    left: 220px;
                }
                @media (max-width: 900px) {
                    .dashboard-topbar {
                        left: 0 !important;
                    }
                }
            `}</style>
        </header>
    );
}

const s: Record<string, React.CSSProperties> = {
    topbar: {
        height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(12px, 3vw, 24px)",
        backgroundColor: "var(--background)",
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)",
        position: "fixed", top: 0, right: 0,
        zIndex: 30,
    },
    leftGroup: { display: "flex", alignItems: "center", gap: "12px" },
    menuBtn: {
        background: "none", border: "none", color: "var(--muted-foreground)",
        cursor: "pointer", padding: "4px", display: "flex", alignItems: "center",
    },
    title: { fontSize: "14px", fontWeight: 600, color: "var(--foreground)", letterSpacing: "0.2px" },
    right: { display: "flex", alignItems: "center", gap: "8px" },
};
