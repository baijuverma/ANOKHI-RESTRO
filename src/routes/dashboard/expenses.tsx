import { createSignal, createEffect, createMemo, For, Show, onMount } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { api, LOCAL_RESTAURANT_ID } from "@/lib/api";
import { useExpenseDateFilter } from "@/lib/store/expense-date-store";
import { useExpenseStats } from "@/lib/store/expense-stats-store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "solid-sonner";
import {
    TrendingDown, TrendingUp, Wallet, Trash2, Edit, Save, Plus, Loader2, X
} from "lucide-solid";

const EXPENSE_CATEGORIES = [
    { value: "cogs", label: "Food & Beverage (COGS)" },
    { value: "labor", label: "Labor (Salaries)" },
    { value: "rent_utilities", label: "Rent & Utilities" },
    { value: "marketing", label: "Marketing" },
    { value: "misc", label: "Miscellaneous" }
];
const PER_PAGE = 15;

function isEditable(createdAt: string) {
    return (new Date().getTime() - new Date(createdAt).getTime()) < (72 * 60 * 60 * 1000);
}

export default function ExpensesPage() {
    const [amount, setAmount] = createSignal("");
    const [category, setCategory] = createSignal("");
    const [description, setDescription] = createSignal("");
    const [date, setDate] = createSignal(new Date().toISOString().split("T")[0]);
    const [saving, setSaving] = createSignal(false);
    const [loadingData, setLoadingData] = createSignal(true);
    const [loadingMore, setLoadingMore] = createSignal(false);
    const [hasMore, setHasMore] = createSignal(false);
    const [cursor, setCursor] = createSignal<string | null>(null);
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editForm, setEditForm] = createStore<any>({});

    const [expenses, setExpenses] = createStore<any[]>([]);
    const { startDate, endDate } = useExpenseDateFilter();
    const stats = useExpenseStats();

    const configured = isSupabaseConfigured();
    const supabase = configured ? createClient() : null;

    const fetchExpenses = async (reset = true) => {
        if (reset) setLoadingData(true); else setLoadingMore(true);
        try {
            if (!configured) {
                setExpenses([{ id: "d1", expense_date: date(), category: "cogs", amount: 1200, description: "Demo vegetables", created_at: new Date().toISOString() }]);
                stats.setStats(15000, 1200);
                return;
            }
            const { data: { user } } = await supabase!.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase!.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) return;

            if (reset) {
                // Fetch stats from Go
                const statsData = await api.get<any>(`/stats?restaurant_id=${p.restaurant_id}&start_date=${startDate()}&end_date=${endDate()}`);
                stats.setStats(statsData.revenue, statsData.expenses);
            }

            // Fetch expenses from Go
            const data = await api.get<any[]>(`/expenses?restaurant_id=${p.restaurant_id}&start_date=${startDate()}&end_date=${endDate()}`);
            setExpenses(data || []);
            setHasMore(false);
        } catch (e: any) { toast.error(e.message); }
        finally { setLoadingData(false); setLoadingMore(false); }
    };

    // Refetch when dates change
    createEffect(() => {
        startDate(); endDate();
        fetchExpenses(true);
    });

    const handleSave = async () => {
        if (!amount() || !category() || !date()) return toast.error("Fill all required fields");
        setSaving(true);
        try {
            const payload = { category: category(), amount: parseFloat(amount()), description: description(), expense_date: date(), restaurant_id: "" };
            if (configured) {
                const { data: { user } } = await supabase!.auth.getUser();
                if (!user) throw new Error("Not authenticated");
                const { data: p } = await supabase!.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
                payload.restaurant_id = p?.restaurant_id || "";

                await api.post("/expenses", payload);
                fetchExpenses(true);
            } else {
                setExpenses([{ id: Date.now().toString(), ...payload, created_at: new Date().toISOString() }, ...expenses]);
            }
            toast.success("Expense logged");
            setAmount(""); setDescription(""); setCategory("");
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            if (supabase) {
                const { error } = await supabase.from("expenses").delete().eq("id", id);
                if (error) throw error;
            }
            setExpenses(expenses.filter(e => e.id !== id));
            toast.success("Deleted");
        } catch (e: any) { toast.error(e.message); }
    };

    const handleEditSave = async (id: string) => {
        try {
            if (supabase) {
                const { error } = await supabase.from("expenses").update({
                    amount: parseFloat(editForm.amount), category: editForm.category, description: editForm.description, expense_date: editForm.date
                }).eq("id", id);
                if (error) throw error;
            }
            setExpenses(produce(s => {
                const idx = s.findIndex(e => e.id === id);
                if (idx !== -1) s[idx] = { ...s[idx], ...editForm };
            }));
            setEditingId(null);
            toast.success("Updated");
        } catch (e: any) { toast.error(e.message); }
    };

    const netProfit = createMemo(() => stats.totalRevenue() - stats.totalExpenses());

    return (
        <div class="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
            {/* Add Expense Form */}
            <aside class="lg:col-span-3">
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 space-y-5 sticky top-6">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <Plus class="h-5 w-5 text-primary" />
                        </div>
                        <h2 class="text-lg font-black text-slate-800">Log Expense</h2>
                    </div>

                    <div class="space-y-4">
                        <FieldWrap label="Category *">
                            <select class="w-full h-11 bg-slate-50 border-2 border-slate-50 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary transition-all" value={category()} onChange={e => setCategory(e.currentTarget.value)}>
                                <option value="">Select category</option>
                                <For each={EXPENSE_CATEGORIES}>{c => <option value={c.value}>{c.label}</option>}</For>
                            </select>
                        </FieldWrap>

                        <FieldWrap label="Amount (₹) *">
                            <input type="number" min="0" step="0.01" placeholder="0.00" class="w-full h-11 bg-slate-50 border-2 border-slate-50 rounded-xl px-3 font-black text-xl outline-none focus:border-primary transition-all" value={amount()} onInput={e => setAmount(e.currentTarget.value)} />
                        </FieldWrap>

                        <FieldWrap label="Date *">
                            <input type="date" class="w-full h-11 bg-slate-50 border-2 border-slate-50 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary transition-all" value={date()} onInput={e => setDate(e.currentTarget.value)} />
                        </FieldWrap>

                        <FieldWrap label="Description">
                            <textarea rows={3} placeholder="What was this for?" class="w-full bg-slate-50 border-2 border-slate-50 rounded-xl p-3 font-bold text-sm outline-none focus:border-primary transition-all resize-none" value={description()} onInput={e => setDescription(e.currentTarget.value)} />
                        </FieldWrap>

                        <button onClick={handleSave} disabled={saving()} class="w-full h-12 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                            <Show when={saving()} fallback={<><Plus class="h-4 w-4" /> Log Expense</>}>
                                <Loader2 class="h-4 w-4 animate-spin" /> Saving...
                            </Show>
                        </button>
                    </div>

                    {/* Net P/L recap */}
                    <div class={`p-4 rounded-2xl border text-center ${netProfit() >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                        <p class="text-[9px] font-black uppercase tracking-widest opacity-60">Net Profit / Loss</p>
                        <p class="text-2xl font-black tracking-tighter mt-1">{formatCurrency(netProfit())}</p>
                    </div>
                </div>
            </aside>

            {/* Expense Ledger */}
            <div class="lg:col-span-9">
                {/* Quick Stats */}
                <div class="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: "Total Revenue", value: stats.totalRevenue(), color: "emerald", icon: TrendingUp },
                        { label: "Total Expenses", value: stats.totalExpenses(), color: "red", icon: TrendingDown },
                        { label: "Net Profit", value: netProfit(), color: netProfit() >= 0 ? "blue" : "orange", icon: Wallet }
                    ].map(s => (
                        <div class={`bg-${s.color}-50 border border-${s.color}-100 text-${s.color}-700 p-4 rounded-2xl`}>
                            <s.icon class="h-4 w-4 mb-2 opacity-60" />
                            <p class="text-[9px] font-black uppercase tracking-widest opacity-60">{s.label}</p>
                            <p class="text-xl font-black tracking-tighter">{formatCurrency(s.value)}</p>
                        </div>
                    ))}
                </div>

                <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
                    <div class="p-5 border-b border-slate-50">
                        <h3 class="font-black text-slate-800">Expense Ledger</h3>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{expenses.length} entries loaded</p>
                    </div>

                    <Show when={loadingData()}>
                        <div class="py-20 flex items-center justify-center gap-3">
                            <Loader2 class="h-6 w-6 animate-spin text-primary" />
                            <span class="text-sm font-bold text-slate-400">Loading expenses...</span>
                        </div>
                    </Show>

                    <Show when={!loadingData()}>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th class="px-5 py-4">Editable</th>
                                        <th class="px-5 py-4">Date</th>
                                        <th class="px-5 py-4">Category</th>
                                        <th class="px-5 py-4">Description</th>
                                        <th class="px-5 py-4 text-right">Amount</th>
                                        <th class="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    <For each={expenses} fallback={
                                        <tr><td colSpan={6} class="py-16 text-center text-sm font-bold text-slate-400">No expenses found for this period</td></tr>
                                    }>
                                        {(exp) => {
                                            const editing = () => editingId() === exp.id;
                                            const editable = () => isEditable(exp.created_at);
                                            return (
                                                <tr class={`transition-colors group ${editing() ? "bg-primary/5" : "hover:bg-slate-50/50"}`}>
                                                    <td class="px-5 py-3">
                                                        <CircularCountdown createdAt={exp.created_at} />
                                                    </td>
                                                    <td class="px-5 py-3 font-bold text-slate-700 text-sm">
                                                        <Show when={editing()} fallback={exp.expense_date}>
                                                            <input type="date" class="h-8 bg-white border rounded-lg px-2 text-xs font-bold outline-none" value={editForm.date} onInput={e => setEditForm("date", e.currentTarget.value)} />
                                                        </Show>
                                                    </td>
                                                    <td class="px-5 py-3">
                                                        <Show when={editing()} fallback={
                                                            <span class="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">{exp.category}</span>
                                                        }>
                                                            <select class="h-8 bg-white border rounded-lg px-2 text-xs font-bold outline-none" value={editForm.category} onChange={e => setEditForm("category", e.currentTarget.value)}>
                                                                <For each={EXPENSE_CATEGORIES}>{c => <option value={c.value}>{c.label}</option>}</For>
                                                            </select>
                                                        </Show>
                                                    </td>
                                                    <td class="px-5 py-3 text-slate-500 text-sm max-w-[200px] truncate">
                                                        <Show when={editing()} fallback={exp.description || "—"}>
                                                            <input class="h-8 bg-white border rounded-lg px-2 text-xs font-bold outline-none w-full" value={editForm.description} onInput={e => setEditForm("description", e.currentTarget.value)} />
                                                        </Show>
                                                    </td>
                                                    <td class="px-5 py-3 text-right font-black text-rose-600">
                                                        <Show when={editing()} fallback={formatCurrency(exp.amount)}>
                                                            <input type="number" class="h-8 bg-white border rounded-lg px-2 text-xs font-black text-right outline-none w-24" value={editForm.amount} onInput={e => setEditForm("amount", e.currentTarget.value)} />
                                                        </Show>
                                                    </td>
                                                    <td class="px-5 py-3 text-right">
                                                        <div class="flex justify-end gap-1">
                                                            <Show when={editable()}>
                                                                <Show when={editing()} fallback={
                                                                    <button onClick={() => { setEditingId(exp.id); setEditForm({ amount: exp.amount, category: exp.category, description: exp.description || "", date: exp.expense_date }); }} class="p-1.5 text-slate-300 hover:text-primary transition-colors">
                                                                        <Edit class="h-3.5 w-3.5" />
                                                                    </button>
                                                                }>
                                                                    <button onClick={() => handleEditSave(exp.id)} class="p-1.5 text-primary hover:text-primary/70 transition-colors">
                                                                        <Save class="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button onClick={() => setEditingId(null)} class="p-1.5 text-slate-300 hover:text-slate-500 transition-colors">
                                                                        <X class="h-3.5 w-3.5" />
                                                                    </button>
                                                                </Show>
                                                                <button onClick={() => handleDelete(exp.id)} class="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                                                    <Trash2 class="h-3.5 w-3.5" />
                                                                </button>
                                                            </Show>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        <Show when={hasMore()}>
                            <button onClick={() => fetchExpenses(false)} disabled={loadingMore()} class="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors border-t border-slate-50 flex items-center justify-center gap-2">
                                <Show when={loadingMore()} fallback="Load More Entries">
                                    <Loader2 class="h-4 w-4 animate-spin" /> Loading...
                                </Show>
                            </button>
                        </Show>
                    </Show>
                </div>
            </div>
        </div>
    );
}

// Circular countdown component
function CircularCountdown(props: { createdAt: string }) {
    const maxMs = 72 * 60 * 60 * 1000;
    const [timeLeft, setTimeLeft] = createSignal(0);

    createEffect(() => {
        const calc = () => {
            const elapsed = Date.now() - new Date(props.createdAt).getTime();
            setTimeLeft(Math.max(0, maxMs - elapsed));
        };
        calc();
        const id = setInterval(calc, 10000);
        return () => clearInterval(id);
    });

    const pct = createMemo(() => (timeLeft() / maxMs) * 100);
    const r = 16;
    const circ = 2 * Math.PI * r;
    const offset = createMemo(() => circ - (pct() / 100) * circ);
    const hrs = createMemo(() => Math.ceil(timeLeft() / 3600000));
    const expired = createMemo(() => timeLeft() <= 0);
    const warn = createMemo(() => pct() <= 25 && !expired());

    return (
        <div class="relative inline-flex items-center justify-center group" title={expired() ? "Edit locked" : `${hrs()}h remaining`}>
            <svg class="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r={r} stroke="currentColor" stroke-width="3.5" fill="none" class="text-slate-200" />
                <circle cx="20" cy="20" r={r} stroke="currentColor" stroke-width="3.5" fill="none"
                    stroke-dasharray={String(circ)} stroke-dashoffset={String(offset())} stroke-linecap="round"
                    class={`transition-all duration-300 ${expired() ? "text-slate-400" : warn() ? "text-orange-500" : "text-emerald-500"}`}
                />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class={`text-[11px] font-black ${expired() ? "text-slate-400" : warn() ? "text-orange-600" : "text-emerald-600"}`}>
                    {expired() ? "🔒" : hrs()}
                </span>
                <Show when={!expired()}>
                    <span class="text-[7px] font-black text-slate-400 uppercase">hr</span>
                </Show>
            </div>
        </div>
    );
}

function FieldWrap(props: { label: string; children: any }) {
    return (
        <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{props.label}</label>
            {props.children}
        </div>
    );
}
