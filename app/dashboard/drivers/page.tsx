import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DriverTable from "@/components/drivers/driver-table";

// Roles allowed to add/edit/delete drivers
const WRITE_ROLES = ["fleet_manager", "safety_officer"];

export default async function DriversPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: profile }, { data: drivers }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase.from("drivers").select("*").order("full_name", { ascending: true }),
    ]);

    const canWrite = WRITE_ROLES.includes(profile?.role ?? "");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
                <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Drivers Registry
                </h1>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                    Manage driver profiles, verify licenses, and monitor safety scores.
                </p>
            </div>
            <DriverTable drivers={drivers ?? []} canWrite={canWrite} />
        </div>
    );
}
