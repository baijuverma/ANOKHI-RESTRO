
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="z-10 max-w-md w-full items-center justify-center text-center space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-500">

                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <ChefHat className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-gray-900 dark:text-white">
                    Billing Tool
                </h1>

                <p className="text-muted-foreground text-lg">
                    Fast, simple, and professional restaurant management system.
                </p>

                <div className="flex flex-col gap-4 w-full">
                    <Link href="/login" passHref className="w-full">
                        <Button size="lg" className="w-full text-lg h-12 gap-2 shadow-lg hover:shadow-xl transition-all">
                            Go to Login <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>

                    <div className="pt-4 border-t text-sm text-gray-400">
                        Secure • Fast • Reliable
                    </div>
                </div>
            </div>
        </main>
    );
}
