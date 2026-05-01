
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface WeeklySalesProps {
    data: { name: string; total: number }[];
}

export function WeeklySalesChart({ data }: WeeklySalesProps) {
    // If no data, show mockup for visualization during demo
    const chartData = data.length > 0 ? data : [
        { name: "Mon", total: 0 },
        { name: "Tue", total: 0 },
        { name: "Wed", total: 0 },
        { name: "Thu", total: 0 },
        { name: "Fri", total: 0 },
        { name: "Sat", total: 0 },
        { name: "Sun", total: 0 },
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
            </BarChart>
        </ResponsiveContainer>
    );
}
