import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "solid-sonner";
import { ChefHat, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-solid";

export default function LoginPage() {
    const [email, setEmail] = createSignal("");
    const [password, setPassword] = createSignal("");
    const [loading, setLoading] = createSignal(false);
    const [showPassword, setShowPassword] = createSignal(false);
    const [isLogin, setIsLogin] = createSignal(true);
    const navigate = useNavigate();

    const handleAuth = async (e: Event) => {
        e.preventDefault();
        if (!email() || !password()) return toast.error("Please fill all fields");

        setLoading(true);
        try {
            if (!isSupabaseConfigured()) {
                // Demo mode
                toast.success("Demo mode - welcome!");
                navigate("/dashboard");
                return;
            }

            const supabase = createClient();

            if (isLogin()) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email(),
                    password: password()
                });
                if (error) throw error;
                toast.success("Login successful!");
            } else {
                const { error } = await supabase.auth.signUp({
                    email: email(),
                    password: password()
                });
                if (error) throw error;
                toast.success("Signup successful!");
            }

            navigate("/dashboard");
        } catch (err: any) {
            toast.error(err.message || (isLogin() ? "Login failed" : "Signup failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            if (!isSupabaseConfigured()) {
                toast.success("Demo mode - Google Auth triggered!");
                navigate("/dashboard");
                return;
            }

            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`
                }
            });

            if (error) throw error;
        } catch (err: any) {
            toast.error(err.message || "Google authentication failed");
        }
    };

    return (
        <main class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
            <div class="w-full max-w-md">
                <div class="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 p-10 space-y-8 animate-in fade-in zoom-in duration-500">

                    {/* Logo */}
                    <div class="text-center space-y-4">
                        <div class="flex justify-center">
                            <div class="h-16 w-16 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20">
                                <ChefHat class="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 class="text-3xl font-black text-slate-900 tracking-tight">{isLogin() ? "Welcome Back" : "Create Account"}</h1>
                            <p class="text-slate-400 text-sm font-medium mt-1">{isLogin() ? "Sign in to your restaurant account" : "Sign up for a new restaurant account"}</p>
                        </div>
                    </div>

                    {/* Social Auth */}
                    <button
                        type="button"
                        onClick={handleGoogleAuth}
                        class="w-full h-12 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <svg class="h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div class="relative flex items-center py-2">
                        <div class="flex-grow border-t border-slate-200"></div>
                        <span class="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or continue with</span>
                        <div class="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Form */}
                    <form class="space-y-5" onSubmit={handleAuth}>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address</label>
                            <div class="relative">
                                <Mail class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input
                                    type="email"
                                    required
                                    class="w-full h-13 bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-4 py-3.5 font-bold text-slate-700 outline-none focus:border-primary focus:bg-white transition-all"
                                    placeholder="chef@restaurant.com"
                                    value={email()}
                                    onInput={e => setEmail(e.currentTarget.value)}
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Password</label>
                            <div class="relative">
                                <Lock class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input
                                    type={showPassword() ? "text" : "password"}
                                    required
                                    class="w-full h-13 bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-12 py-3.5 font-bold text-slate-700 outline-none focus:border-primary focus:bg-white transition-all"
                                    placeholder="••••••••"
                                    value={password()}
                                    onInput={e => setPassword(e.currentTarget.value)}
                                />
                                <button
                                    type="button"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                    onClick={() => setShowPassword(v => !v)}
                                >
                                    <Show when={showPassword()} fallback={<Eye class="h-4 w-4" />}>
                                        <EyeOff class="h-4 w-4" />
                                    </Show>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading()}
                            class="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            <Show when={loading()} fallback={isLogin() ? "Sign In to Dashboard" : "Sign Up for Dashboard"}>
                                <Loader2 class="h-5 w-5 animate-spin" /> {isLogin() ? "Signing In..." : "Signing Up..."}
                            </Show>
                        </button>
                    </form>

                    <div class="text-center mt-6">
                        <p class="text-sm font-medium text-slate-500">
                            {isLogin() ? "Don't have an account?" : "Already have an account?"}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin())}
                                class="ml-2 font-black text-primary hover:text-indigo-600 transition-colors"
                            >
                                {isLogin() ? "Sign Up" : "Sign In"}
                            </button>
                        </p>
                    </div>

                    <Show when={!isSupabaseConfigured()}>
                        <div class="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                            <p class="text-xs font-bold text-amber-700">Demo Mode — No Supabase connected</p>
                            <p class="text-[10px] text-amber-500 mt-1">Enter any email/password to continue</p>
                        </div>
                    </Show>
                </div>
            </div>
        </main>
    );
}
