"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Vehicle {
    id: string;
    registration_no: string;
    km_driven: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function LogMaintenanceModal({ open, onClose }: Props) {
    const supabase = createClient();
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        vehicle_id: "",
        service_type: "Routine Checkup",
        description: "",
        odometer: 0,
        cost: 0,
    });

    useEffect(() => {
        if (!open) return;
        async function fetchVehicles() {
            // Fetch vehicles that are NOT in maintenance
            const { data } = await supabase.from("vehicles").select("id, registration_no, km_driven").neq("status", "maintenance");
            if (data) setVehicles(data);
        }
        fetchVehicles();
    }, [open, supabase]);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Use the RPC to flip status atomically
        const { error: err } = await supabase.rpc("start_maintenance", {
            v_id: form.vehicle_id,
            s_type: form.service_type,
            d_text: form.description,
            odo: Number(form.odometer),
            c_val: Number(form.cost)
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
                    <span style={s.title}>Log Service Entry</span>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>
                <form style={s.form} onSubmit={handleSubmit}>
                    <Field label="Vehicle *">
                        <select style={s.input} value={form.vehicle_id} onChange={(e) => {
                            const v = vehicles.find(x => x.id === e.target.value);
                            setForm({ ...form, vehicle_id: e.target.value, odometer: v?.km_driven ?? 0 });
                        }} required>
                            <option value="">Select Asset</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_no}</option>)}
                        </select>
                    </Field>

                    <Field label="Service Type *">
                        <input style={s.input} value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} placeholder="e.g. Oil Change, Brake Repair" required />
                    </Field>

                    <div style={s.row}>
                        <Field label="Odometer at Service">
                            <input type="number" style={s.input} value={form.odometer} onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })} required />
                        </Field>
                        <Field label="Estimated Cost (₹)">
                            <input type="number" style={s.input} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
                        </Field>
                    </div>

                    <Field label="Description / Notes">
                        <textarea style={{ ...s.input, height: "60px", resize: "none" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Technician names or parts replaced..." />
                    </Field>

                    <p style={{ fontSize: "11px", color: "var(--ring)", fontWeight: 500 }}>
                        ℹ️ Saving this will automatically set the vehicle status to "In Shop".
                    </p>

                    {error && <p style={s.error}>{error}</p>}

                    <div style={s.actions}>
                        <button type="button" style={s.cancelBtn} onClick={onClose}>Cancel</button>
                        <button type="submit" style={s.submitBtn} disabled={loading}>
                            {loading ? "Logging..." : "Start Service"}
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
