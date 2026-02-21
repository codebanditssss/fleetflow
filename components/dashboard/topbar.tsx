"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/providers/theme-provider";
import ProfileDropdown from "./profile-dropdown";
import { IconSun, IconMoon } from "./icons";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/vehicles": "Vehicles",
    "/dashboard/trips": "Trips",
    "/dashboard/drivers": "Drivers",
    "/dashboard/safety": "Safety",
    "/dashboard/finance": "Finance",
};

interface Props {
    fullName: string;
    role: string;
    avatarUrl: string | null;
}

export default function Topbar({ fullName, role, avatarUrl }: Props) {
    const pathname = usePathname();
    const { theme, toggle } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Only show the icon AFTER hydration — prevents Sun→Moon flash
    useEffect(() => { setMounted(true); }, []);

    const title = PAGE_TITLES[pathname] ?? "Dashboard";

    return (
        <header style={s.topbar}>
            <span style={s.title}>{title}</span>
            <div style={s.right}>
                <button
                    style={s.iconBtn}
                    onClick={toggle}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {mounted
                        ? theme === "dark"
                            ? <IconSun size={15} />
                            : <IconMoon size={15} />
                        : null}
                </button>
                <ProfileDropdown fullName={fullName} role={role} avatarUrl={avatarUrl} />
            </div>
        </header>
    );
}

const s: Record<string, React.CSSProperties> = {
    topbar: {
        height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "var(--background)",
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)",
        position: "fixed", top: 0, left: "220px", right: 0,
        zIndex: 30,
    },
    title: { fontSize: "14px", fontWeight: 600, color: "var(--foreground)", letterSpacing: "0.2px" },
    right: { display: "flex", alignItems: "center", gap: "8px" },
    iconBtn: {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px",
        backgroundColor: "transparent",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        color: "var(--muted-foreground)", cursor: "pointer",
    },
};
