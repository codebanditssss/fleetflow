"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Vehicle {
    id: string;
    registration_no: string;
    model: string | null;
    max_capacity: number;
}

interface Driver {
    id: string;
    full_name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function AddTripModal({ open, onClose }: Props) {
    const supabase = createClient();
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        vehicle_id: "",
        driver_id: "",
        origin: "",
        destination: "",
        cargo_type: "",
        cargo_weight_kg: 0,
    });

    // Fetch available assets
    useEffect(() => {
        if (!open) return;

        async function fetchData() {
            setFetching(true);
            const today = new Date().toISOString().split("T")[0];

            const [vRes, dRes] = await Promise.all([
                supabase.from("vehicles").select("id, registration_no, model, max_capacity").eq("status", "idle"),
                supabase.from("drivers")
                    .select("id, full_name")
                    .eq("status", "active")
                    .gt("license_expiry", today), // STRICT: Must not be expired
            ]);

            if (vRes.data) setVehicles(vRes.data);
            if (dRes.data) setDrivers(dRes.data);
            setFetching(false);
        }

        fetchData();
    }, [open, supabase]);

    if (!open) return null;

    function set(key: string, value: string | number) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        // 1. Validation: Capacity check
        const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id);
        if (selectedVehicle && Number(form.cargo_weight_kg) > selectedVehicle.max_capacity) {
            setError(`Overweight! Cargo (${form.cargo_weight_kg}kg) exceeds vehicle capacity (${selectedVehicle.max_capacity}kg).`);
            setLoading(false);
            return;
        }

        try {
            // 2. Insert Trip (status defaults to 'pending' as per Schema)
            const { error: tripErr } = await supabase
                .from("trips")
                .insert({
                    ...form,
                    cargo_weight_kg: Number(form.cargo_weight_kg),
                    status: "pending"
                });

            if (tripErr) throw tripErr;

            router.refresh();
            onClose();
            setForm({
                vehicle_id: "",
                driver_id: "",
                origin: "",
                destination: "",
                cargo_type: "",
                cargo_weight_kg: 0,
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={s.overlay} onClick={onClose}>
            <div style={s.modal} onClick={(e) => e.stopPropagation()}>
                <div style={s.header}>
                    <span style={s.title}>Dispatch New Trip</span>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form style={s.form} onSubmit={handleSubmit}>
                    <div style={s.row}>
                        <Field label="Vehicle *">
                            <select
                                style={s.input}
                                value={form.vehicle_id}
                                onChange={(e) => set("vehicle_id", e.target.value)}
                                required
                                disabled={fetching}
                            >
                                <option value="">Select IDLE Vehicle</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.registration_no} ({v.model ?? "Generic"}) - {v.max_capacity}kg max
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div style={s.row}>
                        <Field label="Driver *">
                            <select
                                style={s.input}
                                value={form.driver_id}
                                onChange={(e) => set("driver_id", e.target.value)}
                                required
                                disabled={fetching}
                            >
                                <option value="">Select ON DUTY Driver</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.full_name}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div style={s.row}>
                        <Field label="Origin *">
                            <input style={s.input} value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Source city/warehouse" required />
                        </Field>
                        <Field label="Destination *">
                            <input style={s.input} value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="Delivery location" required />
                        </Field>
                    </div>

                    <div style={s.row}>
                        <Field label="Cargo Type">
                            <input style={s.input} value={form.cargo_type} onChange={(e) => set("cargo_type", e.target.value)} placeholder="e.g. Perishables, Electronics" />
                        </Field>
                        <Field label="Weight (kg) *">
                            <input style={s.input} type="number" value={form.cargo_weight_kg} onChange={(e) => set("cargo_weight_kg", e.target.value)} min={1} required />
                        </Field>
                    </div>

                    {error && <p style={s.error}>{error}</p>}
                    {fetching && <p style={s.hint}>Fetching available assets...</p>}

                    <div style={s.actions}>
                        <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={s.submitBtn} disabled={loading || fetching}>
                            {loading ? "Dispatching..." : "Create Draft Trip"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    overlay: { position: "fixed", inset: 0, backgroundColor: "oklch(0 0 0 / 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
    modal: { width: "100%", maxWidth: "520px", backgroundColor: "var(--card)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)", overflow: "hidden" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)" },
    title: { fontSize: "14px", fontWeight: 600, color: "var(--foreground)" },
    closeBtn: { background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: "14px", fontFamily: "inherit" },
    form: { padding: "20px", display: "flex", flexDirection: "column", gap: "14px" },
    row: { display: "flex", gap: "12px" },
    input: { width: "100%", padding: "8px 10px", backgroundColor: "var(--input)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", color: "var(--foreground)", fontSize: "13px", fontFamily: "inherit", outline: "none" },
    error: { fontSize: "12px", color: "var(--destructive)", backgroundColor: "oklch(0.6168 0.2086 25.8 / 0.1)", padding: "10px", borderRadius: "var(--radius)" },
    hint: { fontSize: "12px", color: "var(--muted-foreground)" },
    actions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" },
    cancelBtn: { padding: "8px 16px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", fontSize: "13px", color: "var(--muted-foreground)", cursor: "pointer", fontFamily: "inherit" },
    submitBtn: { padding: "8px 18px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer", fontFamily: "inherit" },
};
