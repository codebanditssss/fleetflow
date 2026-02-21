"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconChevronDown, IconSignOut } from "./icons";

function initials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function roleLabel(role: string) {
    return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
    fullName: string;
    role: string;
}

export default function ProfileDropdown({ fullName, role }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const supabase = createClient();
    const router = useRouter();

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/login");
    }

    return (
        <div ref={ref} style={s.wrapper}>
            {/* Trigger */}
            <button style={s.trigger} onClick={() => setOpen((v) => !v)}>
                <div style={s.avatar}>{initials(fullName)}</div>
                <span style={s.name}>{fullName.split(" ")[0]}</span>
                <IconChevronDown size={13} />
            </button>

            {/* Dropdown */}
            {open && (
                <div style={s.dropdown}>
                    <div style={s.dropHeader}>
                        <div style={s.dropAvatar}>{initials(fullName)}</div>
                        <div>
                            <div style={s.dropName}>{fullName}</div>
                            <div style={s.dropRole}>{roleLabel(role)}</div>
                        </div>
                    </div>
                    <div style={s.dropDivider} />
                    <button style={s.dropItem} onClick={handleSignOut}>
                        <IconSignOut size={13} />
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    wrapper: { position: "relative" },
    trigger: {
        display: "flex", alignItems: "center", gap: "8px",
        padding: "5px 10px",
        backgroundColor: "transparent",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        color: "var(--foreground)",
        fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
    },
    avatar: {
        width: "24px", height: "24px",
        borderRadius: "50%",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "10px", fontWeight: 700, flexShrink: 0,
    },
    name: { fontSize: "13px", fontWeight: 500, color: "var(--foreground)" },

    dropdown: {
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "200px",
        backgroundColor: "var(--popover)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-md)",
        zIndex: 100,
        overflow: "hidden",
    },
    dropHeader: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 14px",
    },
    dropAvatar: {
        width: "32px", height: "32px",
        borderRadius: "50%",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 700, flexShrink: 0,
    },
    dropName: {
        fontSize: "13px", fontWeight: 600,
        color: "var(--popover-foreground)",
    },
    dropRole: {
        fontSize: "11px",
        color: "var(--muted-foreground)",
        marginTop: "1px",
    },
    dropDivider: {
        height: "1px",
        backgroundColor: "var(--border)",
    },
    dropItem: {
        display: "flex", alignItems: "center", gap: "8px",
        width: "100%",
        padding: "10px 14px",
        backgroundColor: "transparent",
        borderWidth: 0,
        fontSize: "13px", color: "var(--foreground)",
        cursor: "pointer", fontFamily: "inherit",
        textAlign: "left",
    },
};
