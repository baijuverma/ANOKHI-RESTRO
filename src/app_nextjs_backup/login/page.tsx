
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useMemo } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

const authSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorMsg = searchParams.get("error");




    const configured = isSupabaseConfigured();
    const supabase = useMemo(() => configured ? createClient() : null, [configured]);

    useEffect(() => {
        if (errorMsg) {
            toast.error(decodeURIComponent(errorMsg));
        }
    }, [errorMsg]);

    const onInvalid = (errors: any) => {
        console.error("Validation Errors:", errors);
        const errorMessages = Object.values(errors)
            .map((e: any) => e.message)
            .join(", ");
        toast.error(`Please fix the errors: ${errorMessages}`);
    };

    const form = useForm<z.infer<typeof authSchema>>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // ... onSubmit ...
    async function onSubmit(values: z.infer<typeof authSchema>) {
        console.log("Submitting form:", values);

        if (!supabase) {
            toast.error("System Error: Supabase client not initialized");
            return;
        }

        setIsLoading(true);
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    }
                });

                if (error) throw error;

                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    toast.warning("This email is already registered. Please Sign In instead.");
                } else {
                    toast.success("Success! Please check your email to confirm sign up.");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: values.email,
                    password: values.password,
                });
                if (error) throw error;
                toast.success("Logged in successfully!");
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error: any) {
            console.error("Auth Error:", error);
            toast.error(error.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    }

    // ... handleGoogleLogin ...
    const handleGoogleLogin = async () => {
        if (!supabase) {
            toast.error("Supabase client not initialized");
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
            setIsLoading(false);
        }
    };

    const handleDemoMode = () => {
        router.push("/dashboard");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 flex-col gap-4">


            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isSignUp ? "Create an account" : "Sign in to your account"}
                    </CardTitle>
                    <CardDescription>
                        Enter your email below to {isSignUp ? "create your account" : "access your dashboard"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {decodeURIComponent(errorMsg)}
                        </div>
                    )}

                    {!configured && (
                        // ... rest of UI ...
                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-800">Supabase not configured</p>
                                <p className="text-amber-700 mt-1">
                                    Update your <code className="bg-amber-100 px-1 rounded">.env.local</code> file with real Supabase credentials, or use Demo Mode below.
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-2">
                        <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading || !configured}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                            )}
                            Google
                        </Button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
                        <div className="grid gap-2">
                            <div className="grid gap-1">
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    {...form.register("email")}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                                )}
                            </div>
                            <div className="grid gap-1">
                                <Input
                                    id="password"
                                    placeholder="Password"
                                    type="password"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                    {...form.register("password")}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                                )}
                            </div>
                            <Button disabled={isLoading || !configured} className="mt-2">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSignUp ? "Sign Up" : "Sign In"}
                            </Button>
                        </div>
                    </form>
                    {!configured && (
                        <Button
                            variant="secondary"
                            size="lg"
                            className="w-full mt-2"
                            onClick={handleDemoMode}
                        >
                            🚀 Enter Demo Mode (No Login Required)
                        </Button>
                    )}
                </CardContent>
                <CardFooter>
                    <div className="text-sm text-muted-foreground">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            {isSignUp ? "Sign In" : "Sign Up"}
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <LoginContent />
        </Suspense>
    );
}
