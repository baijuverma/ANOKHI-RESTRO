"use client";

import { usePathname } from "next/navigation";
import { QuickActions } from "@/components/QuickActions";
import { ModeToggle } from "@/components/mode-toggle";
import { ExpenseHeaderStats } from "@/components/ExpenseHeaderStats";

interface DashboardHeaderActionsProps {
    userEmail: string;
}

export function DashboardHeaderActions({ userEmail }: DashboardHeaderActionsProps) {
    const pathname = usePathname();
    const isExpensesPage = pathname === "/dashboard/expenses";

    return (
        <div className={`hidden sm:flex items-center gap-2 ml-2 ${isExpensesPage ? "flex-1" : ""}`}>
            <QuickActions />

            {isExpensesPage && <ExpenseHeaderStats />}

            {!isExpensesPage && (
                <>
                    <ModeToggle />
                    <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">
                        {userEmail}
                    </span>
                </>
            )}
        </div>
    );
}
