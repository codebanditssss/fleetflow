"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
    open: boolean;
    onClose: () => void;
    editVehicle?: Vehicle | null;
}

export interface Vehicle {
    id: string;
    registration_no: string;
    type: string;
    status: string;
    fuel_percent: number;
    km_driven: number;
    next_maintenance_date: string | null;
}

const TYPES = ["truck", "van", "heavy", "tanker", "pickup"];
const STATUSES = ["active", "idle", "maintenance", "retired"];

const EMPTY = {
    registration_no: "",
    type: "truck",
    status: "idle",
    fuel_percent: 100,
    km_driven: 0,
    next_maintenance_date: "",
};

export default function AddVehicleModal({ open, onClose, editVehicle }: Props) {
    const supabase = createClient();
    const router = useRouter();
    const [form, setForm] = useState(editVehicle ? {
        registration_no: editVehicle.registration_no,
        type: editVehicle.type,
        status: editVehicle.status,
        fuel_percent: editVehicle.fuel_percent,
        km_driven: editVehicle.km_driven,
        next_maintenance_date: editVehicle.next_maintenance_date ?? "",
    } : EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!open) return null;

    function set(key: string, value: string | number) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload = {
            ...form,
            fuel_percent: Number(form.fuel_percent),
            km_driven: Number(form.km_driven),
            next_maintenance_date: form.next_maintenance_date || null,
        };

        let err;
        if (editVehicle) {
            ({ error: err } = await supabase.from("vehicles").update(payload).eq("id", editVehicle.id));
        } else {
            ({ error: err } = await supabase.from("vehicles").insert(payload));
        }

        setLoading(false);
        if (err) { setError(err.message); return; }
        router.refresh();
        onClose();
    }

    return (
        <div style={s.overlay} onClick={onClose}>
            <div style={s.modal} onClick={(e) => e.stopPropagation()}>
                <div style={s.header}>
                    <span style={s.title}>{editVehicle ? "Edit Vehicle" : "Add Vehicle"}</span>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form style={s.form} onSubmit={handleSubmit}>
                    <Field label="Registration No." required>
                        <input style={s.input} value={form.registration_no}
                            onChange={(e) => set("registration_no", e.target.value)}
                            placeholder="e.g. MH12AB1234" required />
                    </Field>

                    <div style={s.row}>
                        <Field label="Type">
                            <select style={s.input} value={form.type} onChange={(e) => set("type", e.target.value)}>
                                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </Field>
                        <Field label="Status">
                            <select style={s.input} value={form.status} onChange={(e) => set("status", e.target.value)}>
                                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </Field>
                    </div>

                    <div style={s.row}>
                        <Field label="Fuel (%)">
                            <input style={s.input} type="number" min={0} max={100}
                                value={form.fuel_percent}
                                onChange={(e) => set("fuel_percent", e.target.value)} />
                        </Field>
                        <Field label="KM Driven">
                            <input style={s.input} type="number" min={0}
                                value={form.km_driven}
                                onChange={(e) => set("km_driven", e.target.value)} />
                        </Field>
                    </div>

                    <Field label="Next Maintenance Date">
                        <input style={s.input} type="date"
                            value={form.next_maintenance_date ?? ""}
                            onChange={(e) => set("next_maintenance_date", e.target.value)} />
                    </Field>

                    {error && <p style={s.error}>{error}</p>}

                    <div style={s.actions}>
                        <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={s.submitBtn} disabled={loading}>
                            {loading ? "Saving…" : editVehicle ? "Save Changes" : "Add Vehicle"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}{required && " *"}
            </label>
            {children}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    overlay: {
        position: "fixed", inset: 0,
        backgroundColor: "oklch(0 0 0 / 0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
    },
    modal: {
        width: "100%", maxWidth: "480px",
        backgroundColor: "var(--card)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
    },
    header: {
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px",
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)",
    },
    title: { fontSize: "14px", fontWeight: 600, color: "var(--foreground)" },
    closeBtn: { background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: "14px", fontFamily: "inherit" },
    form: { padding: "20px", display: "flex", flexDirection: "column", gap: "16px" },
    row: { display: "flex", gap: "12px" },
    input: {
        width: "100%", padding: "8px 10px",
        backgroundColor: "var(--input)",
        borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        color: "var(--foreground)", fontSize: "13px", fontFamily: "inherit",
        outline: "none",
    },
    error: { fontSize: "12px", color: "var(--destructive)" },
    actions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" },
    cancelBtn: { padding: "8px 16px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", fontSize: "13px", color: "var(--muted-foreground)", cursor: "pointer", fontFamily: "inherit" },
    submitBtn: { padding: "8px 18px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer", fontFamily: "inherit" },
};
