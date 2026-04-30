import { useEffect, useState } from "react";

interface CircularCountdownProps {
    createdAt: string;
    maxHours?: number;
}

export function CircularCountdown({ createdAt, maxHours = 72 }: CircularCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [percentage, setPercentage] = useState<number>(100);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const created = new Date(createdAt).getTime();
            const now = new Date().getTime();
            const maxTime = maxHours * 60 * 60 * 1000; // Convert hours to milliseconds
            const elapsed = now - created;
            const remaining = maxTime - elapsed;

            if (remaining <= 0) {
                setTimeLeft(0);
                setPercentage(0);
                return;
            }

            setTimeLeft(remaining);
            setPercentage((remaining / maxTime) * 100);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000); // Update every second

        return () => clearInterval(interval);
    }, [createdAt, maxHours]);

    const getHoursLeft = (ms: number) => {
        return Math.ceil(ms / (1000 * 60 * 60)); // Round up to nearest hour
    };

    const formatDetailedTime = (ms: number) => {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const isExpired = timeLeft <= 0;
    const isWarning = percentage <= 25 && !isExpired;
    const hoursLeft = getHoursLeft(timeLeft);

    // Calculate stroke dasharray for circular progress
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center group">
            {/* SVG Circular Progress */}
            <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 44 44">
                {/* Background circle */}
                <circle
                    cx="22"
                    cy="22"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-slate-200"
                />
                {/* Progress circle */}
                <circle
                    cx="22"
                    cy="22"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-300 ${isExpired
                            ? "text-slate-400"
                            : isWarning
                                ? "text-orange-500"
                                : "text-emerald-500"
                        }`}
                    strokeLinecap="round"
                />
            </svg>

            {/* Hours text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                    className={`text-sm font-bold leading-none ${isExpired
                            ? "text-slate-400"
                            : isWarning
                                ? "text-orange-600"
                                : "text-emerald-600"
                        }`}
                >
                    {isExpired ? "0" : hoursLeft}
                </span>
                <span
                    className={`text-[8px] font-semibold uppercase leading-none mt-0.5 ${isExpired
                            ? "text-slate-400"
                            : isWarning
                                ? "text-orange-600"
                                : "text-emerald-600"
                        }`}
                >
                    {hoursLeft === 1 ? "HOUR" : "HOURS"}
                </span>
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 whitespace-nowrap">
                <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg ${isExpired
                            ? "bg-slate-700 text-white"
                            : isWarning
                                ? "bg-orange-500 text-white"
                                : "bg-emerald-600 text-white"
                        }`}
                >
                    {isExpired ? (
                        "Editing locked"
                    ) : (
                        <>
                            <div className="font-semibold">Time remaining:</div>
                            <div className="text-center">{formatDetailedTime(timeLeft)}</div>
                        </>
                    )}
                </div>
                {/* Tooltip arrow */}
                <div
                    className={`w-2 h-2 mx-auto -mt-1 rotate-45 ${isExpired
                            ? "bg-slate-700"
                            : isWarning
                                ? "bg-orange-500"
                                : "bg-emerald-600"
                        }`}
                />
            </div>
        </div>
    );
}

export function isEditableWithin72Hours(createdAt: string): boolean {
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const maxTime = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
    const elapsed = now - created;

    return elapsed < maxTime;
}
