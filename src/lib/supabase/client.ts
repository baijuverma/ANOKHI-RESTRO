import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function isSupabaseConfigured(): boolean {
    const url = (import.meta as any).env?.VITE_SUPABASE_URL;
    const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    return !!(
        url && key &&
        url !== "https://your-project.supabase.co" &&
        key !== "your-anon-key"
    );
}
