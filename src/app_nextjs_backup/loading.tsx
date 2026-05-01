import { ChefHat } from "lucide-react";

export default function Loading() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="z-10 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                        <ChefHat className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        Loading...
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Please wait while we prepare everything
                    </p>
                </div>
            </div>
        </main>
    );
}
