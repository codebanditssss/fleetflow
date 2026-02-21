"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DriverStatusBadge from "./driver-status-badge";
import AddDriverModal, { type Driver } from "./add-driver-modal";

interface Props {
    drivers: Driver[];
    canWrite: boolean;
}

function daysUntilExpiry(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryCell({ dateStr }: { dateStr: string }) {
    const days = daysUntilExpiry(dateStr);
    const formatted = new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    let color = "var(--foreground)";
    let tag = "";
    if (days < 0) { color = "var(--destructive)"; tag = " — EXPIRED"; }
    else if (days <= 30) { color = "oklch(0.75 0.18 60)"; tag = ` — ${days}d left`; }

    return <span style={{ fontSize: "13px", color }}>{formatted}{tag}</span>;
}

function SafetyBar({ score }: { score: number }) {
    const color = score >= 80 ? "oklch(0.7 0.17 150)" : score >= 50 ? "oklch(0.75 0.18 60)" : "var(--destructive)";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "56px", height: "4px", backgroundColor: "var(--muted)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${score}%`, height: "100%", backgroundColor: color }} />
            </div>
            <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{score}</span>
        </div>
    );
}

export default function DriverTable({ drivers, canWrite }: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<Driver | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    async function handleDelete(id: string) {
        if (!confirm("Delete this driver? This cannot be undone.")) return;
        setDeleting(id);
        await supabase.from("drivers").delete().eq("id", id);
        setDeleting(null);
        router.refresh();
    }

    async function toggleStatus(driver: Driver) {
        const next = driver.status === "active" ? "inactive" : "active";
        await supabase.from("drivers").update({ status: next }).eq("id", driver.id);
        router.refresh();
    }

    const cols = ["Name", "License No.", "Category", "Expiry", "Status", "Safety Score", "Trips", ...(canWrite ? [""] : [])];

    return (
        <>
            <div style={s.toolbar}>
                <span style={s.count}>{drivers.length} driver{drivers.length !== 1 ? "s" : ""} registered</span>
                {canWrite && (
                    <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ Add Driver</button>
                )}
            </div>

            {drivers.length === 0 ? (
                <div style={s.empty}>
                    No drivers registered yet.{canWrite ? ' Click "+ Add Driver" to add one.' : ""}
                </div>
            ) : (
                <div style={s.tableWrap}>
                    <table style={s.table}>
                        <thead>
                            <tr>{cols.map((h) => <th key={h} style={s.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {drivers.map((d) => {
                                const expired = daysUntilExpiry(d.license_expiry) < 0;
                                return (
                                    <tr key={d.id} style={{ ...s.tr, ...(expired ? { backgroundColor: "oklch(0.6168 0.2086 25.8 / 0.04)" } : {}) }}>
                                        <td style={s.td}>
                                            <div style={{ fontWeight: 500 }}>{d.full_name}</div>
                                            {d.phone && <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{d.phone}</div>}
                                        </td>
                                        <td style={{ ...s.td, ...s.mono }}>{d.license_number}</td>
                                        <td style={{ ...s.td, color: "var(--muted-foreground)", textTransform: "capitalize" }}>
                                            {d.vehicle_category}
                                        </td>
                                        <td style={s.td}><ExpiryCell dateStr={d.license_expiry} /></td>
                                        <td style={s.td}><DriverStatusBadge status={d.status} /></td>
                                        <td style={s.td}><SafetyBar score={d.safety_score} /></td>
                                        <td style={{ ...s.td, color: "var(--muted-foreground)" }}>{d.trips_completed}</td>
                                        {canWrite && (
                                            <td style={{ ...s.td, ...s.actionsCell }}>
                                                <button style={s.toggleBtn} onClick={() => toggleStatus(d)}>
                                                    {d.status === "active" ? "Off Duty" : "On Duty"}
                                                </button>
                                                <button style={s.editBtn} onClick={() => setEditing(d)}>Edit</button>
                                                <button style={s.deleteBtn} onClick={() => handleDelete(d.id)} disabled={deleting === d.id}>
                                                    {deleting === d.id ? "…" : "Delete"}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <AddDriverModal open={showAdd} onClose={() => setShowAdd(false)} />
            <AddDriverModal key={editing?.id ?? "edit"} open={!!editing} onClose={() => setEditing(null)} editDriver={editing} />
        </>
    );
}

const s: Record<string, React.CSSProperties> = {
    toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
    count: { fontSize: "13px", color: "var(--muted-foreground)" },
    addBtn: { padding: "7px 16px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer", fontFamily: "inherit" },
    empty: { padding: "48px 24px", textAlign: "center", fontSize: "13px", color: "var(--muted-foreground)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", backgroundColor: "var(--card)" },
    tableWrap: { overflowX: "auto", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)", backgroundColor: "var(--card)", whiteSpace: "nowrap" },
    tr: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)" },
    td: { padding: "11px 14px", color: "var(--foreground)", backgroundColor: "var(--card)", whiteSpace: "nowrap", verticalAlign: "middle" },
    mono: { letterSpacing: "0.5px", fontSize: "12px" },
    actionsCell: { display: "flex", gap: "5px", justifyContent: "flex-end" },
    toggleBtn: { padding: "4px 10px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--ring)", borderRadius: "var(--radius)", fontSize: "11px", color: "var(--ring)", cursor: "pointer", fontFamily: "inherit" },
    editBtn: { padding: "4px 10px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", fontSize: "11px", color: "var(--foreground)", cursor: "pointer", fontFamily: "inherit" },
    deleteBtn: { padding: "4px 10px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--destructive)", borderRadius: "var(--radius)", fontSize: "11px", color: "var(--destructive)", cursor: "pointer", fontFamily: "inherit" },
};
