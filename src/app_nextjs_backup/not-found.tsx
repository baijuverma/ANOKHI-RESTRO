import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat, Home, Search } from "lucide-react";

export default function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="z-10 max-w-md w-full items-center justify-center text-center space-y-6 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <Search className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-7xl font-extrabold text-primary/20">404</p>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Page Not Found
                    </h2>
                </div>

                <p className="text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>

                <div className="flex flex-col gap-3 w-full pt-2">
                    <Link href="/" passHref className="w-full">
                        <Button
                            size="lg"
                            className="w-full gap-2 shadow-lg hover:shadow-xl transition-all"
                        >
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </Link>

                    <Link href="/dashboard" passHref className="w-full">
                        <Button variant="outline" size="lg" className="w-full gap-2">
                            <ChefHat className="w-4 h-4" />
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
