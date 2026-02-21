import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Shell from "@/components/dashboard/shell";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, status")
        .eq("id", user.id)
        .single();

    if (!profile) redirect("/onboarding");
    if (profile.status !== "approved") redirect("/pending");

    const avatarUrl: string | null = user.user_metadata?.avatar_url ?? null;

    return (
        <Shell fullName={profile.full_name} role={profile.role} avatarUrl={avatarUrl}>
            {children}
        </Shell>
    );
}
