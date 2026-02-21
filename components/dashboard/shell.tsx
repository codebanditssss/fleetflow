"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

interface Props {
    fullName: string;
    role: string;
    avatarUrl: string | null;
    children: React.ReactNode;
}

export default function Shell({ fullName, role, avatarUrl, children }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    return (
        <div style={s.root}>
            <Sidebar
                fullName={fullName}
                role={role}
                avatarUrl={avatarUrl}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    style={s.overlay}
                    onClick={() => setSidebarOpen(false)}
                    className="md-show"
                />
            )}
            <div style={s.right}>
                <Topbar
                    fullName={fullName}
                    role={role}
                    avatarUrl={avatarUrl}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
                <main style={s.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    root: {
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--background)",
    },
    overlay: {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 35,
        backdropFilter: "blur(2px)",
    },
    right: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
    },
    main: {
        marginTop: "56px",
        flex: 1,
        padding: "clamp(12px, 3vw, 24px)",
        overflowY: "auto",
        transition: "margin-left 0.3s ease",
    },
};
