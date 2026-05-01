"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Calendar, Filter, TrendingDown, TrendingUp, DollarSign, Wallet,
    Trash2, Edit, Save, Plus, ArrowLeft
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useExpenseDateFilter } from "@/lib/store/expense-date-store";
import { useExpenseStats } from "@/lib/store/expense-stats-store";
import { CircularCountdown, isEditableWithin72Hours } from "@/components/CircularCountdown";

const EXPENSE_CATEGORIES = [
    { value: "cogs", label: "Food & Beverage (COGS)" },
    { value: "labor", label: "Labor (Salaries)" },
    { value: "rent_utilities", label: "Rent & Utilities" },
    { value: "marketing", label: "Marketing" },
    { value: "misc", label: "Miscellaneous" }
];

const EXPENSES_PER_PAGE = 15;

export default function ExpensesPage() {
    const router = useRouter();
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    // Use global store for dates
    const { startDate, endDate } = useExpenseDateFilter();

    // Data
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [lastCursor, setLastCursor] = useState<string | null>(null);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);

    // Edit mode state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const configured = isSupabaseConfigured();

    useEffect(() => {
        if (configured) {
            fetchData();
        } else {
            // Demo Data
            setExpenses([
                { id: 1, date: '2024-02-15', category: 'cogs', amount: 1200, description: 'Vegetables from Market' },
                { id: 2, date: '2024-02-14', category: 'misc', amount: 500, description: 'Cleaning supplies' },
            ]);
            setTotalRevenue(15000); // Demo Revenue
            setTotalExpenses(1700);
        }
    }, [configured, startDate, endDate]);

    const fetchData = async () => {
        setLoadingExpenses(true);
        setExpenses([]);
        setLastCursor(null);
        try {
            const supabase = createClient();

            // Get current user/restaurant
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Expenses with pagination
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
                .order('expense_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(EXPENSES_PER_PAGE + 1);

            if (expenseError) throw expenseError;

            const hasMoreData = (expenseData || []).length > EXPENSES_PER_PAGE;
            const displayData = hasMoreData ? expenseData!.slice(0, EXPENSES_PER_PAGE) : (expenseData || []);

            setExpenses(displayData);
            setHasMore(hasMoreData);
            if (hasMoreData && displayData.length > 0) {
                const lastItem = displayData[displayData.length - 1];
                setLastCursor(lastItem.expense_date + '|' + lastItem.created_at);
            }

            const expTotal = (expenseData || []).reduce((sum, item) => sum + Number(item.amount), 0);
            setTotalExpenses(expTotal);

            // Fetch Revenue (Orders)
            const { data: revenueData, error: revError } = await supabase
                .from('orders')
                .select('total, created_at')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`);

            if (revError) {
                console.error("Error fetching revenue:", revError);
            } else {
                const revTotal = (revenueData || []).reduce((sum, order) => sum + Number(order.total), 0);
                setTotalRevenue(revTotal);
                // Update global store for header
                useExpenseStats.getState().setStats(revTotal, expTotal);
            }

        } catch (error: any) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoadingExpenses(false);
        }
    };

    const loadMoreExpenses = async () => {
        if (!lastCursor || loadingMore) return;

        setLoadingMore(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [lastDate, lastCreatedAt] = lastCursor.split('|');

            const { data: moreExpenses, error } = await supabase
                .from('expenses')
                .select('*')
                .gte('expense_date', startDate)
                .lte('expense_date', endDate)
                .or(`expense_date.lt.${lastDate},and(expense_date.eq.${lastDate},created_at.lt.${lastCreatedAt})`)
                .order('expense_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(EXPENSES_PER_PAGE + 1);

            if (error) throw error;

            const hasMoreData = (moreExpenses || []).length > EXPENSES_PER_PAGE;
            const displayData = hasMoreData ? moreExpenses!.slice(0, EXPENSES_PER_PAGE) : (moreExpenses || []);

            setExpenses(prev => [...prev, ...displayData]);
            setHasMore(hasMoreData);
            if (hasMoreData && displayData.length > 0) {
                const lastItem = displayData[displayData.length - 1];
                setLastCursor(lastItem.expense_date + '|' + lastItem.created_at);
            } else {
                setLastCursor(null);
            }

        } catch (error: any) {
            console.error("Error loading more expenses:", error);
            toast.error("Failed to load more expenses");
        } finally {
            setLoadingMore(false);
        }
    };


    const handleSaveExpense = async () => {
        if (!amount || !category || !date) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            if (configured) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                // Get restaurant ID (assuming stored in metadata or separate query - simplifying here)
                // For now, simpler approach: rely on RLS or just insert
                // But normally we need restaurant_id. 
                // Let's assume the user is linked. We'll fetch the first restaurant for now or handle via context.
                // Re-using logic from other components:
                const { data: restaurant } = await supabase.from('restaurants').select('id').single();

                const { error } = await supabase.from('expenses').insert({
                    restaurant_id: restaurant?.id, // May be null if not found, RLS might handle
                    category,
                    amount: parseFloat(amount),
                    description,
                    expense_date: date
                });

                if (error) throw error;
                toast.success("Expense saved");
                fetchData(); // Refresh list
            } else {
                toast.success("Expense saved (Demo Mode)");
                // Add to local state for demo
                const newExp = {
                    id: Date.now(),
                    date,
                    category,
                    amount: parseFloat(amount),
                    description
                };
                const newExpenses = [newExp, ...expenses];
                setExpenses(newExpenses);
                const newTotalExp = totalExpenses + parseFloat(amount);
                setTotalExpenses(newTotalExp);
                // Update global store
                useExpenseStats.getState().setStats(totalRevenue, newTotalExp);
            }

            // Reset form
            setAmount("");
            setDescription("");
            setCategory("");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to save expense");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;

        try {
            if (configured) {
                const supabase = createClient();
                const { error } = await supabase.from('expenses').delete().eq('id', id);
                if (error) throw error;
                fetchData();
            } else {
                // Demo mode
                const exp = expenses.find(e => e.id === id);
                if (exp) {
                    const newTotalExp = totalExpenses - Number(exp.amount);
                    setTotalExpenses(newTotalExp);
                    setExpenses(expenses.filter(e => e.id !== id));
                    // Update global store
                    useExpenseStats.getState().setStats(totalRevenue, newTotalExp);
                }
            }
            toast.success("Expense deleted");
        } catch (error: any) {
            toast.error("Failed to delete");
        }
    };

    const handleEdit = (expense: any) => {
        setEditingId(expense.id);
        setEditForm({
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            expense_date: expense.expense_date || expense.date
        });
    };

    const handleSaveEdit = async () => {
        if (!editForm.amount || !editForm.category || !editForm.expense_date) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            if (configured) {
                const supabase = createClient();
                const { error } = await supabase
                    .from('expenses')
                    .update({
                        amount: parseFloat(editForm.amount),
                        category: editForm.category,
                        description: editForm.description,
                        expense_date: editForm.expense_date
                    })
                    .eq('id', editingId);

                if (error) throw error;
                fetchData();
            } else {
                // Demo mode
                setExpenses(expenses.map(e =>
                    e.id === editingId
                        ? { ...e, ...editForm, amount: parseFloat(editForm.amount) }
                        : e
                ));
            }
            toast.success("Expense updated successfully");
            setEditingId(null);
            setEditForm({});
        } catch (error: any) {
            toast.error("Failed to update expense: " + error.message);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    // Monthly Stats
    const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

    useEffect(() => {
        fetchMonthlyStats();
    }, [configured]);

    const fetchMonthlyStats = async () => {
        // Calculate last 12 months range
        const today = new Date();
        const stats = [];

        const supabase = createClient();
        const { data: { user } = { user: null } } = await supabase.auth.getUser();

        // If not configured or no user, generate demo data
        if (!configured || !user) {
            for (let i = 0; i < 12; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const isProfit = Math.random() > 0.3;
                stats.push({
                    label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
                    profit: isProfit ? Math.floor(Math.random() * 10000) : -Math.floor(Math.random() * 5000),
                    isProfit
                });
            }
            setMonthlyStats(stats);
            return;
        }

        try {
            // Real Data Calculation for 12 months
            const layoutStart = new Date(today.getFullYear(), today.getMonth() - 11, 1); // 11 months ago start
            const layoutEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Current month end

            const startStr = layoutStart.toISOString().split("T")[0];
            const endStr = layoutEnd.toISOString().split("T")[0];

            // Fetch Expenses
            const { data: expData } = await supabase
                .from('expenses')
                .select('amount, expense_date')
                .gte('expense_date', startStr)
                .lte('expense_date', endStr);

            // Fetch Revenue
            const { data: revData } = await supabase
                .from('orders')
                .select('total, created_at')
                .gte('created_at', `${startStr}T00:00:00`)
                .lte('created_at', `${endStr}T23:59:59`);

            // Group by Month
            for (let i = 0; i < 12; i++) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthKey = d.toISOString().slice(0, 7); // YYYY-MM

                // Filter
                const monthExps = (expData || []).filter(e => e.expense_date.startsWith(monthKey));
                const monthRevs = (revData || []).filter(r => r.created_at.startsWith(monthKey));

                const totalExp = monthExps.reduce((sum, e) => sum + Number(e.amount), 0);
                const totalRev = monthRevs.reduce((sum, r) => sum + Number(r.total), 0);
                const net = totalRev - totalExp;

                stats.push({
                    label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
                    profit: net,
                    isProfit: net >= 0
                });
            }
            setMonthlyStats(stats);
        } catch (e) {
            console.error("Error fetching monthly stats", e);
        }
    };

    const netProfit = totalRevenue - totalExpenses;
    const isProfit = netProfit >= 0;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full relative">
            {/* Left Content Area */}
            <div className="flex-1 space-y-6 w-full min-w-0">
                {/* Stats Cards (REMOVED - Moved to Header) */}

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left Column: Add Expense Form */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="p-5 border-t-4 border-t-primary shadow-md">
                            <div className="flex items-center gap-2 mb-4 text-primary">
                                <Plus className="h-5 w-5" />
                                <h2 className="font-semibold text-lg">Add New Expense</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-slate-50">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EXPENSE_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="pl-8 bg-slate-50 font-bold text-lg"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={date}
                                            max="9999-12-31"
                                            onChange={(e) => setDate(e.target.value)}
                                            className="bg-slate-50 pr-8"
                                        />
                                        {date && (
                                            <button
                                                type="button"
                                                onClick={() => setDate(new Date().toISOString().split("T")[0])}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
                                    <Textarea
                                        placeholder="Enter details..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-slate-50 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <Button
                                    className="w-full font-bold shadow-lg shadow-primary/20 mt-2"
                                    size="lg"
                                    onClick={handleSaveExpense}
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Save Expense"}
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Expense List */}
                    <div className="lg:col-span-8">
                        <Card className="flex flex-col h-full shadow-md border-t-4 border-t-slate-400">
                            <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Expense History
                                </h3>
                                <span className="text-xs text-muted-foreground bg-white px-2 py-1 rounded border">
                                    {expenses.length} Records
                                </span>
                            </div>

                            <div className="flex-1 overflow-auto min-h-[400px]">
                                {expenses.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                        <Wallet className="h-12 w-12 mb-3 opacity-20" />
                                        <p>No expenses found for this period.</p>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium w-20">Status</th>
                                                    <th className="px-4 py-3 font-medium">Date</th>
                                                    <th className="px-4 py-3 font-medium">Category</th>
                                                    <th className="px-4 py-3 font-medium w-1/3">Description</th>
                                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                                    <th className="px-4 py-3 font-medium text-center w-20">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {expenses.map((expense, index) => {
                                                    const isEditable = isEditableWithin72Hours(expense.created_at);
                                                    const isEditing = editingId === expense.id;

                                                    return (
                                                        <tr key={expense.id} className={`transition-colors group ${isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-500 text-xs">
                                                                        {(index + 1).toString().padStart(2, '0')}
                                                                    </span>
                                                                    <CircularCountdown createdAt={expense.created_at} />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="date"
                                                                        value={editForm.expense_date}
                                                                        onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                                                                        className="h-8 text-xs w-36"
                                                                    />
                                                                ) : (
                                                                    <span className="text-slate-600">{expense.date || expense.expense_date}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {isEditing ? (
                                                                    <Select
                                                                        value={editForm.category}
                                                                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                                                                    >
                                                                        <SelectTrigger className="h-8 text-xs w-full">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {EXPENSE_CATEGORIES.map(cat => (
                                                                                <SelectItem key={cat.value} value={cat.value}>
                                                                                    {cat.label}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize border border-slate-200">
                                                                        {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {isEditing ? (
                                                                    <Input
                                                                        value={editForm.description}
                                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                                        className="h-8 text-xs"
                                                                        placeholder="Description"
                                                                    />
                                                                ) : (
                                                                    <span className="text-slate-600">{expense.description || "-"}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="number"
                                                                        value={editForm.amount}
                                                                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                                                        className="h-8 text-xs w-28 text-right"
                                                                        placeholder="Amount"
                                                                    />
                                                                ) : (
                                                                    <span className="font-bold text-slate-700">{formatCurrency(Number(expense.amount))}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-1">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                                                                                onClick={handleSaveEdit}
                                                                                title="Save changes"
                                                                            >
                                                                                <Save className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                                                                                onClick={handleCancelEdit}
                                                                                title="Cancel"
                                                                            >
                                                                                <ArrowLeft className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    ) : isEditable ? (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                                                onClick={() => handleEdit(expense)}
                                                                                title="Edit expense"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                                onClick={() => handleDelete(expense.id)}
                                                                                title="Delete expense"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <div
                                                                                className="h-8 w-8 flex items-center justify-center text-slate-300 cursor-not-allowed"
                                                                                title="Cannot edit after 72 hours"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </div>
                                                                            <div
                                                                                className="h-8 w-8 flex items-center justify-center text-slate-300 cursor-not-allowed"
                                                                                title="Cannot delete after 72 hours"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Load More Button */}
                                        {hasMore && !loadingExpenses && expenses.length > 0 && (
                                            <div className="flex justify-center py-4 border-t">
                                                <Button
                                                    onClick={loadMoreExpenses}
                                                    disabled={loadingMore}
                                                    variant="outline"
                                                    className="min-w-[200px]"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        'Load More Expenses'
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Monthly Stats (Desktop: Vertical Sticky) */}
            <div className="w-full lg:w-48 shrink-0">
                <div className="lg:sticky lg:top-0 lg:max-h-[calc(100vh-6rem)] overflow-y-auto hover-scrollbar pr-1 pb-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2 lg:mb-4 px-1">
                        <TrendingUp className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Net P/L</span>
                    </div>

                    {monthlyStats.map((stat, idx) => (
                        <Card
                            key={idx}
                            className={`p-3 flex flex-col justify-center border-l-4 shadow-sm w-full ${stat.isProfit ? "border-l-emerald-500 bg-emerald-50/30" : "border-l-red-500 bg-red-50/30"
                                }`}
                        >
                            <span className="text-xs font-semibold text-slate-500 uppercase mb-1">{stat.label}</span>
                            <div className="flex items-center justify-between gap-2">
                                <span className={`text-lg font-bold ${stat.isProfit ? "text-emerald-700" : "text-red-700"}`}>
                                    {formatCurrency(stat.profit)}
                                </span>
                                {stat.isProfit ? (
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
