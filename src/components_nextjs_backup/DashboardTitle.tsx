
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/pos": "New Bill (POS)",
    "/dashboard/items": "Menu Items",
    "/dashboard/orders": "Orders History",
    "/dashboard/reports": "Reports & Analytics",
    "/dashboard/settings": "Settings",
    "/dashboard/profile": "Profile"
};

export function DashboardTitle() {
    const pathname = usePathname();

    if (pathname === "/dashboard/expenses") return null;

    // Find exact match or default to "Dashboard"
    // We can also do partial matching if needed, but exact is safer for now.
    const title = PAGE_TITLES[pathname] || "Dashboard";

    return (
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <h1 className="text-base sm:text-lg font-semibold truncate text-gray-900 dark:text-white">
                {title}
            </h1>
        </Link>
    );
}
