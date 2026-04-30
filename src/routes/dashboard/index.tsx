import { createSignal, createMemo, createEffect, For, Show, Suspense, lazy } from "solid-js";
import { useSearchParams, A } from "@solidjs/router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { startOfDay, endOfDay, parseISO, isValid, format } from "date-fns";
import {
    TrendingUp, TrendingDown, DollarSign, Receipt, Users, ShoppingBag,
    BarChart3, ArrowUpRight, Calendar
} from "lucide-solid";

const DEMO_ORDERS = [
    { id: "1", bill_number: "001", customer_name: "Rajesh Kumar", total: 1250, gst_amount: 225, status: "completed", payment_mode: "cash", created_at: new Date().toISOString() },
    { id: "2", bill_number: "002", customer_name: "Priya Sharma", total: 2100, gst_amount: 378, status: "completed", payment_mode: "upi", created_at: new Date().toISOString() },
    { id: "3", bill_number: "003", customer_name: "Amit Patel", total: 850, gst_amount: 0, status: "completed", payment_mode: "cash", created_at: new Date().toISOString() },
    { id: "4", bill_number: "004", customer_name: "Sneha Gupta", total: 3200, gst_amount: 0, status: "pending", payment_mode: "credit", amount_paid: 1000, created_at: new Date().toISOString() },
    { id: "5", bill_number: "005", customer_name: "Walk-in", total: 5050, gst_amount: 0, status: "completed", payment_mode: "upi", amount_paid: 5050, created_at: new Date().toISOString() },
];

export default function DashboardPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = createSignal<any[]>([]);
    const [loading, setLoading] = createSignal(true);

    const startDate = createMemo(() => {
        const p = searchParams.from;
        if (!p) return startOfDay(new Date());
        try { const d = parseISO(Array.isArray(p) ? p[0] : p); return isValid(d) ? startOfDay(d) : startOfDay(new Date()); } catch { return startOfDay(new Date()); }
    });

    const endDate = createMemo(() => {
        const p = searchParams.to;
        if (!p) return endOfDay(new Date());
        try { const d = parseISO(Array.isArray(p) ? p[0] : p); return isValid(d) ? endOfDay(d) : endOfDay(new Date()); } catch { return endOfDay(new Date()); }
    });

    createEffect(async () => {
        setLoading(true);
        if (!isSupabaseConfigured()) {
            setOrders(DEMO_ORDERS);
            setLoading(false);
            return;
        }
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) return;
            const { data } = await supabase.from("orders").select("*")
                .eq("restaurant_id", p.restaurant_id)
                .gte("created_at", startDate().toISOString())
                .lte("created_at", endDate().toISOString())
                .order("created_at", { ascending: false });
            setOrders(data || []);
        } catch { } finally { setLoading(false); }
    });

    const stats = createMemo(() => {
        const all = orders();
        const active = all.filter(o => o.status !== "cancelled");
        const cash = active.filter(o => (o.payment_mode || "cash").toLowerCase() === "cash").reduce((s, o) => s + Number(o.total), 0);
        const upi = active.filter(o => (o.payment_mode || "").toLowerCase() === "upi").reduce((s, o) => s + Number(o.total), 0);
        const dues = active.filter(o => ["credit", "due", "unpaid"].includes((o.payment_mode || "").toLowerCase())).reduce((s, o) => s + Number(o.total || 0) - Number(o.amount_paid || 0), 0);
        const total = cash + upi + dues;
        const gst = active.reduce((s, o) => s + Number(o.gst_amount || 0), 0);
        return { cash, upi, dues, total, gst, count: active.length };
    });

    const recentOrders = createMemo(() => orders().slice(0, 8));

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            {/* Date Filter */}
            <div class="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 class="text-2xl font-black text-slate-800 tracking-tight">Today's Overview</h1>
                    <p class="text-base font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {format(startDate(), "MMM d")} — {format(endDate(), "MMM d, yyyy")}
                    </p>
                </div>
                <div class="flex items-center gap-2 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
                    <Calendar class="h-4 w-4 text-slate-400 ml-2" />
                    <input type="date" value={searchParams.from || format(new Date(), "yyyy-MM-dd")} max="9999-12-31" onInput={e => setSearchParams({ from: e.currentTarget.value })} class="text-base font-bold bg-transparent outline-none h-8 px-2" style={{ "color-scheme": "light" }} />
                    <span class="text-slate-300">—</span>
                    <input type="date" value={searchParams.to || format(new Date(), "yyyy-MM-dd")} max="9999-12-31" onInput={e => setSearchParams({ to: e.currentTarget.value })} class="text-base font-bold bg-transparent outline-none h-8 px-2" style={{ "color-scheme": "light" }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Total Revenue" value={formatCurrency(stats().total)} sub={`${stats().count} orders`} icon={TrendingUp} color="violet" />
                <StatCard label="Cash Sales" value={formatCurrency(stats().cash)} sub="Cash payments" icon={DollarSign} color="emerald" />
                <StatCard label="UPI / Digital" value={formatCurrency(stats().upi)} sub="Online payments" icon={ShoppingBag} color="sky" />
                <StatCard label="Pending Dues" value={formatCurrency(stats().dues)} sub="Credit balance" icon={Receipt} color="amber" />
                <StatCard label="GST Collected" value={formatCurrency(stats().gst)} sub="Tax amount" icon={BarChart3} color="rose" />
            </div>

            {/* Recent Orders Table */}
            <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
                <div class="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 class="font-black text-slate-800 text-xl">Recent Transactions</h3>
                    <A href="/dashboard/orders" class="text-base font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:gap-2 transition-all">
                        View All <ArrowUpRight class="h-3 w-3" />
                    </A>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50/50 text-base font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th class="px-6 py-4">Bill #</th>
                                <th class="px-6 py-4">Customer</th>
                                <th class="px-6 py-4">Mode</th>
                                <th class="px-6 py-4 text-right">Amount</th>
                                <th class="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <Show when={!loading()} fallback={
                                <tr><td colSpan={5} class="py-16 text-center text-sm font-bold text-slate-400">Loading...</td></tr>
                            }>
                                <For each={recentOrders()} fallback={
                                    <tr><td colSpan={5} class="py-16 text-center text-sm font-bold text-slate-400">No orders today</td></tr>
                                }>
                                    {(order) => (
                                        <tr class="hover:bg-slate-50/50 transition-colors">
                                            <td class="px-6 py-4 font-black text-slate-800 text-base">#{order.bill_number}</td>
                                            <td class="px-6 py-4 font-bold text-slate-600 text-base">{order.customer_name || "Guest"}</td>
                                            <td class="px-6 py-4">
                                                <span class="px-2.5 py-1 bg-slate-100 rounded-full text-base font-black uppercase text-slate-500">
                                                    {order.payment_mode || "Cash"}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 text-right font-black text-slate-800">{formatCurrency(order.total)}</td>
                                            <td class="px-6 py-4 text-right">
                                                <span class={`px-2.5 py-1 rounded-full text-base font-black uppercase ${order.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                                                        order.status === "cancelled" ? "bg-red-50 text-red-700" :
                                                            "bg-amber-50 text-amber-700"
                                                    }`}>{order.status}</span>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </Show>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard(props: { label: string; value: string; sub: string; icon: any; color: string }) {
    const colors: Record<string, string> = {
        violet: "bg-violet-200 text-violet-900 border-violet-300",
        emerald: "bg-emerald-200 text-emerald-900 border-emerald-300",
        sky: "bg-sky-200 text-sky-900 border-sky-300",
        amber: "bg-amber-200 text-amber-900 border-amber-300",
        rose: "bg-rose-200 text-rose-900 border-rose-300",
    };
    return (
        <div class={`p-5 rounded-3xl border transition-all hover:scale-105 ${colors[props.color]}`}>
            <props.icon class="h-5 w-5 mb-3 opacity-60" />
            <p class="text-base font-black uppercase tracking-widest opacity-60 mb-1">{props.label}</p>
            <h3 class="text-xl font-black tracking-tighter">{props.value}</h3>
            <p class="text-base font-bold opacity-50 mt-1">{props.sub}</p>
        </div>
    );
}
