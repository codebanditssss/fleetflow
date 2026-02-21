import { createClient } from "@/lib/supabase/server";
import KpiCard from "@/components/dashboard/kpi-card";
import RecentTrips from "@/components/dashboard/recent-trips";

export default async function DashboardPage() {
    const supabase = await createClient();

    // Parallel data fetches
    const [
        { count: totalVehicles },
        { count: activeTrips },
        { count: maintenanceDue },
        { count: totalDrivers },
        { data: recentTrips },
    ] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "maintenance"),
        supabase.from("drivers").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase
            .from("trips")
            .select("id, origin, destination, status, cargo_type, created_at")
            .order("created_at", { ascending: false })
            .limit(8),
    ]);

    return (
        <div style={s.page}>

            {/* KPI cards */}
            <div style={s.kpiRow}>
                <KpiCard
                    label="Active Trips"
                    value={activeTrips ?? 0}
                    sub="Currently on the road"
                    accent
                />
                <KpiCard
                    label="Total Vehicles"
                    value={totalVehicles ?? 0}
                    sub="In fleet registry"
                />
                <KpiCard
                    label="Maintenance Due"
                    value={maintenanceDue ?? 0}
                    sub="Vehicles in service"
                />
                <KpiCard
                    label="Active Drivers"
                    value={totalDrivers ?? 0}
                    sub="On active duty"
                />
            </div>

            {/* Recent trips table */}
            <section style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={s.sectionTitle}>Recent Trips</span>
                    <span style={s.sectionSub}>Last 8 trips across all vehicles</span>
                </div>
                <RecentTrips trips={recentTrips ?? []} />
            </section>

        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: {
        display: "flex",
        flexDirection: "column",
        gap: "28px",
    },
    kpiRow: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    sectionHeader: {
        display: "flex",
        alignItems: "baseline",
        gap: "12px",
    },
    sectionTitle: {
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--foreground)",
    },
    sectionSub: {
        fontSize: "12px",
        color: "var(--muted-foreground)",
    },
};
