import { createSignal, createMemo, createEffect, For, Show, onMount } from "solid-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { api, LOCAL_RESTAURANT_ID } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "solid-sonner";
import { Search, Filter, Printer, ChevronLeft, ChevronRight, Loader2, Receipt, ArrowUpRight } from "lucide-solid";

const PER_PAGE = 25;

export default function OrdersPage() {
    const [orders, setOrders] = createSignal<any[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [page, setPage] = createSignal(0);
    const [total, setTotal] = createSignal(0);
    const [search, setSearch] = createSignal("");
    const [statusFilter, setStatusFilter] = createSignal("all");
    const [modeFilter, setModeFilter] = createSignal("all");

    const configured = isSupabaseConfigured();
    const supabase = configured ? createClient() : null;

    const fetchOrders = async () => {
        setLoading(true);
        if (!configured) {
            setOrders([
                { id: "1", bill_number: "001", customer_name: "Rajesh K", total: 1250, gst_amount: 0, status: "completed", payment_mode: "cash", created_at: new Date().toISOString() },
                { id: "2", bill_number: "002", customer_name: "Priya S", total: 2100, gst_amount: 378, status: "completed", payment_mode: "upi", created_at: new Date().toISOString() },
            ]);
            setTotal(2);
            setLoading(false);
            return;
        }
        try {
            const { data: { user } } = await supabase!.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase!.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) return;

            // Fetch from Go
            const res = await api.get<any>(`/orders?restaurant_id=${p.restaurant_id}&page=${page()}&per_page=${PER_PAGE}&status=${statusFilter()}&mode=${modeFilter()}&search=${search()}`);
            setOrders(res.data || []);
            setTotal(res.count || 0);
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    createEffect(() => {
        page(); statusFilter(); modeFilter(); search();
        fetchOrders();
    });

    const totalPages = createMemo(() => Math.ceil(total() / PER_PAGE));

    return (
        <div class="space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div class="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 class="text-2xl font-black text-slate-800">Order History</h1>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{total()} total orders</p>
                </div>
            </div>

            {/* Filters */}
            <div class="flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Search by name or bill #..." class="w-full h-11 bg-white border border-slate-200 rounded-2xl pl-11 pr-4 font-bold text-sm outline-none focus:border-primary shadow-sm" value={search()} onInput={e => { setSearch(e.currentTarget.value); setPage(0); }} />
                </div>
                <select class="h-11 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-sm outline-none focus:border-primary shadow-sm pr-8" value={statusFilter()} onChange={e => { setStatusFilter(e.currentTarget.value); setPage(0); }}>
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                </select>
                <select class="h-11 bg-white border border-slate-200 rounded-2xl px-4 font-bold text-sm outline-none focus:border-primary shadow-sm pr-8" value={modeFilter()} onChange={e => { setModeFilter(e.currentTarget.value); setPage(0); }}>
                    <option value="all">All Modes</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="credit">Credit</option>
                </select>
            </div>

            {/* Table */}
            <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                            <tr>
                                <th class="px-6 py-4">Bill #</th>
                                <th class="px-6 py-4">Customer</th>
                                <th class="px-6 py-4">Mode</th>
                                <th class="px-6 py-4">Date & Time</th>
                                <th class="px-6 py-4 text-right">Total</th>
                                <th class="px-6 py-4 text-right">Status</th>
                                <th class="px-6 py-4 text-right">Print</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <Show when={loading()}>
                                <tr><td colSpan={7} class="py-20 text-center">
                                    <Loader2 class="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                                    <p class="text-sm font-bold text-slate-400">Loading orders...</p>
                                </td></tr>
                            </Show>
                            <Show when={!loading()}>
                                <For each={orders()} fallback={
                                    <tr><td colSpan={7} class="py-20 text-center">
                                        <Receipt class="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                        <p class="text-sm font-bold text-slate-400">No orders found</p>
                                    </td></tr>
                                }>
                                    {(order) => (
                                        <tr class="hover:bg-slate-50/50 transition-colors">
                                            <td class="px-6 py-4 font-black text-slate-800">#{order.bill_number}</td>
                                            <td class="px-6 py-4 font-bold text-slate-600">{order.customer_name || "Guest"}</td>
                                            <td class="px-6 py-4">
                                                <span class="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">{order.payment_mode || "cash"}</span>
                                            </td>
                                            <td class="px-6 py-4 text-sm text-slate-500 font-medium">{formatDate(order.created_at)}</td>
                                            <td class="px-6 py-4 text-right font-black text-slate-800">{formatCurrency(order.total)}</td>
                                            <td class="px-6 py-4 text-right">
                                                <span class={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${order.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                                                    order.status === "cancelled" ? "bg-red-50 text-red-700" :
                                                        "bg-amber-50 text-amber-700"
                                                    }`}>{order.status}</span>
                                            </td>
                                            <td class="px-6 py-4 text-right">
                                                <button onClick={() => window.open(`/print/bill/${order.id}`, "_blank")} class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                                                    <Printer class="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </Show>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Show when={totalPages() > 1}>
                    <div class="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-400">
                            Page {page() + 1} of {totalPages()}
                        </span>
                        <div class="flex gap-2">
                            <button disabled={page() === 0} onClick={() => setPage(p => p - 1)} class="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-primary-foreground disabled:opacity-40 transition-all">
                                <ChevronLeft class="h-4 w-4" />
                            </button>
                            <button disabled={page() >= totalPages() - 1} onClick={() => setPage(p => p + 1)} class="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-primary hover:text-primary-foreground disabled:opacity-40 transition-all">
                                <ChevronRight class="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
}
