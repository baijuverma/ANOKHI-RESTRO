"use client";

import { Chart } from "react-google-charts";

interface StatsPieChartProps {
    data: {
        totalCash: number;
        totalUpi: number;
        totalDues: number;
    }
}

export default function StatsPieChart({ data }: StatsPieChartProps) {
    // Determine data for the chart
    const hasData = data.totalCash > 0 || data.totalUpi > 0 || data.totalDues > 0;

    if (!hasData) {
        return (
            <div className="w-full h-[300px] flex justify-center items-center bg-card rounded-lg border shadow-sm p-4 text-muted-foreground text-sm">
                No sales data available for today yet.
            </div>
        );
    }

    // Format: ["Task", "Hours per Day"] (Header), ["Work", 11], ...
    const chartData = [
        ["Payment Mode", "Amount"],
        ["Cash", data.totalCash],
        ["UPI", data.totalUpi],
        ["Dues", data.totalDues],
    ];

    const options = {
        title: "Sales Distribution (Today)",
        is3D: true,
        backgroundColor: "transparent",
        titleTextStyle: {
            color: '#888',
            fontSize: 16
        },
        legend: {
            textStyle: { color: '#888' },
            position: 'bottom'
        },
        chartArea: {
            width: '90%',
            height: '80%'
        },
        colors: ['#10b981', '#0ea5e9', '#f59e0b'] // Emerald, Sky, Amber
    };

    return (
        <div className="w-full h-[300px] flex justify-center items-center bg-card rounded-lg border shadow-sm p-4">
            <Chart
                chartType="PieChart"
                data={chartData}
                options={options}
                width={"100%"}
                height={"100%"}
            />
        </div>
    );
}
