"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogMaintenanceModal from "./log-maintenance-modal";

interface MaintenanceLog {
    id: string;
    service_type: string;
    cost: number;
    odometer: number;
    description: string | null;
    date: string;
    status: string;
    vehicle: { registration_no: string; id: string } | null;
}

interface Props {
    logs: MaintenanceLog[];
    canWrite: boolean;
}

export default function MaintenanceTable({ logs, canWrite }: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    async function handleComplete(log: MaintenanceLog) {
        if (!log.vehicle) return;
        setLoading(log.id);

        const { error } = await supabase.rpc("complete_maintenance", {
            l_id: log.id,
            v_id: log.vehicle.id
        });

        if (error) alert(error.message);

        setLoading(null);
        router.refresh();
    }

    return (
        <>
            <div style={s.toolbar}>
                <span style={s.count}>{logs.length} service logs recorded</span>
                {canWrite && (
                    <button style={s.addBtn} onClick={() => setShowAdd(true)}>
                        + Log Maintenance
                    </button>
                )}
            </div>

            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr>
                            {["Date", "Vehicle", "Service Type", "Details", "Cost (₹)", "Status", ...(canWrite ? [""] : [])].map((h) => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan={7} style={s.empty}>No maintenance logs found.</td></tr>
                        ) : (
                            logs.map((l) => (
                                <tr key={l.id} style={s.tr}>
                                    <td style={s.td}>{new Date(l.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                                    <td style={{ ...s.td, fontWeight: 600 }}>{l.vehicle?.registration_no ?? "—"}</td>
                                    <td style={s.td}>{l.service_type}</td>
                                    <td style={{ ...s.td, fontSize: "11px", color: "var(--muted-foreground)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {l.description || "—"}
                                    </td>
                                    <td style={s.td}>₹{Number(l.cost).toLocaleString()}</td>
                                    <td style={s.td}>
                                        <span style={{
                                            ...s.statusTag,
                                            backgroundColor: l.status === "completed" ? "oklch(0.7 0.17 150 / 0.1)" : "oklch(0.75 0.18 60 / 0.1)",
                                            color: l.status === "completed" ? "oklch(0.7 0.17 150)" : "oklch(0.75 0.18 60)"
                                        }}>
                                            {l.status === "in_progress" ? "In Shop" : "Done"}
                                        </span>
                                    </td>
                                    {canWrite && (
                                        <td style={{ ...s.td, textAlign: "right" }}>
                                            {l.status === "in_progress" && (
                                                <button
                                                    style={s.finishBtn}
                                                    onClick={() => handleComplete(l)}
                                                    disabled={loading === l.id}
                                                >
                                                    {loading === l.id ? "..." : "Mark Available"}
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <LogMaintenanceModal open={showAdd} onClose={() => setShowAdd(false)} />
        </>
    );
}

const s: Record<string, React.CSSProperties> = {
    toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
    count: { fontSize: "13px", color: "var(--muted-foreground)" },
    addBtn: { padding: "7px 16px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer" },
    tableWrap: { overflowX: "auto", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)", backgroundColor: "var(--card)" },
    tr: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)" },
    td: { padding: "11px 14px", color: "var(--foreground)", backgroundColor: "var(--card)", whiteSpace: "nowrap", verticalAlign: "middle" },
    empty: { padding: "40px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "12px" },
    statusTag: { padding: "2px 8px", borderRadius: "var(--radius)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" },
    finishBtn: { padding: "4px 10px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "11px", color: "var(--primary-foreground)", cursor: "pointer", fontWeight: 600 },
};
