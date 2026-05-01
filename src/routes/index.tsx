import { A } from "@solidjs/router";
import { ChefHat, ArrowRight } from "lucide-solid";

export default function HomePage() {
    return (
        <main class="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div class="z-10 max-w-md w-full text-center space-y-8 p-10 bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 animate-in fade-in zoom-in duration-700">

                <div class="flex justify-center mb-6">
                    <div class="p-5 bg-primary/10 rounded-3xl shadow-inner">
                        <ChefHat class="w-14 h-14 text-primary" />
                    </div>
                </div>

                <div class="space-y-3">
                    <h1 class="text-4xl font-black tracking-tighter text-slate-900">
                        Restaurant<br />Billing Tool
                    </h1>
                    <p class="text-slate-500 text-base font-medium">
                        Fast, simple, and professional restaurant management.
                    </p>
                </div>

                <div class="flex flex-col gap-4 w-full pt-4">
                    <A
                        href="/login"
                        class="w-full h-14 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 text-base shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-96"
                    >
                        Get Started <ArrowRight class="w-5 h-5" />
                    </A>
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-300">
                        Secure • Fast • Reliable
                    </p>
                </div>
            </div>
        </main>
    );
}
