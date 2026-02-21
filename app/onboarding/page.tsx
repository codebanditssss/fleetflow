"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/theme-toggle";

const ROLES = [
    {
        id: "fleet_manager",
        label: "Fleet Manager",
        desc: "Oversee vehicle health, asset lifecycle, and scheduling.",
    },
    {
        id: "dispatcher",
        label: "Dispatcher",
        desc: "Create trips, assign drivers, validate cargo loads.",
    },
    {
        id: "safety_officer",
        label: "Safety Officer",
        desc: "Monitor driver compliance and license expiration.",
    },
    {
        id: "financial_analyst",
        label: "Financial Analyst",
        desc: "Audit fuel spend, maintenance ROI, and costs.",
    },
];

export default function OnboardingPage() {
    const supabase = createClient();
    const router = useRouter();

    const [step, setStep] = useState<1 | 2>(1);
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setMounted(true); }, []);

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        if (f.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
        setFile(f);
        setError("");
        if (f.type.startsWith("image/")) {
            const url = URL.createObjectURL(f);
            setPreview(url);
        } else {
            setPreview(null); // PDF — show name only
        }
    }

    async function handleSubmit() {
        if (!file) { setError("Please upload a proof document."); return; }
        setLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated.");

            // Upload proof to storage
            const ext = file.name.split(".").pop();
            const path = `${user.id}/proof.${ext}`;
            const { error: uploadErr } = await supabase.storage
                .from("proofs")
                .upload(path, file, { upsert: true });
            if (uploadErr) throw uploadErr;

            const { data: { publicUrl } } = supabase.storage
                .from("proofs")
                .getPublicUrl(path);

            // Insert profile
            const { error: insertErr } = await supabase.from("profiles").insert({
                id: user.id,
                full_name: fullName.trim(),
                role,
                proof_url: publicUrl,
                status: "pending",
            });
            if (insertErr) throw insertErr;

            router.push("/pending");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setLoading(false);
        }
    }

    if (!mounted) return null;

    return (
        <div style={s.page}>
            <div style={{ position: "fixed", top: "20px", right: "20px" }}>
                <ThemeToggle />
            </div>
            <div style={s.card}>

                {/* Header */}
                <div style={s.header}>
                    <div style={s.logoRow}>
                        <div style={s.logoBox}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                                <rect x="1" y="3" width="15" height="13" />
                                <path d="M16 8h4l3 5v4h-7V8z" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                            </svg>
                        </div>
                        <span style={s.logoText}>FleetFlow</span>
                    </div>
                    <h1 style={s.heading}>Complete your profile</h1>
                    <p style={s.sub}>
                        Your details will be reviewed by an admin before you get access.
                    </p>
                </div>

                {/* Step indicator */}
                <div style={s.steps}>
                    <div style={{ ...s.stepItem, ...(step >= 1 ? s.stepActive : {}) }}>
                        <div style={s.stepDot}>{step > 1 ? "✓" : "1"}</div>
                        <span>Your details</span>
                    </div>
                    <div style={s.stepLine} />
                    <div style={{ ...s.stepItem, ...(step >= 2 ? s.stepActive : {}) }}>
                        <div style={s.stepDot}>2</div>
                        <span>Role &amp; proof</span>
                    </div>
                </div>

                {/* Error */}
                {error && <div style={s.errorBox}>{error}</div>}

                {/* ── Step 1: Name ── */}
                {step === 1 && (
                    <div style={s.section}>
                        <div style={s.field}>
                            <label style={s.label} htmlFor="fullname">Full name</label>
                            <input
                                id="fullname"
                                type="text"
                                autoFocus
                                required
                                placeholder="Alex Johnson"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={s.input}
                                onFocus={(e) => Object.assign(e.target.style, s.inputFocus)}
                                onBlur={(e) => Object.assign(e.target.style, { borderColor: "var(--border)", boxShadow: "none" })}
                            />
                        </div>
                        <button
                            style={s.primaryBtn}
                            disabled={fullName.trim().length < 2}
                            onClick={() => { setError(""); setStep(2); }}
                        >
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                Continue
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </span>
                        </button>
                    </div>
                )}

                {/* ── Step 2: Role + proof ── */}
                {step === 2 && (
                    <div style={s.section}>
                        {/* Role cards */}
                        <div style={s.fieldLabel}>Select your role</div>
                        <div style={s.roleGrid}>
                            {ROLES.map((r) => (
                                <button
                                    key={r.id}
                                    style={{
                                        ...s.roleCard,
                                        ...(role === r.id ? s.roleCardActive : {}),
                                    }}
                                    onClick={() => setRole(r.id)}
                                    type="button"
                                >
                                    <div style={s.roleCardTop}>
                                        <span style={{
                                            ...s.roleLabel,
                                            ...(role === r.id ? { color: "var(--ring)" } : {}),
                                        }}>{r.label}</span>
                                        {role === r.id && (
                                            <span style={s.checkmark}>✓</span>
                                        )}
                                    </div>
                                    <span style={s.roleDesc}>{r.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* Proof upload */}
                        <div style={s.field}>
                            <label style={s.label}>
                                Proof of employment{" "}
                                <span style={s.labelMuted}>(ID card, offer letter, or badge — JPG/PNG/PDF, max 5 MB)</span>
                            </label>
                            <div
                                style={{
                                    ...s.uploadArea,
                                    ...(preview ? s.uploadAreaFilled : {}),
                                }}
                                onClick={() => fileRef.current?.click()}
                            >
                                {preview ? (
                                    <img src={preview} alt="proof preview" style={s.previewImg} />
                                ) : file ? (
                                    <div style={s.fileNameRow}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" style={{ color: "var(--primary)" }}>
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                        <span style={s.fileName}>{file.name}</span>
                                    </div>
                                ) : (
                                    <div style={s.uploadPlaceholder}>
                                        <div style={{ marginBottom: "12px", color: "var(--muted-foreground)" }}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17 8 12 3 7 8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <span style={s.uploadText}>Click to upload</span>
                                        <span style={s.uploadSub}>JPG, PNG or PDF</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                style={{ display: "none" }}
                                onChange={handleFile}
                            />
                            {file && (
                                <button style={s.changeFileBtn} onClick={() => fileRef.current?.click()}>
                                    Change file
                                </button>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={s.actions}>
                            <button style={s.backBtn} onClick={() => setStep(1)}>
                                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    Back
                                </span>
                            </button>
                            <button
                                id="btn-submit-onboarding"
                                style={s.primaryBtn}
                                disabled={!role || !file || loading}
                                onClick={handleSubmit}
                            >
                                {loading ? <span style={s.spinner} /> : "Submit for approval"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
        padding: "24px",
    },
    card: {
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "var(--card)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        padding: "36px 32px",
        boxShadow: "var(--shadow-md)",
    },
    header: { marginBottom: "24px" },
    logoRow: {
        display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px",
    },
    logoBox: {
        width: "34px", height: "34px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "var(--radius)", flexShrink: 0,
    },
    logoText: {
        fontSize: "16px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "0.5px",
    },
    heading: {
        fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px",
    },
    sub: {
        fontSize: "13px", color: "var(--muted-foreground)", lineHeight: "1.5",
    },

    // Steps
    steps: {
        display: "flex", alignItems: "center", gap: "0",
        marginBottom: "28px",
    },
    stepItem: {
        display: "flex", alignItems: "center", gap: "8px",
        fontSize: "12px", color: "var(--muted-foreground)",
        flex: 1,
    },
    stepActive: { color: "var(--foreground)", fontWeight: 500 },
    stepDot: {
        width: "22px", height: "22px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        backgroundColor: "var(--secondary)",
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: 600, flexShrink: 0,
    },
    stepLine: {
        flex: 1, height: "1px", backgroundColor: "var(--border)", margin: "0 8px",
    },

    errorBox: {
        padding: "10px 14px",
        borderRadius: "var(--radius)",
        fontSize: "13px",
        marginBottom: "16px",
        backgroundColor: "oklch(0.6168 0.2086 25.8088 / 0.1)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "oklch(0.6168 0.2086 25.8088 / 0.3)",
        color: "var(--destructive)",
    },

    section: { display: "flex", flexDirection: "column", gap: "16px" },

    field: { display: "flex", flexDirection: "column", gap: "6px" },
    fieldLabel: { fontSize: "12px", fontWeight: 500, color: "var(--foreground)", letterSpacing: "0.3px" },
    label: { fontSize: "12px", fontWeight: 500, color: "var(--foreground)", letterSpacing: "0.3px" },
    labelMuted: { fontWeight: 400, color: "var(--muted-foreground)" },
    input: {
        padding: "9px 12px",
        backgroundColor: "var(--input)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        fontSize: "14px",
        color: "var(--foreground)",
        fontFamily: "inherit",
        outline: "none",
        transition: "borderColor 0.15s, boxShadow 0.15s",
        width: "100%",
    },
    inputFocus: {
        borderColor: "var(--ring)",
        boxShadow: "0 0 0 2px oklch(0.8520 0.1269 195.0354 / 0.15)",
    },

    // Role cards
    roleGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
    },
    roleCard: {
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        gap: "4px",
        padding: "12px",
        backgroundColor: "var(--secondary)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "borderColor 0.15s, backgroundColor 0.15s",
    },
    roleCardActive: {
        borderColor: "var(--ring)",
        backgroundColor: "var(--muted)",
    },
    roleCardTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: "6px",
    },
    checkmark: {
        width: "16px", height: "16px",
        borderRadius: "50%",
        backgroundColor: "var(--ring)",
        color: "var(--background)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "9px", fontWeight: 700,
        flexShrink: 0,
    },
    roleLabel: { fontSize: "13px", fontWeight: 600, color: "var(--foreground)" },
    roleDesc: { fontSize: "11px", color: "var(--muted-foreground)", lineHeight: "1.4" },

    // Upload
    uploadArea: {
        borderWidth: "1px",
        borderStyle: "dashed",
        borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        padding: "24px",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        minHeight: "120px",
        transition: "borderColor 0.15s, backgroundColor 0.15s",
        backgroundColor: "var(--secondary)",
    },
    uploadAreaFilled: {
        padding: "8px",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
    },
    uploadPlaceholder: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"
    },
    uploadText: { display: "block", fontSize: "13px", color: "var(--foreground)", fontWeight: 500 },
    uploadSub: { display: "block", fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" },
    previewImg: {
        maxWidth: "100%", maxHeight: "160px",
        objectFit: "contain", borderRadius: "var(--radius)",
    },
    fileNameRow: {
        display: "flex", alignItems: "center", gap: "10px",
    },
    fileName: { fontSize: "13px", color: "var(--foreground)", wordBreak: "break-all" },
    changeFileBtn: {
        background: "none", border: "none", cursor: "pointer",
        fontSize: "12px", color: "var(--muted-foreground)",
        textDecoration: "underline", fontFamily: "inherit", padding: 0,
    },

    // Buttons
    actions: { display: "flex", gap: "10px", marginTop: "4px" },
    primaryBtn: {
        flex: 1,
        padding: "10px",
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
        border: "none",
        borderRadius: "var(--radius)",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "40px",
        transition: "opacity 0.15s",
    },
    backBtn: {
        padding: "10px 16px",
        backgroundColor: "var(--secondary)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        fontSize: "14px",
        cursor: "pointer",
        fontFamily: "inherit",
    },
    spinner: {
        display: "inline-block",
        width: "16px", height: "16px",
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
};
