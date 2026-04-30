export const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:8080/api";
export const LOCAL_RESTAURANT_ID = "00000000-0000-0000-0000-000000000000";
const API_TIMEOUT_MS = Number((import.meta as any).env.VITE_API_TIMEOUT_MS || 4000);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let res: Response;

    try {
        res = await fetch(`${API_URL}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
        });
    } catch (error: any) {
        if (error?.name === "AbortError") {
            throw new Error("API request timeout");
        }
        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Request failed");
    }

    if (res.status === 204) return {} as T;
    return res.json();
}

export const api = {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body: any) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
    put: <T>(path: string, body: any) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
