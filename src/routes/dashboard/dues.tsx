import { createSignal, createMemo, createEffect, For, Show } from "solid-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "solid-sonner";
import { AlertTriangle, CheckCircle2, Loader2, CreditCard, User } from "lucide-solid";

export default function DuesPage() {
    const [dues, setDues] = createSignal<any[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [settling, setSettling] = createSignal<string | null>(null);

    const configured = isSupabaseConfigured();
    const supabase = configured ? createClient() : null;

    const fetchDues = async () => {
        setLoading(true);
        if (!configured) {
            setDues([
                { id: "1", bill_number: "003", customer_name: "Sneha Gupta", customer_phone: "9876512345", total: 3200, amount_paid: 1000, payment_mode: "credit", created_at: new Date(Date.now() - 86400000).toISOString() },
            ]);
            setLoading(false);
            return;
        }
        try {
            const { data: { user } } = await supabase!.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase!.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) return;
            const { data, error } = await supabase!.from("orders").select("*")
                .eq("restaurant_id", p.restaurant_id)
                .in("payment_mode", ["credit", "due", "unpaid"])
                .neq("status", "cancelled")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setDues((data || []).filter(o => Number(o.total) > Number(o.amount_paid || 0)));
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    createEffect(fetchDues);

    const totalDues = createMemo(() => dues().reduce((s, o) => s + Number(o.total) - Number(o.amount_paid || 0), 0));

    const handleSettle = async (order: any) => {
        setSettling(order.id);
        try {
            if (supabase) {
                const { error } = await supabase.from("orders").update({ status: "completed", payment_mode: "cash", amount_paid: order.total }).eq("id", order.id);
                if (error) throw error;
            }
            setDues(dues().filter(d => d.id !== order.id));
            toast.success(`Bill #${order.bill_number} settled!`);
        } catch (e: any) { toast.error(e.message); }
        finally { setSettling(null); }
    };

    return (
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-2xl font-black text-slate-800">Pending Dues</h1>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{dues().length} unpaid orders</p>
                </div>
                <Show when={totalDues() > 0}>
                    <div class="px-6 py-3 bg-red-50 border border-red-100 rounded-2xl text-center">
                        <p class="text-[9px] font-black uppercase tracking-widest text-red-500">Total Outstanding</p>
                        <p class="text-2xl font-black text-red-600 tracking-tighter">{formatCurrency(totalDues())}</p>
                    </div>
                </Show>
            </div>

            <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
                <Show when={loading()}>
                    <div class="py-24 flex items-center justify-center gap-3">
                        <Loader2 class="h-6 w-6 animate-spin text-primary" />
                        <span class="text-sm font-bold text-slate-400">Loading dues...</span>
                    </div>
                </Show>
                <Show when={!loading()}>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <tr>
                                    <th class="px-6 py-4">Bill #</th>
                                    <th class="px-6 py-4">Customer</th>
                                    <th class="px-6 py-4">Date</th>
                                    <th class="px-6 py-4 text-right">Bill Total</th>
                                    <th class="px-6 py-4 text-right">Paid</th>
                                    <th class="px-6 py-4 text-right">Outstanding</th>
                                    <th class="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                <For each={dues()} fallback={
                                    <tr><td colSpan={7} class="py-20 text-center">
                                        <CheckCircle2 class="h-12 w-12 text-emerald-200 mx-auto mb-3" />
                                        <p class="text-sm font-bold text-slate-400">All dues cleared! Great job 🎉</p>
                                    </td></tr>
                                }>
                                    {(order) => {
                                        const outstanding = Number(order.total) - Number(order.amount_paid || 0);
                                        return (
                                            <tr class="hover:bg-red-50/30 transition-colors">
                                                <td class="px-6 py-4 font-black text-slate-800">#{order.bill_number}</td>
                                                <td class="px-6 py-4">
                                                    <div class="flex items-center gap-2">
                                                        <div class="h-7 w-7 bg-slate-100 rounded-full flex items-center justify-center">
                                                            <User class="h-3 w-3 text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <p class="text-sm font-bold text-slate-700">{order.customer_name || "Guest"}</p>
                                                            <p class="text-[10px] text-slate-400">{order.customer_phone || "—"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 text-sm text-slate-500 font-medium">{formatDate(order.created_at)}</td>
                                                <td class="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(order.total)}</td>
                                                <td class="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(order.amount_paid || 0)}</td>
                                                <td class="px-6 py-4 text-right font-black text-red-600">{formatCurrency(outstanding)}</td>
                                                <td class="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleSettle(order)}
                                                        disabled={settling() === order.id}
                                                        class="h-9 px-4 bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                                                    >
                                                        <Show when={settling() === order.id} fallback={<><CreditCard class="h-3 w-3" /> Settle</>}>
                                                            <Loader2 class="h-3 w-3 animate-spin" /> ...
                                                        </Show>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </div>
        </div>
    );
}
