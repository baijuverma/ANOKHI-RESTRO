"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <AlertTriangle className="w-10 h-10 text-destructive" />
                    </div>
                </div>

                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Dashboard Error
                </h2>

                <p className="text-muted-foreground text-sm">
                    Something went wrong while loading the dashboard. Please try again.
                </p>

                {error.digest && (
                    <p className="text-xs text-muted-foreground font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col gap-3 w-full pt-2">
                    <Button
                        onClick={reset}
                        size="lg"
                        className="w-full gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                    </Button>

                    <Link href="/" passHref className="w-full">
                        <Button variant="outline" size="lg" className="w-full gap-2">
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
