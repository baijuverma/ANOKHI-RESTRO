"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export function ReportFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [from, setFrom] = useState(searchParams.get("from") || new Date().toISOString().split('T')[0]);
    const [to, setTo] = useState(searchParams.get("to") || new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState(searchParams.get("status") || "all");
    const [mode, setMode] = useState(searchParams.get("mode") || "all");

    const handleApply = () => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (status && status !== "all") params.set("status", status);
        if (mode && mode !== "all") params.set("mode", mode);

        router.push(`/dashboard/reports?${params.toString()}`);
    };

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="grid gap-2 w-full md:w-auto">
                        <label className="text-sm font-medium">From Date</label>
                        <div className="relative">
                            <Input
                                type="date"
                                value={from}
                                max="9999-12-31"
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full md:w-[180px] pr-8"
                            />
                            {from && (
                                <X
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
                                    onClick={() => setFrom('')}
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid gap-2 w-full md:w-auto">
                        <label className="text-sm font-medium">To Date</label>
                        <div className="relative">
                            <Input
                                type="date"
                                value={to}
                                max="9999-12-31"
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full md:w-[180px] pr-8"
                            />
                            {to && (
                                <X
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
                                    onClick={() => setTo('')}
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid gap-2 w-full md:w-auto">
                        <label className="text-sm font-medium">Payment Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="flex h-10 w-full md:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="grid gap-2 w-full md:w-auto">
                        <label className="text-sm font-medium">Payment Mode</label>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className="flex h-10 w-full md:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="all">All Modes</option>
                            <option value="cash">Cash Only</option>
                            <option value="upi">UPI Only</option>
                        </select>
                    </div>
                    <Button onClick={handleApply} className="w-full md:w-auto">Apply Filters</Button>
                </div>
            </CardContent>
        </Card>
    );
}
