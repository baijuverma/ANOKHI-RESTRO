
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardTitle } from "@/components/DashboardTitle";
import { QuickActions } from "@/components/QuickActions";
import { MobileSidebar } from "@/components/MobileSidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { PosHeaderStats } from "@/components/PosHeaderStats";
import { ExpensePageHeader } from "@/components/ExpensePageHeader";
import { DashboardHeaderActions } from "@/components/DashboardHeaderActions";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const isConfigured = isServerSupabaseConfigured();
    let userEmail = "demo@restaurant.com";
    let restaurantName = "My Restaurant";

    if (isConfigured) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            redirect("/login");
        }
        userEmail = user.email || "user@restaurant.com";

        // Fetch Restaurant Name
        const { data: userProfile } = await supabase
            .from("users")
            .select("restaurant_id")
            .eq("id", user.id)
            .maybeSingle();

        if (userProfile?.restaurant_id) {
            const { data: restaurant } = await supabase
                .from("restaurants")
                .select("name")
                .eq("id", userProfile.restaurant_id)
                .single();

            if (restaurant?.name) {
                restaurantName = restaurant.name;
            }
        }
    }

    return (
        <div className="flex h-screen bg-muted/40 overflow-hidden">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden lg:block w-[251px] fixed h-full z-30">
                <DashboardSidebar shopName={restaurantName} />
            </div>

            <div className="flex-1 lg:ml-[251px] flex flex-col min-w-0 h-full">
                {/* Header */}
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4 sm:px-6 lg:h-[60px] shadow-sm">
                    {/* Mobile hamburger menu */}
                    <MobileSidebar shopName={restaurantName} />

                    <DashboardTitle />

                    <DashboardHeaderActions userEmail={userEmail} />

                    {!isConfigured && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-amber-100 text-amber-800 rounded-full whitespace-nowrap">
                            Demo Mode
                        </span>
                    )}

                    <ExpensePageHeader />
                    <PosHeaderStats />
                </header>

                {/* Main Content */}
                <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
                    {children}
                </main>


            </div>
        </div>
    );
}
