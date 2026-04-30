import { createSignal, createMemo, createEffect, For, Show } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { startOfDay, endOfDay, parseISO, isValid, format, eachDayOfInterval } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, Users, BarChart3, Loader2, Calendar } from "lucide-solid";

export default function ReportsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = createSignal<any[]>([]);
    const [loading, setLoading] = createSignal(true);

    const fromDate = createMemo(() => {
        const p = searchParams.from || format(new Date(), "yyyy-MM-dd");
        try { const d = parseISO(p); return isValid(d) ? startOfDay(d) : startOfDay(new Date()); } catch { return startOfDay(new Date()); }
    });
    const toDate = createMemo(() => {
        const p = searchParams.to || format(new Date(), "yyyy-MM-dd");
        try { const d = parseISO(p); return isValid(d) ? endOfDay(d) : endOfDay(new Date()); } catch { return endOfDay(new Date()); }
    });

    createEffect(async () => {
        setLoading(true);
        if (!isSupabaseConfigured()) {
            setOrders([
                { id: "1", total: 1250, gst_amount: 0, payment_mode: "cash", status: "completed", created_at: new Date().toISOString() },
                { id: "2", total: 2100, gst_amount: 378, payment_mode: "upi", status: "completed", created_at: new Date().toISOString() },
                { id: "3", total: 5050, gst_amount: 0, payment_mode: "upi", status: "completed", created_at: new Date().toISOString() },
            ]);
            setLoading(false);
            return;
        }
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) return;
            const { data } = await supabase.from("orders").select("*").eq("restaurant_id", p.restaurant_id)
                .gte("created_at", fromDate().toISOString()).lte("created_at", toDate().toISOString())
                .neq("status", "cancelled");
            setOrders(data || []);
        } catch { } finally { setLoading(false); }
    });

    const stats = createMemo(() => {
        const all = orders();
        const cash = all.filter(o => (o.payment_mode || "cash").toLowerCase() === "cash").reduce((s, o) => s + Number(o.total), 0);
        const upi = all.filter(o => (o.payment_mode || "").toLowerCase() === "upi").reduce((s, o) => s + Number(o.total), 0);
        const dues = all.filter(o => ["credit", "due"].includes((o.payment_mode || "").toLowerCase())).reduce((s, o) => s + Number(o.total) - Number(o.amount_paid || 0), 0);
        const gst = all.reduce((s, o) => s + Number(o.gst_amount || 0), 0);
        const total = cash + upi + dues;
        return { total, cash, upi, dues, gst, count: all.length, avg: all.length ? total / all.length : 0 };
    });

    // Build chart data — orders grouped by day
    const chartData = createMemo(() => {
        const days = eachDayOfInterval({ start: fromDate(), end: toDate() }).slice(0, 30);
        return days.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayOrders = orders().filter(o => o.created_at.startsWith(dayStr));
            return { date: format(day, "MMM d"), total: dayOrders.reduce((s, o) => s + Number(o.total), 0) };
        });
    });

    const maxBar = createMemo(() => Math.max(...chartData().map(d => d.total), 1));

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            {/* Header + Date Filter */}
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-2xl font-black text-slate-800 tracking-tight">Analytics Reports</h1>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Period: {format(fromDate(), "MMM d")} — {format(toDate(), "MMM d, yyyy")}</p>
                </div>
                <div class="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
                    <Calendar class="h-4 w-4 text-slate-400 ml-2" />
                    <input type="date" value={searchParams.from || format(new Date(), "yyyy-MM-dd")} max="9999-12-31" onInput={e => setSearchParams({ from: e.currentTarget.value })} class="h-8 px-2 text-xs font-bold bg-transparent outline-none" style={{ "color-scheme": "light" }} />
                    <span class="text-slate-300">—</span>
                    <input type="date" value={searchParams.to || format(new Date(), "yyyy-MM-dd")} max="9999-12-31" onInput={e => setSearchParams({ to: e.currentTarget.value })} class="h-8 px-2 text-xs font-bold bg-transparent outline-none" style={{ "color-scheme": "light" }} />
                </div>
            </div>

            <Show when={loading()}>
                <div class="py-24 flex items-center justify-center gap-3">
                    <Loader2 class="h-8 w-8 animate-spin text-primary" />
                    <span class="font-bold text-slate-400">Loading analytics...</span>
                </div>
            </Show>

            <Show when={!loading()}>
                {/* Stats Grid */}
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: "Total Revenue", value: formatCurrency(stats().total), icon: TrendingUp, bg: "bg-violet-50 text-violet-700 border-violet-100" },
                        { label: "Cash Sales", value: formatCurrency(stats().cash), icon: DollarSign, bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                        { label: "UPI / Digital", value: formatCurrency(stats().upi), icon: BarChart3, bg: "bg-sky-50 text-sky-700 border-sky-100" },
                        { label: "Pending Dues", value: formatCurrency(stats().dues), icon: TrendingDown, bg: "bg-amber-50 text-amber-700 border-amber-100" },
                        { label: "GST Collected", value: formatCurrency(stats().gst), icon: DollarSign, bg: "bg-rose-50 text-rose-700 border-rose-100" },
                        { label: "Avg Bill Value", value: formatCurrency(stats().avg), icon: Users, bg: "bg-slate-50 text-slate-700 border-slate-200" },
                    ].map(s => (
                        <div class={`p-4 rounded-2xl border ${s.bg} transition-all hover:scale-105`}>
                            <s.icon class="h-4 w-4 mb-2 opacity-50" />
                            <p class="text-[9px] font-black uppercase tracking-widest opacity-60">{s.label}</p>
                            <p class="text-lg font-black tracking-tighter mt-0.5">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Bar Chart */}
                <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6">
                    <h3 class="font-black text-slate-800 text-lg mb-6">Daily Revenue Trend</h3>
                    <div class="flex items-end gap-1 h-48 overflow-x-auto no-scrollbar">
                        <For each={chartData()}>
                            {(day) => {
                                const height = () => maxBar() > 0 ? (day.total / maxBar()) * 100 : 0;
                                return (
                                    <div class="flex flex-col items-center gap-1 group flex-1 min-w-[28px]">
                                        <div class="relative w-full flex justify-center">
                                            <div
                                                class="w-full max-w-[24px] rounded-t-lg bg-primary/20 group-hover:bg-primary transition-colors duration-200"
                                                style={{ height: `${Math.max(height(), day.total > 0 ? 4 : 0)}%`, "min-height": day.total > 0 ? "4px" : "0" }}
                                                title={`${day.date}: ${formatCurrency(day.total)}`}
                                            />
                                        </div>
                                        <span class="text-[8px] font-black text-slate-400 uppercase writing-mode-vertical whitespace-nowrap">{day.date.split(" ")[1]}</span>
                                    </div>
                                );
                            }}
                        </For>
                    </div>
                </div>

                {/* Payment breakdown */}
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6">
                        <h3 class="font-black text-slate-800 text-lg mb-5">Payment Breakdown</h3>
                        <div class="space-y-4">
                            <For each={[
                                { label: "Cash", value: stats().cash, color: "bg-emerald-400" },
                                { label: "UPI", value: stats().upi, color: "bg-sky-400" },
                                { label: "Dues", value: stats().dues, color: "bg-amber-400" },
                            ]}>
                                {bar => {
                                    const pct = () => stats().total > 0 ? (bar.value / stats().total) * 100 : 0;
                                    return (
                                        <div class="space-y-1.5">
                                            <div class="flex items-center justify-between text-xs font-bold">
                                                <span class="text-slate-600">{bar.label}</span>
                                                <span class="text-slate-400">{pct().toFixed(1)}% — {formatCurrency(bar.value)}</span>
                                            </div>
                                            <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div class={`h-full rounded-full ${bar.color} transition-all duration-700`} style={{ width: `${pct()}%` }} />
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>

                    <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6">
                        <h3 class="font-black text-slate-800 text-lg mb-5">Period Summary</h3>
                        <div class="space-y-3">
                            {[
                                { label: "Total Orders", value: `${stats().count} bills` },
                                { label: "Average Order Value", value: formatCurrency(stats().avg) },
                                { label: "GST Component", value: formatCurrency(stats().gst) },
                                { label: "Base Revenue (ex-GST)", value: formatCurrency(stats().total - stats().gst) },
                            ].map(item => (
                                <div class="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                                    <span class="text-sm font-bold text-slate-500">{item.label}</span>
                                    <span class="text-sm font-black text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
