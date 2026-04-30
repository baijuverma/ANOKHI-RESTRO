"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useExpenseDateFilter } from "@/lib/store/expense-date-store";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ExpensePageHeader() {
    const pathname = usePathname();
    const isExpensesPage = pathname === "/dashboard/expenses";

    // Create refs for the date inputs
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);

    // Always call hook, but only use values conditionally in render to avoid hook rules violations if we were conditionally rendering the hook call (which we aren't here)
    const { startDate, endDate, setStartDate, setEndDate } = useExpenseDateFilter();

    if (!isExpensesPage) return null;

    return (
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg ml-auto mr-4">
            <div className="relative group">
                <Input
                    ref={startDateRef}
                    type="date"
                    value={startDate}
                    max="9999-12-31"
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36 pl-8 pr-7 h-8 border-none bg-transparent focus-visible:ring-0 text-xs sm:text-sm shadow-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: 'light' }}
                />
                {startDate && (
                    <X
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-red-500 transition-colors z-20"
                        onClick={(e) => {
                            e.preventDefault();
                            setStartDate('');
                        }}
                    />
                )}
            </div>
            <span className="text-slate-400">-</span>
            <div className="relative group">
                <Input
                    ref={endDateRef}
                    type="date"
                    value={endDate}
                    max="9999-12-31"
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36 pl-8 pr-7 h-8 border-none bg-transparent focus-visible:ring-0 text-xs sm:text-sm shadow-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: 'light' }}
                />
                {endDate && (
                    <X
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-red-500 transition-colors z-20"
                        onClick={(e) => {
                            e.preventDefault();
                            setEndDate('');
                        }}
                    />
                )}
            </div>
        </div>
    );
}
