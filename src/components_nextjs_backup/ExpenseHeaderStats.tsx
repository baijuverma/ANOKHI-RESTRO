"use client";

import { useExpenseStats } from "@/lib/store/expense-stats-store";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export function ExpenseHeaderStats() {
    const { totalRevenue, totalExpenses } = useExpenseStats();
    const netProfit = totalRevenue - totalExpenses;
    const isProfit = netProfit >= 0;

    return (
        <div className="flex-1 grid grid-cols-3 gap-3 px-4">
            {/* Revenue */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg w-full">
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-emerald-600 font-medium uppercase">Revenue</span>
                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                </div>
            </div>

            {/* Expenses */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg w-full">
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-red-600 font-medium uppercase">Expense</span>
                    <span className="text-sm font-bold text-red-700">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <TrendingDown className="h-3 w-3" />
                </div>
            </div>

            {/* Profit/Loss */}
            <div className={`flex items-center justify-between px-3 py-1.5 border rounded-lg w-full ${isProfit ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex flex-col leading-none">
                    <span className={`text-[10px] font-medium uppercase ${isProfit ? 'text-blue-600' : 'text-orange-600'}`}>Net P/L</span>
                    <span className={`text-sm font-bold ${isProfit ? 'text-blue-700' : 'text-orange-700'}`}>
                        {formatCurrency(netProfit)}
                    </span>
                </div>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isProfit ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                    <DollarSign className="h-3 w-3" />
                </div>
            </div>
        </div>
    );
}
