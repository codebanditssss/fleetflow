import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TripTable from "@/components/trips/trip-table";

// Roles allowed to dispatch and manage trips
const WRITE_ROLES = ["fleet_manager", "dispatcher"];

export default async function TripsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: profile }, { data: trips }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase
            .from("trips")
            .select(`
        *,
        vehicle:vehicles(id, registration_no, km_driven),
        driver:drivers(id, full_name)
      `)
            .order("created_at", { ascending: false }),
    ]);

    const canWrite = WRITE_ROLES.includes(profile?.role ?? "");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
                <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Trip Dispatcher
                </h1>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                    Schedule deliveries, assign drivers, and manage the trip lifecycle.
                </p>
            </div>
            <TripTable trips={(trips as any) ?? []} canWrite={canWrite} />
        </div>
    );
}
