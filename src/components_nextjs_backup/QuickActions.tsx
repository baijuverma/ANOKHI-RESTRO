
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";

export function QuickActions() {
    const router = useRouter();
    const pathname = usePathname();
    const isExpensesPage = pathname === "/dashboard/expenses";

    return (
        <div className="flex items-center gap-2">
            {!isExpensesPage && (
                <Button
                    size="sm"
                    className="rounded-full shadow-sm gap-2 bg-primary hover:bg-primary/90 transition-transform duration-200"
                    onClick={() => router.push("/dashboard/items")}
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Item</span>
                </Button>
            )}
            <Button
                size="sm"
                variant="destructive"
                className="rounded-full shadow-sm gap-2 transition-transform duration-200"
                onClick={() => router.push("/dashboard/expenses")}
            >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Expense</span>
            </Button>
        </div>
    );
}
