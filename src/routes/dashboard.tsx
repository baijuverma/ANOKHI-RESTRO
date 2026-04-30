import { createSignal, Show, For, createEffect, onCleanup, ParentProps, Suspense } from "solid-js";
import { useLocation, A, useNavigate } from "@solidjs/router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useExpenseDateFilter } from "@/lib/store/expense-date-store";
import { useExpenseStats } from "@/lib/store/expense-stats-store";
import { useUIStore } from "@/lib/store/ui-store";
import { useItemsFilter } from "@/lib/store/items-filter-store";
import { cn, formatCurrency } from "@/lib/utils";
import {
    LayoutDashboard, ShoppingCart, UtensilsCrossed, History,
    BarChart3, Settings as SettingsIcon, LogOut, Store, Wallet,
    Menu, X, Plus, ChevronLeft, ChevronRight, Utensils, Search
} from "lucide-solid";

const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Billing (POS)", href: "/dashboard/pos", icon: ShoppingCart },
    { title: "Items / Menu", href: "/dashboard/items", icon: UtensilsCrossed },
    { title: "Orders History", href: "/dashboard/orders", icon: History },
    { title: "Expenses", href: "/dashboard/expenses", icon: Wallet },
    { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { title: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
];

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/pos": "Point of Sale",
    "/dashboard/items": "Menu Items",
    "/dashboard/orders": "Order History",
    "/dashboard/expenses": "Expenses",
    "/dashboard/reports": "Analytics",
    "/dashboard/settings": "Settings",
    "/dashboard/dues": "Pending Dues",
};

function Sidebar(props: { shopName: string; userEmail: string; collapsed?: boolean; hovered?: boolean; onToggle?: () => void; onHoverChange?: (h: boolean) => void; onClose?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();

    const isEffectivelyCollapsed = () => props.collapsed && !props.hovered;

    const signOut = async () => {
        try { await createClient().auth.signOut(); } catch { }
        navigate("/login");
    };

    return (
        <nav
            onMouseEnter={() => props.onHoverChange?.(true)}
            onMouseLeave={() => props.onHoverChange?.(false)}
            class={cn(
                "flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-300 relative",
                isEffectivelyCollapsed() ? "w-[80px]" : "w-[250px]"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={(e) => { e.stopPropagation(); props.onToggle?.(); }}
                class="absolute -right-3 top-20 h-6 w-6 bg-white border border-slate-200 rounded-full hidden lg:flex items-center justify-center shadow-sm z-50 hover:bg-slate-50 transition-all"
            >
                {props.collapsed ? <ChevronRight class="h-3 w-3 text-slate-600" /> : <ChevronLeft class="h-3 w-3 text-slate-600" />}
            </button>

            <div class={cn("p-6 border-b border-slate-50 flex items-center gap-3", isEffectivelyCollapsed() && "px-4 justify-center")}>
                <div class="h-9 w-9 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <Store class="h-5 w-5 text-primary-foreground" />
                </div>
                {!isEffectivelyCollapsed() && (
                    <div class="flex-1 flex flex-col min-w-0 animate-in fade-in duration-300">
                        <h1 class="text-sm font-black tracking-tight truncate text-slate-800">{props.shopName}</h1>
                        <span class="text-[10px] font-semibold text-slate-500 truncate">{props.userEmail}</span>
                    </div>
                )}
            </div>

            <ul class="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
                {navItems.map(item => (
                    <li>
                        <A
                            href={item.href}
                            onClick={props.onClose}
                            title={isEffectivelyCollapsed() ? item.title : ""}
                            end={item.href === "/dashboard"}
                            style={{ "min-width": isEffectivelyCollapsed() ? "48px" : "100%" }}
                            class={cn(
                                "flex items-center rounded-2xl transition-all group relative",
                                isEffectivelyCollapsed() ? "justify-center p-2.5 h-12 w-12 mx-auto" : "gap-3 px-4 py-2.5 text-sm font-bold",
                                location.pathname === item.href
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            )}
                        >
                            <item.icon class={cn("shrink-0 transition-transform", isEffectivelyCollapsed() ? "h-6 w-6" : "h-4 w-4")} />
                            {!isEffectivelyCollapsed() && <span class="animate-in slide-in-from-left-2 duration-300">{item.title}</span>}
                        </A>
                        {isEffectivelyCollapsed() && (
                            <div class="text-[9px] text-center font-bold text-slate-400 mt-1 truncate px-1">
                                {item.title.split(' ')[0]}
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            <div class={cn("p-4 border-t border-slate-50", isEffectivelyCollapsed() && "px-2")}>
                <button
                    onClick={signOut}
                    class={cn(
                        "flex w-full items-center transition-all rounded-2xl font-bold text-red-500 hover:bg-red-50",
                        isEffectivelyCollapsed() ? "justify-center p-2.5" : "gap-3 px-4 py-2.5 text-sm"
                    )}
                >
                    <LogOut class={cn("shrink-0", isEffectivelyCollapsed() ? "h-6 w-6" : "h-4 w-4")} />
                    {!isEffectivelyCollapsed() && <span class="animate-in fade-in duration-300">Sign Out</span>}
                </button>
            </div>
        </nav>
    );
}

export default function DashboardLayout(props: ParentProps) {
    const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed, sidebarHovered: hovered, setSidebarHovered: setHovered, isEffectivelyCollapsed } = useUIStore();
    const [mobileOpen, setMobileOpen] = createSignal(false);
    const [showItemCatDropdown, setShowItemCatDropdown] = createSignal(false);
    const [shopName, setShopName] = createSignal("Billing Tool");
    const [userEmail, setUserEmail] = createSignal("demo@restaurant.com");
    const location = useLocation();

    createEffect(() => { location.pathname; setMobileOpen(false); });
    createEffect(() => { document.body.style.overflow = mobileOpen() ? "hidden" : ""; });
    onCleanup(() => { document.body.style.overflow = ""; });

    createEffect(async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserEmail(user.email || "");
            const { data: p } = await supabase.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (p?.restaurant_id) {
                const { data: r } = await supabase.from("restaurants").select("name").eq("id", p.restaurant_id).single();
                if (r?.name) setShopName(r.name);
            }
        } catch { }
    });

    const isExpensesPage = () => location.pathname === "/dashboard/expenses";
    const isItemsPage = () => location.pathname === "/dashboard/items";
    const { itemSearch, setItemSearch, itemFilterCat, setItemFilterCat, itemCategories, itemCount, itemCategoryCounts } = useItemsFilter();

    return (
        <div class="flex h-screen bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <div
                class={cn(
                    "hidden lg:block fixed h-full z-30 shadow-xl shadow-slate-100/80 transition-all duration-300",
                    isEffectivelyCollapsed() ? "w-[80px]" : "w-[250px]"
                )}
            >
                <Sidebar
                    shopName={shopName()}
                    userEmail={userEmail()}
                    collapsed={collapsed()}
                    hovered={hovered()}
                    onToggle={() => setCollapsed(!collapsed())}
                    onHoverChange={(h) => setHovered(h)}
                />
            </div>

            {/* Mobile Overlay */}
            <Show when={mobileOpen()}>
                <div class="fixed inset-0 z-50 lg:hidden">
                    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div class="fixed inset-y-0 left-0 w-72 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
                        <button class="absolute top-4 right-4 z-10 h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center" onClick={() => setMobileOpen(false)}>
                            <X class="h-4 w-4" />
                        </button>
                        <Sidebar shopName={shopName()} userEmail={userEmail()} onClose={() => setMobileOpen(false)} />
                    </div>
                </div>
            </Show>

            <div
                class={cn(
                    "flex-1 flex flex-col min-w-0 h-full transition-all duration-300",
                    isEffectivelyCollapsed() ? "lg:ml-[80px]" : "lg:ml-[250px]"
                )}
            >
                {/* Header conditionally rendered */}
                <Show when={location.pathname !== "/dashboard/pos"}>
                    <header class="sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b bg-white px-4 sm:px-6 shadow-sm shadow-slate-100/60">
                        <button class="lg:hidden h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center" onClick={() => setMobileOpen(true)}>
                            <Menu class="h-5 w-5 text-slate-500" />
                        </button>

                        <div class="flex flex-col">
                            <span class="text-base font-black text-slate-800">
                                {pageTitles[location.pathname] || "Dashboard"}
                            </span>
                        </div>

                        <div class="hidden sm:flex items-center gap-4 ml-auto sm:pr-4 lg:pr-16 xl:pr-32 2xl:pr-48">
                            <Show when={isExpensesPage()}>
                                <ExpenseHeaderBar />
                            </Show>
                            <Show when={isItemsPage()}>
                                <div class="relative">
                                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={itemSearch()}
                                        onInput={e => setItemSearch(e.currentTarget.value)}
                                        class="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-full text-base font-bold outline-none focus:border-primary transition-all w-44"
                                    />
                                </div>
                                <div class="relative">
                                    <button
                                        onClick={() => setShowItemCatDropdown(v => !v)}
                                        class="h-8 bg-slate-50 border border-slate-200 rounded-full px-3 font-bold text-sm flex items-center gap-2 min-w-[160px] hover:border-primary transition-all outline-none"
                                    >
                                        <span class="flex-1 text-left text-slate-700">
                                            {itemFilterCat().length === 0
                                                ? "All Categories"
                                                : itemFilterCat().length === 1
                                                    ? itemFilterCat()[0]
                                                    : `${itemFilterCat().length} Selected`}
                                        </span>
                                        <span class="bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-xs font-black">
                                            {itemFilterCat().length === 0 ? itemCount() : itemFilterCat().reduce((s, c) => s + (itemCategoryCounts()[c] || 0), 0)}
                                        </span>
                                        <ChevronRight class={`h-3.5 w-3.5 text-slate-400 transition-transform ${showItemCatDropdown() ? "-rotate-90" : "rotate-90"}`} />
                                    </button>
                                    <Show when={showItemCatDropdown()}>
                                        <div class="fixed inset-0 z-40" onClick={() => setShowItemCatDropdown(false)} />
                                        <div class="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                                            <label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100">
                                                <input
                                                    type="checkbox"
                                                    checked={itemFilterCat().length === 0}
                                                    onChange={() => { setItemFilterCat([]); }}
                                                    class="h-4 w-4 rounded accent-primary cursor-pointer"
                                                />
                                                <span class="flex-1 text-sm font-bold text-slate-700">All Categories</span>
                                                <span class="text-xs font-black text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{itemCount()}</span>
                                            </label>
                                            <For each={itemCategories().filter(c => c !== "all")}>
                                                {cat => (
                                                    <label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={itemFilterCat().includes(cat)}
                                                            onChange={() => { setItemFilterCat(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]); }}
                                                            class="h-4 w-4 rounded accent-primary cursor-pointer"
                                                        />
                                                        <span class="flex-1 text-sm font-bold text-slate-700">{cat}</span>
                                                        <span class="text-xs font-black text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{itemCategoryCounts()[cat] || 0}</span>
                                                    </label>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("items:openAdd"))}
                                    class="h-8 px-4 bg-primary text-primary-foreground text-base font-black rounded-full flex items-center gap-1.5 hover:opacity-90 transition-all"
                                >
                                    <Plus class="h-3 w-3" /> Add Item
                                </button>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("items:loadBihar"))}
                                    class="h-8 px-4 bg-emerald-500 text-white text-base font-black rounded-full flex items-center gap-1.5 hover:bg-emerald-600 transition-all"
                                >
                                    <UtensilsCrossed class="h-3 w-3" /> Load Bihar Menu (100)
                                </button>
                            </Show>
                        </div>
                    </header>
                </Show>

                <main class={cn("flex-1 overflow-y-auto hover-scrollbar", location.pathname === "/dashboard/pos" ? "" : "p-3 sm:p-4 lg:p-6")}>
                    <Suspense fallback={<div class="h-32 flex items-center justify-center text-slate-400 text-sm font-bold">Loading...</div>}>
                        {props.children}
                    </Suspense>
                </main>
            </div>
        </div>
    );
}

function ExpenseHeaderBar() {
    const { startDate, endDate, setStartDate, setEndDate } = useExpenseDateFilter();
    const stats = useExpenseStats();
    const net = () => stats.totalRevenue() - stats.totalExpenses();

    return (
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                <input type="date" value={startDate()} max="9999-12-31" onInput={e => setStartDate(e.currentTarget.value)} class="w-32 h-7 px-2 text-xs font-bold bg-transparent outline-none" style={{ "color-scheme": "light" }} />
                <span class="text-slate-400">—</span>
                <input type="date" value={endDate()} max="9999-12-31" onInput={e => setEndDate(e.currentTarget.value)} class="w-32 h-7 px-2 text-xs font-bold bg-transparent outline-none" style={{ "color-scheme": "light" }} />
            </div>
            <div class="hidden xl:flex gap-2">
                {[
                    { label: "Revenue", v: stats.totalRevenue(), c: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                    { label: "Expenses", v: stats.totalExpenses(), c: "bg-red-50 text-red-700 border-red-100" },
                    { label: "Net P/L", v: net(), c: net() >= 0 ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-orange-50 text-orange-700 border-orange-100" },
                ].map(s => (
                    <div class={`px-3 py-1 border rounded-xl ${s.c}`}>
                        <div class="text-[9px] font-black uppercase tracking-wider opacity-60">{s.label}</div>
                        <div class="text-sm font-black">{formatCurrency(s.v)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
