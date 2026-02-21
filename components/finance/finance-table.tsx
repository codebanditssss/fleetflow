"use client";

import { useState } from "react";
import AddExpenseModal from "./add-expense-modal";

interface Expense {
    id: string;
    type: string;
    amount: number;
    liters: number | null;
    description: string | null;
    date: string;
    vehicle: { registration_no: string } | null;
}

interface Props {
    expenses: Expense[];
    canWrite: boolean;
}

export default function FinanceTable({ expenses, canWrite }: Props) {
    const [showAdd, setShowAdd] = useState(false);

    function handleExport() {
        if (!expenses.length) return;

        const headers = ["Date", "Vehicle", "Category", "Amount", "Liters", "Description"];
        const rows = expenses.map(e => [
            e.date,
            e.vehicle?.registration_no ?? "—",
            e.type.toUpperCase(),
            e.amount,
            e.liters ?? "",
            e.description ?? ""
        ]);

        const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `fleetflow_finance_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <>
            <div style={s.toolbar}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button style={s.exportBtn} onClick={handleExport} disabled={!expenses.length}>
                        Export CSV
                    </button>
                </div>
                {canWrite && (
                    <button style={s.addBtn} onClick={() => setShowAdd(true)}>
                        + Record Expense
                    </button>
                )}
            </div>

            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr>
                            {["Date", "Vehicle", "Category", "Description", "Amount (₹)"].map((h) => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr><td colSpan={5} style={s.empty}>No financial records found.</td></tr>
                        ) : (
                            expenses.map((e) => (
                                <tr key={e.id} style={s.tr}>
                                    <td style={s.td}>{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                    <td style={{ ...s.td, fontWeight: 600 }}>{e.vehicle?.registration_no ?? "—"}</td>
                                    <td style={s.td}>
                                        <span style={{ ...s.typeTag, ...(TYPE_COLORS[e.type] ?? {}) }}>
                                            {e.type}
                                        </span>
                                    </td>
                                    <td style={{ ...s.td, fontSize: "12px", color: "var(--muted-foreground)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {e.description || "—"}
                                    </td>
                                    <td style={{ ...s.td, fontWeight: 700, textAlign: "right" }}>₹{Number(e.amount).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AddExpenseModal open={showAdd} onClose={() => setShowAdd(false)} />
        </>
    );
}

const TYPE_COLORS: any = {
    fuel: { backgroundColor: "oklch(0.7 0.17 150 / 0.1)", color: "oklch(0.7 0.17 150)" },
    maintenance: { backgroundColor: "oklch(0.75 0.18 60 / 0.1)", color: "oklch(0.75 0.18 60)" },
    toll: { backgroundColor: "var(--secondary)", color: "var(--foreground)" },
    other: { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" },
};

const s: Record<string, React.CSSProperties> = {
    toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
    addBtn: { padding: "7px 16px", backgroundColor: "var(--primary)", borderWidth: 0, borderRadius: "var(--radius)", fontSize: "13px", fontWeight: 500, color: "var(--primary-foreground)", cursor: "pointer" },
    exportBtn: { padding: "7px 16px", background: "none", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)", fontSize: "13px", color: "var(--foreground)", cursor: "pointer" },
    tableWrap: { overflowX: "auto", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border)", borderRadius: "var(--radius)" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)", backgroundColor: "var(--card)" },
    tr: { borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "var(--border)" },
    td: { padding: "11px 14px", color: "var(--foreground)", backgroundColor: "var(--card)", whiteSpace: "nowrap", verticalAlign: "middle" },
    empty: { padding: "40px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "12px" },
    typeTag: { padding: "2px 8px", borderRadius: "var(--radius)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" },
};
