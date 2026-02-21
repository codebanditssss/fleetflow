import { createClient } from "@/lib/supabase/server";
import KpiCard from "@/components/dashboard/kpi-card";
import RecentTrips from "@/components/dashboard/recent-trips";

export default async function DashboardPage() {
    const supabase = await createClient();

    const [
        { count: totalVehicles },
        { count: onTrip },
        { count: inShop },
        { count: pendingCargo },
        { data: recentTrips },
    ] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        // Active Fleet = vehicles currently "On Trip" (status active)
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
        // Maintenance Alerts = vehicles "In Shop"
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "maintenance"),
        // Pending Cargo = trips waiting for assignment (status pending)
        supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase
            .from("trips")
            .select("id, origin, destination, status, cargo_type, created_at")
            .order("created_at", { ascending: false })
            .limit(8),
    ]);

    // Utilization Rate = On Trip / Total * 100
    const total = totalVehicles ?? 0;
    const active = onTrip ?? 0;
    const utilization = total > 0 ? Math.round((active / total) * 100) : 0;

    return (
        <div style={s.page}>

            {/* KPI cards — matching project spec */}
            <div style={s.kpiRow}>
                <KpiCard
                    label="Active Fleet"
                    value={active}
                    sub="Vehicles currently on trip"
                    accent
                />
                <KpiCard
                    label="Maintenance Alerts"
                    value={inShop ?? 0}
                    sub="Vehicles in shop"
                />
                <KpiCard
                    label="Utilization Rate"
                    value={`${utilization}%`}
                    sub={`${active} of ${total} vehicles assigned`}
                />
                <KpiCard
                    label="Pending Cargo"
                    value={pendingCargo ?? 0}
                    sub="Shipments awaiting assignment"
                />
            </div>

            {/* Recent trips table */}
            <section style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={s.sectionTitle}>Recent Trips</span>
                    <span style={s.sectionSub}>Last 8 across all vehicles</span>
                </div>
                <RecentTrips trips={recentTrips ?? []} />
            </section>

        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: { display: "flex", flexDirection: "column", gap: "28px" },
    kpiRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
    section: { display: "flex", flexDirection: "column", gap: "12px" },
    sectionHeader: { display: "flex", alignItems: "baseline", gap: "12px" },
    sectionTitle: { fontSize: "14px", fontWeight: 600, color: "var(--foreground)" },
    sectionSub: { fontSize: "12px", color: "var(--muted-foreground)" },
};
