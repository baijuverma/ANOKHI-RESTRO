"use server";

import { createServerClient } from "@supabase/ssr";
import { getCookieHeader, setCookieHeader } from "vinxi/http";

export function createClient() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll: () => {
                try {
                    const cookieString = getCookieHeader() || "";
                    return cookieString.split(";").filter(Boolean).map(c => {
                        const [name, ...rest] = c.trim().split("=");
                        return { name: name.trim(), value: rest.join("=").trim() };
                    });
                } catch { return []; }
            },
            setAll: (cookies) => {
                try {
                    cookies.forEach(({ name, value, options }) => {
                        setCookieHeader(name, value, options as any);
                    });
                } catch { }
            }
        }
    });
}

export function isServerSupabaseConfigured(): boolean {
    const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !!(
        url && key &&
        url !== "https://your-project.supabase.co" &&
        key !== "your-anon-key"
    );
}
