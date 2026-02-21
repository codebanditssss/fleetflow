import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VehicleTable from "@/components/vehicles/vehicle-table";

// Roles allowed to add/edit/delete
const WRITE_ROLES = ["fleet_manager", "dispatcher"];

export default async function VehiclesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [{ data: profile }, { data: vehicles }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).single(),
        supabase.from("vehicles").select("*").order("created_at", { ascending: false }),
    ]);

    const canWrite = WRITE_ROLES.includes(profile?.role ?? "");

    return (
        <VehicleTable vehicles={vehicles ?? []} canWrite={canWrite} />
    );
}
