import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddExpenseModal from "@/components/finance/add-expense-modal";
import FinanceTable from "@/components/finance/finance-table";
import KpiCard from "@/components/dashboard/kpi-card";

export default async function FinancePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch all expenses and profile
    const [{ data: profile }, { data: expenses }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase
            .from("expenses")
            .select(`
            *,
            vehicle:vehicles(registration_no)
        `)
            .order("date", { ascending: false })
    ]);

    const role = profile?.role ?? "";
    const canRead = ["fleet_manager", "financial_analyst"].includes(role);
    if (!canRead) redirect("/dashboard");

    const canWrite = ["fleet_manager", "financial_analyst"].includes(role);

    // Aggregate stats
    const totalSpend = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) ?? 0;
    const fuelSpend = expenses?.filter(e => e.type === "fuel").reduce((acc, curr) => acc + Number(curr.amount), 0) ?? 0;
    const maintSpend = expenses?.filter(e => e.type === "maintenance").reduce((acc, curr) => acc + Number(curr.amount), 0) ?? 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
                <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Financial Performance & Audit
                </h1>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                    Track operational ROI, fuel efficiency, and maintenance costs across the fleet.
                </p>
            </div>

            <div style={s.kpiRow}>
                <KpiCard label="Total Spend" value={`₹${totalSpend.toLocaleString()}`} sub="Total lifetime expenses" accent />
                <KpiCard label="Fuel Costs" value={`₹${fuelSpend.toLocaleString()}`} sub="Cumulative fuel expenditure" />
                <KpiCard label="Maintenance" value={`₹${maintSpend.toLocaleString()}`} sub="Repair & service ROI" />
                <KpiCard label="OpEx / Vehicle" value={expenses?.length ? `₹${Math.round(totalSpend / (new Set(expenses.map(e => e.vehicle_id)).size || 1)).toLocaleString()}` : "₹0"} sub="Average spend per asset" />
            </div>

            <FinanceTable expenses={(expenses as any) ?? []} canWrite={canWrite} />
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    kpiRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
};
