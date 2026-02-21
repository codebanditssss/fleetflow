"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers/theme-provider";
import { IconSun, IconMoon } from "@/components/dashboard/icons";

export default function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return <div style={s.placeholder} />;

    return (
        <button
            style={s.btn}
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
            {theme === "dark" ? <IconSun size={15} /> : <IconMoon size={15} />}
        </button>
    );
}

const s: Record<string, React.CSSProperties> = {
    btn: {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "32px", height: "32px",
        backgroundColor: "var(--secondary)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        color: "var(--foreground)", cursor: "pointer",
        transition: "background 0.15s",
    },
    placeholder: { width: "32px", height: "32px" }
};
