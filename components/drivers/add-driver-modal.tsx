"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface Driver {
    id: string;
    full_name: string;
    license_number: string;
    license_expiry: string;
    phone: string | null;
    vehicle_category: string;
    status: string;
    safety_score: number;
    trips_completed: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    editDriver?: Driver | null;
}

const CATEGORIES = ["any", "van", "truck", "heavy", "tanker", "pickup"];
const STATUSES = ["active", "inactive", "suspended"];

const EMPTY = {
    full_name: "",
    license_number: "",
    license_expiry: "",
    phone: "",
    vehicle_category: "any",
    status: "active",
    safety_score: 100,
};

export default function AddDriverModal({ open, onClose, editDriver }: Props) {
    const supabase = createClient();
    const router = useRouter();
    const [form, setForm] = useState(editDriver ? {
        full_name: editDriver.full_name,
        license_number: editDriver.license_number,
        license_expiry: editDriver.license_expiry,
        phone: editDriver.phone ?? "",
        vehicle_category: editDriver.vehicle_category,
        status: editDriver.status,
        safety_score: editDriver.safety_score,
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
            phone: form.phone || null,
            safety_score: Number(form.safety_score),
        };

        let err;
        if (editDriver) {
            ({ error: err } = await supabase.from("drivers").update(payload).eq("id", editDriver.id));
        } else {
            ({ error: err } = await supabase.from("drivers").insert(payload));
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
                    <span style={s.title}>{editDriver ? "Edit Driver" : "Add Driver"}</span>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form style={s.form} onSubmit={handleSubmit}>
                    <div style={s.row}>
                        <Field label="Full Name *">
                            <input style={s.input} value={form.full_name}
                                onChange={(e) => set("full_name", e.target.value)}
                                placeholder="e.g. Rajesh Kumar" required />
                        </Field>
                        <Field label="Phone">
                            <input style={s.input} value={form.phone}
                                onChange={(e) => set("phone", e.target.value)}
                                placeholder="+91 98765 43210" />
                        </Field>
                    </div>

                    <div style={s.row}>
                        <Field label="License No. *">
                            <input style={s.input} value={form.license_number}
                                onChange={(e) => set("license_number", e.target.value)}
                                placeholder="e.g. MH0120250012345" required />
                        </Field>
                        <Field label="License Expiry *">
                            <input style={s.input} type="date" value={form.license_expiry}
                                onChange={(e) => set("license_expiry", e.target.value)} required />
                        </Field>
                    </div>

                    <div style={s.row}>
                        <Field label="Vehicle Category">
                            <select style={s.input} value={form.vehicle_category}
                                onChange={(e) => set("vehicle_category", e.target.value)}>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c === "any" ? "Any" : c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Status">
                            <select style={s.input} value={form.status}
                                onChange={(e) => set("status", e.target.value)}>
                                {STATUSES.map((st) => (
                                    <option key={st} value={st}>
                                        {st === "active" ? "On Duty" : st === "inactive" ? "Off Duty" : "Suspended"}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <Field label="Safety Score (0–100)">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <input style={{ ...s.input, flex: 1 }} type="range" min={0} max={100}
                                value={form.safety_score}
                                onChange={(e) => set("safety_score", e.target.value)} />
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", minWidth: "36px" }}>
                                {form.safety_score}
                            </span>
                        </div>
                    </Field>

                    {error && <p style={s.error}>{error}</p>}

                    <div style={s.actions}>
                        <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={s.submitBtn} disabled={loading}>
                            {loading ? "Saving…" : editDriver ? "Save Changes" : "Add Driver"}
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
    error: { fontSize: "12px", color: "var(--destructive)" },
    actions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" },
    cancelBtn: { padding: "8px 16px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", fontSize: "13px", color: "var(--muted-foreground)", cursor: "pointer", fontFamily: "inherit" },
    submitBtn: { padding: "8px 18px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer", fontFamily: "inherit" },
};
