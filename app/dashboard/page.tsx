import { createClient } from "@/lib/supabase/server";
import KpiCard from "@/components/dashboard/kpi-card";
import RecentTrips from "@/components/dashboard/recent-trips";
import Link from "next/link";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
    const { type } = await searchParams;
    const supabase = await createClient();

    // Queries
    let vehicleQuery = supabase.from("vehicles").select("*", { count: "exact", head: false });
    let onTripQuery = supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active");
    let inShopQuery = supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "maintenance");
    let pendingCargoQuery = supabase.from("trips").select("*", { count: "exact", head: true }).eq("status", "pending");
    let recentTripsQuery = supabase
        .from("trips")
        .select("id, origin, destination, status, cargo_type, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

    // Apply Filter if present
    if (type && type !== "all") {
        vehicleQuery = vehicleQuery.eq("type", type);
        onTripQuery = onTripQuery.eq("type", type);
        inShopQuery = inShopQuery.eq("type", type);
        // Note: Trips don't have vehicle type directly, would need an inner join for strict filtering, 
        // but we'll focus on Vehicle KPIs for this filter.
    }

    const [
        { data: vehicles, count: totalVehicles },
        { count: onTrip },
        { count: inShop },
        { count: pendingCargo },
        { data: recentTrips },
    ] = await Promise.all([
        vehicleQuery,
        onTripQuery,
        inShopQuery,
        pendingCargoQuery,
        recentTripsQuery,
    ]);

    const total = totalVehicles ?? 0;
    const active = onTrip ?? 0;
    const utilization = total > 0 ? Math.round((active / total) * 100) : 0;

    const VEHICLE_TYPES = ["all", "truck", "van", "heavy", "tanker", "pickup"];

    return (
        <div style={s.page}>

            {/* Header with Filters */}
            <div style={s.headerRow}>
                <div>
                    <h1 style={s.pageTitle}>Command Center</h1>
                    <p style={s.pageSub}>Real-time fleet performance monitoring</p>
                </div>

                <div style={s.filterGroup}>
                    <span style={s.filterLabel}>Asset Type:</span>
                    <div style={s.tabs}>
                        {VEHICLE_TYPES.map(vt => (
                            <Link
                                key={vt}
                                href={`/dashboard?type=${vt}`}
                                style={{
                                    ...s.tab,
                                    ...((type || "all") === vt ? s.tabActive : {})
                                }}
                            >
                                {vt.charAt(0).toUpperCase() + vt.slice(1)}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI cards */}
            <div style={s.kpiRow}>
                <KpiCard
                    label="Active Fleet"
                    value={active}
                    sub={`Vehicles currently On Trip ${type && type !== 'all' ? `(${type})` : ''}`}
                    accent
                />
                <KpiCard
                    label="Maintenance Alerts"
                    value={inShop ?? 0}
                    sub="Vehicles marked In Shop"
                />
                <KpiCard
                    label="Utilization Rate"
                    value={`${utilization}%`}
                    sub={`${active} of ${total} assets assigned`}
                />
                <KpiCard
                    label="Pending Cargo"
                    value={pendingCargo ?? 0}
                    sub="Unassigned cargo shipments"
                />
            </div>

            {/* Recent trips */}
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
    page: { display: "flex", flexDirection: "column", gap: "24px" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" },
    pageTitle: { fontSize: "20px", fontWeight: 700, color: "var(--foreground)", marginBottom: "4px" },
    pageSub: { fontSize: "13px", color: "var(--muted-foreground)" },
    filterGroup: { display: "flex", alignItems: "center", gap: "12px" },
    filterLabel: { fontSize: "12px", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase" },
    tabs: { display: "flex", backgroundColor: "var(--secondary)", padding: "3px", borderRadius: "var(--radius)", gap: "2px" },
    tab: { padding: "6px 12px", fontSize: "12px", borderRadius: "calc(var(--radius) - 2px)", textDecoration: "none", color: "var(--muted-foreground)", transition: "all 0.2s" },
    tabActive: { backgroundColor: "var(--card)", color: "var(--foreground)", boxShadow: "var(--shadow-sm)" },
    kpiRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
    section: { display: "flex", flexDirection: "column", gap: "12px" },
    sectionHeader: { display: "flex", alignItems: "baseline", gap: "12px" },
    sectionTitle: { fontSize: "14px", fontWeight: 600, color: "var(--foreground)" },
    sectionSub: { fontSize: "12px", color: "var(--muted-foreground)" },
};
