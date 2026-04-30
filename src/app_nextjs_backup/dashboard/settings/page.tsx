
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";

const DEMO_RESTAURANT = {
    id: "demo",
    name: "Demo Restaurant",
    gst_number: "29AABCU9603R1ZJ",
    gst_percentage: 18,
    address: "123 Demo Street, New Delhi",
    phone: "9876543210",
    logo_url: null,
};

export default async function SettingsPage() {
    const isConfigured = isServerSupabaseConfigured();
    let restaurant: any = null;
    let userId = "demo-user";

    if (isConfigured) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        userId = user.id;
        const { data: userProfile } = await supabase
            .from("users")
            .select("restaurant_id, role")
            .eq("id", user.id)
            .maybeSingle();

        const role = userProfile?.role || 'admin'; // Fallback to admin if profile missing (e.g. first setup)

        if (role !== 'admin') {
            return <div className="p-8 text-center text-red-500 font-bold">Access Denied: Only Admins can manage restaurant settings.</div>;
        }

        if (userProfile?.restaurant_id) {
            const { data } = await supabase.from("restaurants").select("*").eq("id", userProfile.restaurant_id).single();
            restaurant = data;
        }
    } else {
        // Demo mode - show demo restaurant settings
        restaurant = DEMO_RESTAURANT;
    }

    return <SettingsForm initialData={restaurant} userId={userId} />;
}
