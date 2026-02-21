"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "./status-badge";
import AddVehicleModal, { type Vehicle } from "./add-vehicle-modal";

interface Props {
    vehicles: Vehicle[];
    canWrite: boolean;
}

export default function VehicleTable({ vehicles, canWrite }: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    async function handleDelete(id: string) {
        if (!confirm("Delete this vehicle?")) return;
        setDeleting(id);
        await supabase.from("vehicles").delete().eq("id", id);
        setDeleting(null);
        router.refresh();
    }

    return (
        <>
            {/* Header row */}
            <div style={s.toolbar}>
                <span style={s.count}>{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}</span>
                {canWrite && (
                    <button style={s.addBtn} onClick={() => setShowAdd(true)}>
                        + Add Vehicle
                    </button>
                )}
            </div>

            {/* Table or empty */}
            {vehicles.length === 0 ? (
                <div style={s.empty}>
                    No vehicles yet.{canWrite ? " Click \"+ Add Vehicle\" to register one." : ""}
                </div>
            ) : (
                <div style={s.tableWrap}>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                {["Registration", "Type", "Status", "Fuel %", "KM Driven", "Next Service", ...(canWrite ? [""] : [])].map((h) => (
                                    <th key={h} style={s.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((v) => (
                                <tr key={v.id} style={s.tr}>
                                    <td style={{ ...s.td, ...s.mono }}>{v.registration_no}</td>
                                    <td style={s.td}>{v.type.charAt(0).toUpperCase() + v.type.slice(1)}</td>
                                    <td style={s.td}><StatusBadge status={v.status} /></td>
                                    <td style={s.td}>
                                        <FuelBar percent={v.fuel_percent} />
                                    </td>
                                    <td style={s.td}>{v.km_driven.toLocaleString()} km</td>
                                    <td style={s.td}>{v.next_maintenance_date
                                        ? new Date(v.next_maintenance_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                        : "—"}
                                    </td>
                                    {canWrite && (
                                        <td style={{ ...s.td, ...s.actions }}>
                                            <button style={s.editBtn} onClick={() => setEditing(v)}>Edit</button>
                                            <button
                                                style={s.deleteBtn}
                                                onClick={() => handleDelete(v.id)}
                                                disabled={deleting === v.id}
                                            >
                                                {deleting === v.id ? "…" : "Delete"}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            <AddVehicleModal open={showAdd} onClose={() => setShowAdd(false)} />
            <AddVehicleModal open={!!editing} onClose={() => setEditing(null)} editVehicle={editing} />
        </>
    );
}

function FuelBar({ percent }: { percent: number }) {
    const color =
        percent > 50 ? "oklch(0.7 0.17 150)" :
            percent > 20 ? "oklch(0.75 0.18 60)" :
                "var(--destructive)";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "60px", height: "5px", backgroundColor: "var(--muted)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${percent}%`, height: "100%", backgroundColor: color, borderRadius: "2px" }} />
            </div>
            <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{percent}%</span>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
    count: { fontSize: "13px", color: "var(--muted-foreground)" },
    addBtn: { padding: "7px 16px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer", fontFamily: "inherit" },
    empty: {
        padding: "48px 24px", textAlign: "center", fontSize: "13px",
        color: "var(--muted-foreground)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)", backgroundColor: "var(--card)",
    },
    tableWrap: { overflowX: "auto", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: {
        padding: "10px 14px", textAlign: "left",
        fontSize: "11px", fontWeight: 500, color: "var(--muted-foreground)",
        textTransform: "uppercase", letterSpacing: "0.5px",
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)",
        backgroundColor: "var(--card)", whiteSpace: "nowrap",
    },
    tr: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)" },
    td: { padding: "11px 14px", color: "var(--foreground)", backgroundColor: "var(--card)", whiteSpace: "nowrap" },
    mono: { fontFamily: "inherit", letterSpacing: "0.5px", fontSize: "12px" },
    actions: { display: "flex", gap: "6px", justifyContent: "flex-end" },
    editBtn: { padding: "4px 10px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", fontSize: "11px", color: "var(--foreground)", cursor: "pointer", fontFamily: "inherit" },
    deleteBtn: { padding: "4px 10px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--destructive)", borderRadius: "var(--radius)", fontSize: "11px", color: "var(--destructive)", cursor: "pointer", fontFamily: "inherit" },
};
