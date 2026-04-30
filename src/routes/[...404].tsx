import { A } from "@solidjs/router";
import { ChefHat, Home } from "lucide-solid";

export default function NotFound() {
    return (
        <main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div class="text-center space-y-8 max-w-md">
                <div class="flex justify-center">
                    <div class="h-24 w-24 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-900/20">
                        <ChefHat class="h-12 w-12 text-white" />
                    </div>
                </div>
                <div class="space-y-3">
                    <h1 class="text-8xl font-black text-slate-800 tracking-tighter">404</h1>
                    <p class="text-xl font-black text-slate-600">Page Not Found</p>
                    <p class="text-slate-400 font-medium">This page doesn't exist in the restaurant.</p>
                </div>
                <A
                    href="/dashboard"
                    class="inline-flex items-center gap-2 h-12 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95"
                >
                    <Home class="h-4 w-4" /> Back to Dashboard
                </A>
            </div>
        </main>
    );
}
