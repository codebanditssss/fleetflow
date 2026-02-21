import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DriverStatusBadge from "@/components/drivers/driver-status-badge";
import StatusBadge from "@/components/vehicles/status-badge";

export default async function SafetyPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch safety critical data
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [
        { data: expiredLicenses },
        { data: imminentExpirations },
        { data: maintenanceOverdue },
        { data: lowSafetyDrivers },
    ] = await Promise.all([
        // 1. Expired licenses
        supabase.from("drivers").select("*").lt("license_expiry", today),
        // 2. Imminent expirations (within 30 days)
        supabase.from("drivers").select("*").gte("license_expiry", today).lte("license_expiry", thirtyDaysLater),
        // 3. Maintenance overdue
        supabase.from("vehicles").select("*").lte("next_maintenance_date", today),
        // 4. Low safety score drivers (< 70)
        supabase.from("drivers").select("*").lt("safety_score", 70),
    ]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
                <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Safety & Compliance Center
                </h1>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                    Monitor high-risk assets, compliance violations, and preventative maintenance needs.
                </p>
            </div>

            <div style={s.grid}>
                {/* Compliance Alerts */}
                <div style={s.card}>
                    <h2 style={s.cardTitle}>License & Compliance Alerts</h2>

                    <div style={s.list}>
                        {expiredLicenses?.map(d => (
                            <div key={d.id} style={{ ...s.item, borderColor: "var(--destructive)" }}>
                                <div style={s.itemInfo}>
                                    <div style={s.itemMain}>{d.full_name}</div>
                                    <div style={{ ...s.itemSub, color: "var(--destructive)" }}>LICENSE EXPIRED: {d.license_expiry}</div>
                                </div>
                                <DriverStatusBadge status={d.status} />
                            </div>
                        ))}
                        {imminentExpirations?.map(d => (
                            <div key={d.id} style={{ ...s.item, borderColor: "oklch(0.75 0.18 60)" }}>
                                <div style={s.itemInfo}>
                                    <div style={s.itemMain}>{d.full_name}</div>
                                    <div style={{ ...s.itemSub, color: "oklch(0.75 0.18 60)" }}>Expiring in under 30 days: {d.license_expiry}</div>
                                </div>
                                <DriverStatusBadge status={d.status} />
                            </div>
                        ))}
                        {(!expiredLicenses?.length && !imminentExpirations?.length) && (
                            <div style={s.empty}>All driver licenses are currently compliant.</div>
                        )}
                    </div>
                </div>

                {/* Maintenance Alerts */}
                <div style={s.card}>
                    <h2 style={s.cardTitle}>Vehicle Maintenance Overdue</h2>
                    <div style={s.list}>
                        {maintenanceOverdue?.map(v => (
                            <div key={v.id} style={{ ...s.item, borderColor: "oklch(0.75 0.18 60)" }}>
                                <div style={s.itemInfo}>
                                    <div style={s.itemMain}>{v.registration_no} ({v.model ?? "Generic"})</div>
                                    <div style={s.itemSub}>Odometer: {v.km_driven.toLocaleString()} km</div>
                                    <div style={{ ...s.itemSub, color: "var(--destructive)" }}>Overdue since: {v.next_maintenance_date}</div>
                                </div>
                                <StatusBadge status={v.status} />
                            </div>
                        ))}
                        {!maintenanceOverdue?.length && (
                            <div style={s.empty}>No vehicles are currently overdue for maintenance.</div>
                        )}
                    </div>
                </div>

                {/* Behavioral Safety */}
                <div style={s.card}>
                    <h2 style={s.cardTitle}>Driver Safety Watchlist</h2>
                    <div style={s.list}>
                        {lowSafetyDrivers?.map(d => (
                            <div key={d.id} style={{ ...s.item, borderColor: "var(--destructive)" }}>
                                <div style={s.itemInfo}>
                                    <div style={s.itemMain}>{d.full_name}</div>
                                    <div style={s.itemSub}>Trips Completed: {d.trips_completed}</div>
                                    <div style={{ ...s.itemSub, color: "var(--destructive)", fontWeight: 600 }}>SAFETY SCORE: {d.safety_score}</div>
                                </div>
                                <div style={s.scoreBarWrap}>
                                    <div style={{ ...s.scoreBar, width: `${d.safety_score}%`, backgroundColor: "var(--destructive)" }} />
                                </div>
                            </div>
                        ))}
                        {!lowSafetyDrivers?.length && (
                            <div style={s.empty}>All drivers have maintainted acceptable safety scores.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "20px",
    },
    card: {
        backgroundColor: "var(--card)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    cardTitle: {
        fontSize: "14px",
        fontWeight: 600,
        color: "var(--foreground)",
        letterSpacing: "0.2px",
    },
    list: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    item: {
        padding: "12px",
        backgroundColor: "var(--secondary)",
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
        borderRadius: "var(--radius)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
    },
    itemInfo: {
        flex: 1,
    },
    itemMain: {
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--foreground)",
    },
    itemSub: {
        fontSize: "11px",
        color: "var(--muted-foreground)",
        marginTop: "2px",
    },
    empty: {
        padding: "20px",
        textAlign: "center",
        fontSize: "12px",
        color: "var(--muted-foreground)",
        fontStyle: "italic",
        backgroundColor: "var(--secondary)",
        borderRadius: "var(--radius)",
    },
    scoreBarWrap: {
        width: "60px",
        height: "6px",
        backgroundColor: "var(--muted)",
        borderRadius: "3px",
        overflow: "hidden",
    },
    scoreBar: {
        height: "100%",
    },
};
