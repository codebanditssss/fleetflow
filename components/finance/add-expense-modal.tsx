"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Vehicle {
    id: string;
    registration_no: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function AddExpenseModal({ open, onClose }: Props) {
    const supabase = createClient();
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        vehicle_id: "",
        type: "fuel",
        amount: 0,
        liters: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        if (!open) return;
        async function fetchVehicles() {
            const { data } = await supabase.from("vehicles").select("id, registration_no");
            if (data) setVehicles(data);
        }
        fetchVehicles();
    }, [open, supabase]);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error: err } = await supabase.from("expenses").insert({
            ...form,
            amount: Number(form.amount),
            liters: form.type === "fuel" ? Number(form.liters) : null,
        });

        if (err) {
            setError(err.message);
            setLoading(false);
            return;
        }

        router.refresh();
        onClose();
    }

    return (
        <div style={s.overlay} onClick={onClose}>
            <div style={s.modal} onClick={(e) => e.stopPropagation()}>
                <div style={s.header}>
                    <span style={s.title}>Record Expense</span>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>
                <form style={s.form} onSubmit={handleSubmit}>
                    <Field label="Vehicle *">
                        <select style={s.input} value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} required>
                            <option value="">Select Asset</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_no}</option>)}
                        </select>
                    </Field>

                    <div style={s.row}>
                        <Field label="Category">
                            <select style={s.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                <option value="fuel">Fuel</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="toll">Toll / Fastag</option>
                                <option value="other">Other</option>
                            </select>
                        </Field>
                        <Field label="Date">
                            <input type="date" style={s.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                        </Field>
                    </div>

                    <div style={s.row}>
                        <Field label="Amount (₹) *">
                            <input type="number" style={s.input} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} min={1} required />
                        </Field>
                        {form.type === "fuel" && (
                            <Field label="Liters">
                                <input type="number" style={s.input} value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} step="0.01" />
                            </Field>
                        )}
                    </div>

                    <Field label="Description">
                        <textarea style={{ ...s.input, height: "60px", resize: "none" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Maintenance details or fuel station name..." />
                    </Field>

                    {error && <p style={s.error}>{error}</p>}

                    <div style={s.actions}>
                        <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={s.submitBtn} disabled={loading}>
                            {loading ? "Saving..." : "Log Expense"}
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
    modal: { width: "100%", maxWidth: "440px", backgroundColor: "var(--card)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)", overflow: "hidden" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)" },
    title: { fontSize: "14px", fontWeight: 600, color: "var(--foreground)" },
    closeBtn: { background: "none", border: "none", color: "var(--muted-foreground)", cursor: "pointer", fontSize: "14px" },
    form: { padding: "20px", display: "flex", flexDirection: "column", gap: "14px" },
    row: { display: "flex", gap: "12px" },
    input: { width: "100%", padding: "8px 10px", backgroundColor: "var(--input)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", color: "var(--foreground)", fontSize: "13px", fontFamily: "inherit", outline: "none" },
    error: { fontSize: "12px", color: "var(--destructive)" },
    actions: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" },
    cancelBtn: { padding: "8px 16px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", fontSize: "13px", color: "var(--muted-foreground)", cursor: "pointer" },
    submitBtn: { padding: "8px 18px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer" },
};
