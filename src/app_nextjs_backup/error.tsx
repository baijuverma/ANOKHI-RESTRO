"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="z-10 max-w-md w-full items-center justify-center text-center space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-destructive" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Something went wrong
                </h2>

                <p className="text-muted-foreground">
                    An unexpected error occurred. Please try again or contact support if
                    the problem persists.
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

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => (window.location.href = "/")}
                    >
                        Go to Home
                    </Button>
                </div>
            </div>
        </main>
    );
}
