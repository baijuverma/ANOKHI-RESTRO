"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function DashboardDateFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const getToday = () => new Date().toISOString().split('T')[0];

    // Default to Today if not present
    const [from, setFrom] = useState(searchParams.get("from") || getToday());
    const [to, setTo] = useState(searchParams.get("to") || getToday());

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (from) params.set("from", from);
        else params.delete("from");

        if (to) params.set("to", to);
        else params.delete("to");

        router.push(`/dashboard?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-end bg-card p-4 rounded-lg border shadow-sm">
            <div className="grid gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium">From Date</label>
                <div className="relative">
                    <Input
                        type="date"
                        value={from}
                        max="9999-12-31"
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-full sm:w-[150px] pr-8"
                    />
                    {from && (
                        <X
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
                            onClick={() => setFrom('')}
                        />
                    )}
                </div>
            </div>
            <div className="grid gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium">To Date</label>
                <div className="relative">
                    <Input
                        type="date"
                        value={to}
                        max="9999-12-31"
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full sm:w-[150px] pr-8"
                    />
                    {to && (
                        <X
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
                            onClick={() => setTo('')}
                        />
                    )}
                </div>
            </div>
            <Button onClick={handleApply} className="w-full sm:w-auto">Apply</Button>
        </div>
    );
}
