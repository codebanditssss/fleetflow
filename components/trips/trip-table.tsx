"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TripStatusBadge from "./trip-status-badge";
import AddTripModal from "./add-trip-modal";
import { formatDistanceToNow } from "date-fns";

interface Trip {
    id: string;
    origin: string;
    destination: string;
    status: string;
    cargo_type: string | null;
    cargo_weight_kg: number;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    vehicle: { registration_no: string; id: string; km_driven: number } | null;
    driver: { full_name: string; id: string } | null;
}

interface Props {
    trips: Trip[];
    canWrite: boolean;
}

export default function TripTable({ trips, canWrite }: Props) {
    const [showAdd, setShowAdd] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    async function handleDispatch(trip: Trip) {
        if (!trip.vehicle || !trip.driver) return;
        setActionLoading(trip.id);

        // Lifecycle: Dispatched
        // 1. Update Trip: status -> 'active', started_at -> now
        // 2. Update Vehicle: status -> 'active' (on trip)
        // 3. Update Driver: status -> 'on_trip'

        const { error } = await supabase.rpc('dispatch_trip', {
            t_id: trip.id,
            v_id: trip.vehicle.id,
            d_id: trip.driver.id
        });

        if (error) alert(error.message);

        setActionLoading(null);
        router.refresh();
    }

    async function handleComplete(trip: Trip) {
        if (!trip.vehicle || !trip.driver) return;

        const newKm = prompt(`Enter final odometer reading (Current: ${trip.vehicle.km_driven} km):`, trip.vehicle.km_driven.toString());
        if (newKm === null) return;

        const kmVal = Number(newKm);
        if (isNaN(kmVal) || kmVal < trip.vehicle.km_driven) {
            alert("Invalid odometer reading.");
            return;
        }

        setActionLoading(trip.id);

        // Lifecycle: Completed
        // 1. Update Trip: status -> 'completed', completed_at -> now
        // 2. Update Vehicle: status -> 'idle', km_driven -> kmVal
        // 3. Update Driver: status -> 'active', trips_completed -> count + 1

        const { error } = await supabase.rpc('complete_trip', {
            t_id: trip.id,
            v_id: trip.vehicle.id,
            d_id: trip.driver.id,
            new_km: kmVal
        });

        if (error) alert(error.message);

        setActionLoading(null);
        router.refresh();
    }

    return (
        <>
            <div style={s.toolbar}>
                <span style={s.count}>{trips.length} trip{trips.length !== 1 ? "s" : ""} logged</span>
                {canWrite && (
                    <button style={s.addBtn} onClick={() => setShowAdd(true)}>
                        + Dispatch Trip
                    </button>
                )}
            </div>

            {trips.length === 0 ? (
                <div style={s.empty}>
                    No trips scheduled yet. Click "+ Dispatch Trip" to start one.
                </div>
            ) : (
                <div style={s.tableWrap}>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                {["ID / Created", "Vehicle", "Driver", "Route", "Cargo", "Status", ...(canWrite ? ["Actions"] : [])].map((h) => (
                                    <th key={h} style={s.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map((t) => (
                                <tr key={t.id} style={s.tr}>
                                    <td style={s.td}>
                                        <div style={s.id}>{t.id.slice(0, 8)}...</div>
                                        <div style={s.time}>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</div>
                                    </td>
                                    <td style={s.td}>
                                        <div style={s.mono}>{t.vehicle?.registration_no ?? "—"}</div>
                                    </td>
                                    <td style={s.td}>{t.driver?.full_name ?? "—"}</td>
                                    <td style={s.td}>
                                        <div style={{ fontWeight: 500 }}>{t.origin} → {t.destination}</div>
                                    </td>
                                    <td style={s.td}>
                                        <div style={{ fontSize: "12px" }}>{t.cargo_type ?? "General"}</div>
                                        <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>{t.cargo_weight_kg} kg</div>
                                    </td>
                                    <td style={s.td}><TripStatusBadge status={t.status} /></td>

                                    {canWrite && (
                                        <td style={{ ...s.td, ...s.actionsCell }}>
                                            {t.status === "pending" && (
                                                <button
                                                    style={s.dispatchBtn}
                                                    onClick={() => handleDispatch(t)}
                                                    disabled={actionLoading === t.id}
                                                >
                                                    {actionLoading === t.id ? "..." : "Dispatch"}
                                                </button>
                                            )}
                                            {t.status === "active" && (
                                                <button
                                                    style={s.completeBtn}
                                                    onClick={() => handleComplete(t)}
                                                    disabled={actionLoading === t.id}
                                                >
                                                    {actionLoading === t.id ? "..." : "Finish Trip"}
                                                </button>
                                            )}
                                            {t.status === "completed" && (
                                                <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                                                    Finished {t.completed_at && new Date(t.completed_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AddTripModal open={showAdd} onClose={() => setShowAdd(false)} />
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
    id: { fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "monospace" },
    time: { fontSize: "11px", color: "var(--muted-foreground)" },
    mono: { fontFamily: "inherit", letterSpacing: "0.5px", fontSize: "12px", fontWeight: 600 },
    actionsCell: { display: "flex", gap: "6px", justifyContent: "flex-end" },
    dispatchBtn: { padding: "5px 12px", backgroundColor: "oklch(0.7 0.17 150)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "11px", color: "white", cursor: "pointer", fontWeight: 600 },
    completeBtn: { padding: "5px 12px", backgroundColor: "var(--ring)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "11px", color: "white", cursor: "pointer", fontWeight: 600 },
};
