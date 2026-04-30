
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ShoppingCart,
    UtensilsCrossed,
    History,
    BarChart3,
    Settings as SettingsIcon,
    LogOut,
    Store,
    Wallet
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Billing (POS)",
        href: "/dashboard/pos",
        icon: ShoppingCart,
    },
    {
        title: "Items / Menu",
        href: "/dashboard/items",
        icon: UtensilsCrossed,
    },
    {
        title: "Orders History",
        href: "/dashboard/orders",
        icon: History,
    },
    {
        title: "Expenses",
        href: "/dashboard/expenses",
        icon: Wallet,
    },
    {
        title: "Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
    },
    {
        title: "Settings",
        href: "/dashboard/settings",
        icon: SettingsIcon,
    },
];

export function DashboardSidebar({ shopName }: { shopName?: string }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <nav className="flex flex-col h-full border-r bg-card text-card-foreground">
            <div className="p-6 border-b flex items-center gap-3">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center shrink-0 shadow-sm">
                    <Store className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-lg font-bold tracking-tight truncate flex-1" title={shopName || "Billing Tool"}>
                    {shopName || "Billing Tool"}
                </h1>
            </div>
            <div className="flex-1 py-4">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="p-4 border-t">
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </nav>
    );
}
