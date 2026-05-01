import { createMiddleware } from "@solidjs/start/middleware";
import { createServerClient } from "@supabase/ssr";
import { getCookieHeader, setCookieHeader } from "vinxi/http";

export default createMiddleware({
    onRequest: [
        async (event) => {
            const url = new URL(event.request.url);
            const pathname = url.pathname;

            // Static files skip
            if (
                pathname.startsWith("/_build") ||
                pathname.startsWith("/assets") ||
                pathname.match(/\.(ico|svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$/)
            ) {
                return;
            }

            const isProtected = pathname.startsWith("/dashboard");
            const isAuthPage = pathname === "/login" || pathname === "/";
            const hasAuthCallbackParams =
                url.searchParams.has("code") ||
                url.searchParams.has("token_hash") ||
                url.searchParams.has("access_token") ||
                url.searchParams.has("refresh_token");

            if (!isProtected && !isAuthPage) {
                return;
            }

            if (hasAuthCallbackParams) {
                return;
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) return;

            const supabase = createServerClient(supabaseUrl, supabaseKey, {
                cookies: {
                    getAll: () => {
                        const cookieString = getCookieHeader() || "";
                        return cookieString.split(";").filter(Boolean).map(c => {
                            const [name, ...rest] = c.trim().split("=");
                            return { name: name.trim(), value: rest.join("=").trim() };
                        });
                    },
                    setAll: (cookies) => {
                        cookies.forEach(({ name, value, options }) => {
                            setCookieHeader(name, value, options);
                        });
                    }
                }
            });

            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (isProtected && !user) {
                return Response.redirect(new URL("/login", event.request.url));
            }

            if (isAuthPage && user) {
                return Response.redirect(new URL("/dashboard", event.request.url));
            }
        }
    ]
});
