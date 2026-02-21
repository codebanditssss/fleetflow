import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MaintenanceTable from "@/components/maintenance/maintenance-table";

export default async function MaintenancePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: profile }, { data: logs }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase
            .from("maintenance_logs")
            .select(`
            *,
            vehicle:vehicles(id, registration_no)
        `)
            .order("date", { ascending: false })
    ]);

    const canWrite = ["fleet_manager", "safety_officer"].includes(profile?.role ?? "");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
                <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                    Maintenance & Yard Management
                </h1>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                    Review preventative service history and manage assets currently in the shop.
                </p>
            </div>

            <MaintenanceTable logs={(logs as any) ?? []} canWrite={canWrite} />
        </div>
    );
}
