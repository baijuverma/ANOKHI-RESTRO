import { createSignal, createMemo, createEffect, For, Show, onMount, onCleanup, Suspense } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useCartStore } from "@/lib/store/cart-store";
import { itemImages } from "@/lib/store/item-images-store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { api, LOCAL_RESTAURANT_ID } from "@/lib/api";
import { useUIStore } from "@/lib/store/ui-store";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "solid-sonner";
import type { Item, Restaurant } from "@/types";
import {
    Search, Trash2, Plus, Minus, Loader2, ShoppingCart, User,
    Phone, CreditCard, Printer, Send, ChevronRight, X, CheckCircle2,
    Percent, Tag, Utensils, ShoppingBag, Bike, Users, ReceiptText, Clock3, Wallet
} from "lucide-solid";

function getCategoryStyle(category: string) {
    const cat = (category || "").toLowerCase();
    if (cat.includes("start") || cat.includes("snack") || cat.includes("chaat")) return "bg-amber-50 border-amber-200 hover:bg-amber-100";
    if (cat.includes("main") || cat.includes("curry") || cat.includes("sabji")) return "bg-orange-50 border-orange-200 hover:bg-orange-100";
    if (cat.includes("bread") || cat.includes("roti") || cat.includes("naan")) return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100";
    if (cat.includes("rice") || cat.includes("biryani")) return "bg-emerald-50 border-emerald-200 hover:bg-emerald-100";
    if (cat.includes("dessert") || cat.includes("sweet")) return "bg-pink-50 border-pink-200 hover:bg-pink-100";
    if (cat.includes("bev") || cat.includes("drink") || cat.includes("chai")) return "bg-sky-50 border-sky-200 hover:bg-sky-100";
    if (cat.includes("chinese") || cat.includes("momos")) return "bg-red-50 border-red-200 hover:bg-red-100";
    return "bg-slate-50 border-slate-200 hover:bg-slate-100";
}

function getCategoryImage(name: string, category: string) {
    const text = (name + " " + category).toLowerCase();
    if (text.includes("chicken")) return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=60&w=200&auto=format&fit=crop";
    if (text.includes("mutton") || text.includes("lamb") || text.includes("meat")) return "https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?q=60&w=200&auto=format&fit=crop";
    if (text.includes("fish") || text.includes("prawn") || text.includes("seafood")) return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=60&w=200&auto=format&fit=crop";
    if (text.includes("egg")) return "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=60&w=200&auto=format&fit=crop";
    if (text.includes("biryani")) return "https://images.unsplash.com/photo-1563379091339-03b2184f4f43?q=60&w=200&auto=format&fit=crop";
    if (text.includes("dal") || text.includes("daal")) return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=60&w=200&auto=format&fit=crop";
    if (text.includes("paneer")) return "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?q=60&w=200&auto=format&fit=crop";
    if (text.includes("naan") || text.includes("roti") || text.includes("bread") || text.includes("paratha")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=60&w=200&auto=format&fit=crop";
    if (text.includes("rice") || text.includes("pulao")) return "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=60&w=200&auto=format&fit=crop";
    if (text.includes("pizza")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=60&w=200&auto=format&fit=crop";
    if (text.includes("burger")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=60&w=200&auto=format&fit=crop";
    if (text.includes("pasta") || text.includes("noodle")) return "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?q=60&w=200&auto=format&fit=crop";
    if (text.includes("soup")) return "https://images.unsplash.com/photo-1547592180-85f173990554?q=60&w=200&auto=format&fit=crop";
    if (text.includes("salad")) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=60&w=200&auto=format&fit=crop";
    if (text.includes("samosa") || text.includes("snack")) return "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=60&w=200&auto=format&fit=crop";
    if (text.includes("tikka") || text.includes("kebab") || text.includes("tandoor")) return "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=60&w=200&auto=format&fit=crop";
    if (text.includes("curry") || text.includes("masala") || text.includes("gravy")) return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=60&w=200&auto=format&fit=crop";
    if (text.includes("lassi") || text.includes("shake") || text.includes("drink") || text.includes("juice")) return "https://images.unsplash.com/photo-1571115177098-24deab4fc546?q=60&w=200&auto=format&fit=crop";
    if (text.includes("coffee") || text.includes("tea") || text.includes("chai")) return "https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?q=60&w=200&auto=format&fit=crop";
    if (text.includes("icecream") || text.includes("ice cream") || text.includes("dessert") || text.includes("sweet") || text.includes("jamun")) return "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=60&w=200&auto=format&fit=crop";
    if (text.includes("starter") || text.includes("appetizer")) return "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=60&w=200&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=60&w=200&auto=format&fit=crop";
}

function getFoodType(item: Item) {
    const text = `${item.name} ${item.category}`.toLowerCase();
    const nonVegKeywords = ["chicken", "mutton", "fish", "egg", "prawn", "meat"];
    return nonVegKeywords.some(keyword => text.includes(keyword)) ? "non_veg" : "veg";
}

export default function PosPage() {
    const { isEffectivelyCollapsed } = useUIStore();
    const [items, setItems] = createSignal<Item[]>([]);
    const [restaurant, setRestaurant] = createSignal<Restaurant | null>(null);
    const [searchQuery, setSearchQuery] = createSignal("");
    const [loading, setLoading] = createSignal(false);
    const [showCart, setShowCart] = createSignal(false);
    const [discount, setDiscount] = createSignal("");
    const [amountPaid, setAmountPaid] = createSignal("");
    const [discountType, setDiscountType] = createSignal<"amount" | "percentage">("amount");
    const [selectedCategories, setSelectedCategories] = createSignal<string[]>([]);
    const [orderType, setOrderType] = createSignal<"dine_in" | "pick_up" | "delivery">("dine_in");
    const [selectedTable, setSelectedTable] = createSignal("Table-01");
    const tableCount = () => parseInt(localStorage.getItem("pos_table_count") || "10");
    const tables = createMemo(() => Array.from({ length: tableCount() }, (_, i) => `Table-${String(i + 1).padStart(2, "0")}`));
    const [complimentary, setComplimentary] = createSignal(false);
    const [salesReturn, setSalesReturn] = createSignal(false);
    const [isPaid, setIsPaid] = createSignal(false);
    const [loyalty, setLoyalty] = createSignal(true);
    const [paymentMode, setPaymentMode] = createSignal<"cash" | "card" | "due" | "other" | "more">("cash");
    const [foodFilter, setFoodFilter] = createSignal<"all" | "veg" | "non_veg">("all");
    const [keyboardSelectedIndex, setKeyboardSelectedIndex] = createSignal<number>(0);
    const [viewportWidth, setViewportWidth] = createSignal(1280);
    const [showOrderDropdown, setShowOrderDropdown] = createSignal(false);
    const [showPhoneField, setShowPhoneField] = createSignal(false);
    const [showProfileDropdown, setShowProfileDropdown] = createSignal(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = createSignal(false);
    const [showTableDropdown, setShowTableDropdown] = createSignal(false);
    const [itemNotes, setItemNotes] = createSignal<Record<string, string>>({});
    const [selectedProfile, setSelectedProfile] = createSignal<"customer" | "group" | "receipt" | "waiter">("customer");
    let searchRef: HTMLInputElement | undefined;
    let categoryBtnRef: HTMLButtonElement | undefined;
    let suppressCartClicksUntil = 0;

    const [todayStats, setTodayStats] = createSignal({ revenue: 0, expenses: 0 });
    const cart = useCartStore();
    const navigate = useNavigate();

    onMount(async () => {
        if (!isSupabaseConfigured()) {
            // Demo items
            setItems([
                { id: "1", restaurant_id: "demo", name: "Butter Chicken", category: "Main Course", price: 280, is_active: true, created_at: "" },
                { id: "2", restaurant_id: "demo", name: "Dal Makhani", category: "Main Course", price: 180, is_active: true, created_at: "" },
                { id: "3", restaurant_id: "demo", name: "Naan", category: "Bread", price: 40, is_active: true, created_at: "" },
                { id: "4", restaurant_id: "demo", name: "Mango Lassi", category: "Beverages", price: 90, is_active: true, created_at: "" },
                { id: "5", restaurant_id: "demo", name: "Gulab Jamun", category: "Dessert", price: 80, is_active: true, created_at: "" },
                { id: "6", restaurant_id: "demo", name: "Paneer Tikka", category: "Starter", price: 220, is_active: true, created_at: "" },
                { id: "7", restaurant_id: "demo", name: "Veg Biryani", category: "Rice", price: 200, is_active: true, created_at: "" },
                { id: "8", restaurant_id: "demo", name: "Samosa", category: "Snack", price: 30, is_active: true, created_at: "" },
            ]);
            return;
        }
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) return;
            const [{ data: itemData }, { data: restData }] = await Promise.all([
                supabase.from("items").select("*").eq("restaurant_id", p.restaurant_id).eq("is_active", true).order("category").order("name"),
                supabase.from("restaurants").select("*").eq("id", p.restaurant_id).single()
            ]);
            setItems(itemData || []);
            setRestaurant(restData);

            // Fetch today's stats from local Go (for speed and offline support)
            const today = new Date().toISOString().split('T')[0];
            api.get<any>(`/stats?restaurant_id=${p.restaurant_id}&start_date=${today}&end_date=${today}`)
                .then(data => setTodayStats(data))
                .catch(() => { });
        } catch (e: any) { toast.error(e.message); }
    });

    const gridColumns = createMemo(() => {
        const width = viewportWidth();
        if (width >= 1280) return isEffectivelyCollapsed() ? 4 : 3;
        if (width >= 640) return 2;
        return 1;
    });

    const getSelectedItem = () => filteredItems()[keyboardSelectedIndex()] || null;

    const [decimalInput, setDecimalInput] = createSignal<string>("");
    const [isDecimalMode, setIsDecimalMode] = createSignal<boolean>(false);
    const [splitButtonText, setSplitButtonText] = createSignal<string>("Split");
    const [percentButtonText, setPercentButtonText] = createSignal<string>("%");
    const [editingQuantity, setEditingQuantity] = createSignal<string | null>(null);
    const [quantityInput, setQuantityInput] = createSignal<string>("");

    const setSelectedQuantity = (quantity: number) => {
        const item = getSelectedItem();
        if (!item) return;
        if (quantity <= 0) {
            cart.updateQuantity(item.id, 0);
            return;
        }
        const existingQty = cart.items.find(i => i.item_id === item.id)?.quantity || 0;
        if (existingQty === 0) cart.addItem(item);
        cart.updateQuantity(item.id, quantity);
        setDecimalInput("");
        setIsDecimalMode(false);
    };

    const startEditingQuantity = (itemId: string, currentQty: number) => {
        setEditingQuantity(itemId);
        setQuantityInput(currentQty.toString());
    };

    const finishEditingQuantity = (itemId: string) => {
        const newQty = parseFloat(quantityInput());
        if (!isNaN(newQty) && newQty > 0 && newQty <= 99.99) {
            cart.updateQuantity(itemId, newQty);
        }
        setEditingQuantity(null);
        setQuantityInput("");
    };

    const cancelEditingQuantity = () => {
        setEditingQuantity(null);
        setQuantityInput("");
    };

    const moveSelectedItem = (delta: number) => {
        const list = filteredItems();
        if (!list.length) return;
        const nextIndex = Math.min(Math.max(keyboardSelectedIndex() + delta, 0), list.length - 1);
        setKeyboardSelectedIndex(nextIndex);
    };

    // Keyboard shortcut: focus search on typing
    onMount(() => {
        setViewportWidth(window.innerWidth);

        const resizeHandler = () => setViewportWidth(window.innerWidth);
        const handler = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            // true only when a non-search input (discount, amount paid, customer name etc.) is focused
            const isOtherInputFocused = !!active && active !== searchRef && (
                active.tagName === "INPUT" ||
                active.tagName === "TEXTAREA" ||
                active.isContentEditable
            );

            if (e.key === "F1") {
                e.preventDefault();
                cart.clearCart();
                setDiscount("");
                setAmountPaid("");
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
                suppressCartClicksUntil = Date.now() + 180;

                if (isOtherInputFocused) {
                    (active as HTMLElement).blur();
                } else if (showOrderDropdown() || showProfileDropdown()) {
                    setShowOrderDropdown(false);
                    setShowProfileDropdown(false);
                } else if (searchQuery()) {
                    setSearchQuery("");
                    searchRef?.blur();
                } else if (selectedCategories().length > 0) {
                    setSelectedCategories([]);
                    setFoodFilter("all");
                } else if (cart.items.length > 0) {
                    const lastItem = cart.items[cart.items.length - 1];
                    cart.updateQuantity(lastItem.item_id, 0);
                }
            } else if (e.altKey && (e.key === "v" || e.key === "V")) {
                e.preventDefault();
                setFoodFilter(f => f === "veg" ? "all" : "veg");
            } else if (e.altKey && (e.key === "n" || e.key === "N")) {
                e.preventDefault();
                setFoodFilter(f => f === "non_veg" ? "all" : "non_veg");
            } else if (!isOtherInputFocused && (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowUp")) {
                // Arrow keys: always navigate cards, even when search box is focused
                e.preventDefault();
                if (e.key === "ArrowRight") moveSelectedItem(1);
                if (e.key === "ArrowLeft") moveSelectedItem(-1);
                if (e.key === "ArrowDown") moveSelectedItem(gridColumns());
                if (e.key === "ArrowUp") moveSelectedItem(-gridColumns());
            } else if (!isOtherInputFocused && (e.key === "+" || e.key === "=")) {
                e.preventDefault();
                const item = getSelectedItem();
                const qty = item ? cart.items.find(i => i.item_id === item.id)?.quantity || 0 : 0;
                setSelectedQuantity(qty + 1);
            } else if (!isOtherInputFocused && (e.key === "-" || e.key === "_")) {
                e.preventDefault();
                const item = getSelectedItem();
                const qty = item ? cart.items.find(i => i.item_id === item.id)?.quantity || 0 : 0;
                setSelectedQuantity(qty - 1);
            } else if (!isOtherInputFocused && (e.key === "." || e.key === ",")) {
                // Decimal point: directly set 0.5 quantity
                e.preventDefault();
                setSelectedQuantity(0.5);
            } else if (!isOtherInputFocused && isDecimalMode() && /^[0-9]$/.test(e.key)) {
                // In decimal mode: build fractional number
                e.preventDefault();
                const currentInput = decimalInput();
                if (currentInput.split(".").length <= 2) {
                    const newInput = currentInput + e.key;
                    setDecimalInput(newInput);
                    // Convert to decimal quantity (max 2 decimal places)
                    const parts = newInput.split(".");
                    if (parts.length === 2 && parts[1].length <= 2) {
                        const decimalQty = parseFloat(newInput);
                        if (decimalQty > 0 && decimalQty <= 99.99) {
                            setSelectedQuantity(decimalQty);
                        }
                    }
                }
            } else if (!isOtherInputFocused && !isDecimalMode() && /^[0-9]$/.test(e.key)) {
                // Numbers: always control selected card qty, never type into search
                e.preventDefault();
                setSelectedQuantity(Number(e.key));
            } else if (!isOtherInputFocused && e.key === "F2") {
                // F2: Edit Percent button text
                e.preventDefault();
                const newText = prompt("Enter Percent button text:", percentButtonText());
                if (newText !== null && newText.trim()) {
                    setPercentButtonText(newText.trim());
                }
            } else if (!isOtherInputFocused && e.key === "F3") {
                // F3: Start editing first cart item quantity
                e.preventDefault();
                if (cart.items.length > 0) {
                    const firstItem = cart.items[0];
                    startEditingQuantity(firstItem.item_id, firstItem.quantity);
                }
            } else if (!isOtherInputFocused && e.key === "Enter") {
                // Enter: finish editing quantity or finalize decimal mode
                e.preventDefault();
                if (editingQuantity()) {
                    finishEditingQuantity(editingQuantity()!);
                } else if (isDecimalMode()) {
                    setIsDecimalMode(false);
                    setDecimalInput("");
                }
            } else if (!isOtherInputFocused && e.key === "Escape") {
                // Escape: cancel editing quantity or decimal mode
                e.preventDefault();
                if (editingQuantity()) {
                    cancelEditingQuantity();
                } else {
                    setIsDecimalMode(false);
                    setDecimalInput("");
                }
            } else if (!isOtherInputFocused && active !== searchRef && e.key.length === 1 && /[a-zA-Z]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Alphabets only: focus search and start typing (not when Add Note or other input is focused)
                searchRef?.focus();
            }
        };
        window.addEventListener("resize", resizeHandler);
        window.addEventListener("keydown", handler);
        onCleanup(() => {
            window.removeEventListener("resize", resizeHandler);
            window.removeEventListener("keydown", handler);
        });
    });

    const categories = createMemo(() => ["All", ...new Set(items().map(i => i.category))]);

    const categoryCounts = createMemo(() => {
        const counts: Record<string, number> = {};
        items().forEach(item => { counts[item.category] = (counts[item.category] || 0) + 1; });
        return counts;
    });

    const filteredItems = createMemo(() => {
        const q = searchQuery().toLowerCase();
        const nv = ["chicken", "mutton", "fish", "egg", "prawn", "meat"];
        const filter = foodFilter();
        return items().filter(i => {
            const isNonVeg = nv.some(k => i.name.toLowerCase().includes(k));
            if (filter === "veg") {
                if (isNonVeg) return false;
                if (!cart.items.find((c: { item_id: string }) => c.item_id === i.id)) return false;
            }
            if (filter === "non_veg") {
                if (!isNonVeg) return false;
                if (!cart.items.find((c: { item_id: string }) => c.item_id === i.id)) return false;
            }
            return (selectedCategories().length === 0 || selectedCategories().includes(i.category)) &&
                (i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
        });
    });

    createEffect(() => {
        const list = filteredItems();
        if (!list.length) {
            setKeyboardSelectedIndex(0);
            return;
        }
        if (keyboardSelectedIndex() >= list.length) {
            setKeyboardSelectedIndex(0);
        }
    });

    const subtotal = createMemo(() => cart.items.reduce((s, i) => s + i.total_price, 0));
    const gstRate = createMemo(() => restaurant()?.gst_percentage || 5);
    const gstAmount = createMemo(() => cart.gstEnabled ? (subtotal() * gstRate()) / 100 : 0);
    const discountValue = createMemo(() => parseFloat(discount()) || 0);
    const discountAmount = createMemo(() =>
        discountType() === "percentage" ? ((subtotal() + gstAmount()) * discountValue() / 100) : discountValue()
    );
    const total = createMemo(() => Math.max(0, subtotal() + gstAmount() - discountAmount()));
    const changeAmount = createMemo(() => Math.max(0, (parseFloat(amountPaid()) || 0) - total()));
    const nonVegKeywords = ["chicken", "mutton", "fish", "egg", "prawn", "meat"];
    const nonVegCount = createMemo(() => cart.items.filter(i => nonVegKeywords.some(k => i.item_name.toLowerCase().includes(k))).length);
    const vegCount = createMemo(() => cart.items.filter(i => !nonVegKeywords.some(k => i.item_name.toLowerCase().includes(k))).length);
    const orderPaymentMethod = createMemo<"cash" | "card" | "upi" | "credit" | "other">(() => {
        const mode = paymentMode();
        if (mode === "cash") return "cash";
        if (mode === "card") return "card";
        if (mode === "due") return "credit";
        return "other";
    });

    const handleBill = async () => {
        if (cart.items.length === 0) return toast.error("Cart is empty");
        setLoading(true);
        try {
            if (!isSupabaseConfigured()) {
                toast.success("Demo: Bill generated!");
                cart.clearCart();
                setLoading(false);
                return;
            }
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data: p } = await supabase.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) throw new Error("No restaurant");

            const orderPayload = {
                restaurant_id: p.restaurant_id,
                customer_name: cart.customerName || null,
                customer_phone: cart.customerPhone || null,
                subtotal: subtotal(),
                gst_amount: gstAmount(),
                gst_enabled: cart.gstEnabled,
                total: total(),
                payment_method: orderPaymentMethod(),
                status: "completed",
                items: cart.items.map(i => ({
                    item_id: i.item_id, item_name: i.item_name,
                    quantity: i.quantity, price: i.price, total_price: i.total_price
                }))
            };

            const order = await api.post<any>("/orders", orderPayload);

            toast.success(`Bill generated!`);
            cart.clearCart();
            setAmountPaid("");
            setDiscount("");
            setShowCart(false);

            // Open print page (assuming order returned ID)
            window.open(`/print/bill/${order.id || order.ID}`, "_blank");
        } catch (e: any) {
            toast.error(e.message);
        } finally { setLoading(false); }
    };

    return (
        <div class="flex flex-col lg:flex-row h-screen bg-slate-50">
            {/* Item Grid — Left */}
            <div class="flex-1 flex flex-col min-w-0 p-3 lg:p-5 lg:pr-3 overflow-hidden mb-[10px]">
                {/* Search + Actions Bar */}
                <div class="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar py-1">
                    <button
                        onClick={() => navigate("/dashboard/items")}
                        class="h-9 px-4 bg-[#ff9f00] text-white font-bold rounded-[8px] shadow-sm flex items-center gap-1.5 hover:bg-[#e8900a] transition-all whitespace-nowrap shrink-0 justify-center text-sm"
                    >
                        <Plus class="h-3.5 w-3.5" /> Add Item
                    </button>

                    <div class="relative w-[130px] shrink-0">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            ref={el => searchRef = el}
                            type="text"
                            placeholder="Search..."
                            class="w-full h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-12 font-bold text-sm outline-none focus:border-primary shadow-sm"
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                        />
                        <Show when={isDecimalMode()}>
                            <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {decimalInput() || "0."}
                            </div>
                        </Show>
                    </div>

                    {/* All Categories Dropdown */}
                    <div class="shrink-0">
                        <button
                            ref={el => categoryBtnRef = el}
                            onClick={() => setShowCategoryDropdown(v => !v)}
                            class={`h-9 px-3 bg-white border rounded-[8px] flex items-center gap-2 font-bold text-sm whitespace-nowrap transition-all min-w-[150px] ${showCategoryDropdown() ? "border-primary shadow-md" : "border-slate-300 hover:border-slate-400 shadow-sm"}`}
                        >
                            <span class="flex-1 text-left text-slate-800 font-bold">
                                {selectedCategories().length === 0
                                    ? "All Categories"
                                    : selectedCategories().length === 1
                                        ? selectedCategories()[0]
                                        : `${selectedCategories().length} Selected`}
                            </span>
                            <span class="bg-slate-100 text-slate-600 rounded-md px-1.5 py-0.5 text-xs font-black min-w-[20px] text-center">
                                {selectedCategories().length === 0
                                    ? items().length
                                    : items().filter(i => selectedCategories().includes(i.category)).length}
                            </span>
                            <ChevronRight class={`h-4 w-4 text-slate-500 transition-transform duration-200 ${showCategoryDropdown() ? "-rotate-90" : "rotate-90"}`} />
                        </button>
                        <Show when={showCategoryDropdown()}>
                            <div class="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowCategoryDropdown(false); }} />
                            <div
                                class="fixed bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 min-w-[230px] max-h-[340px] overflow-y-auto py-1"
                                style={{
                                    top: `${(categoryBtnRef?.getBoundingClientRect().bottom ?? 0) + 8}px`,
                                    left: `${categoryBtnRef?.getBoundingClientRect().left ?? 0}px`
                                }}
                            >
                                {/* All Categories row */}
                                <label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 mb-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories().length === 0}
                                        onChange={() => { setSelectedCategories([]); setFoodFilter("all"); }}
                                        class="h-[18px] w-[18px] rounded accent-primary cursor-pointer"
                                    />
                                    <span class="flex-1 text-sm font-bold text-slate-800">All Categories</span>
                                    <span class="text-xs font-black text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">{items().length}</span>
                                </label>
                                <For each={categories().filter(c => c !== "All")}>
                                    {cat => (
                                        <label class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories().includes(cat)}
                                                onChange={() => {
                                                    setSelectedCategories(prev =>
                                                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                                    );
                                                }}
                                                class="h-[18px] w-[18px] rounded accent-primary cursor-pointer"
                                            />
                                            <span class="flex-1 text-sm font-bold text-slate-700">{cat}</span>
                                            <span class="text-xs font-black text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 min-w-[24px] text-center">{categoryCounts()[cat] || 0}</span>
                                        </label>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>

                    <div class="h-9 px-4 bg-white border border-slate-200 rounded-[8px] shadow-sm flex items-center shrink-0 transition-all">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black uppercase tracking-widest text-[#0f2847] leading-none">Today P/L</span>
                            <span class={cn("text-[16px] font-black", (todayStats().revenue - todayStats().expenses) >= 0 ? "text-[#00705a]" : "text-red-700")}>
                                {formatCurrency(todayStats().revenue - todayStats().expenses)}
                            </span>
                        </div>
                    </div>

                    <div class="flex-1" />
                </div>


                {/* Items Grid */}
                <div class="flex-1 overflow-y-auto hover-scrollbar px-1 pb-4">
                    <div class={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 transition-all duration-300",
                        isEffectivelyCollapsed() ? "xl:grid-cols-4" : "xl:grid-cols-3"
                    )}>
                        <For each={filteredItems()} fallback={
                            <div class="col-span-full py-16 text-center text-sm font-bold text-slate-400">No items found</div>
                        }>
                            {(item, index) => {
                                const qty = createMemo(() => cart.items.find(i => i.item_id === item.id)?.quantity || 0);
                                const isSelected = createMemo(() => keyboardSelectedIndex() === index());
                                let holdTimer: ReturnType<typeof setTimeout> | undefined;
                                return (
                                    <div
                                        onMouseEnter={() => setKeyboardSelectedIndex(index())}
                                        onClick={() => { if (qty() === 0) cart.addItem(item); }}
                                        class={`group flex flex-col rounded-[18px] p-2 transition-all border-[2px] bg-white cursor-pointer hover:shadow-lg ${isSelected() ? "border-[#7c5ce6] shadow-md shadow-[#7c5ce6]/30 ring-[2px] ring-[#7c5ce6]/40 transform scale-[0.98]" : "border-slate-200"}`}
                                        style={qty() === 0 && !isSelected() ? { "box-shadow": "0 8px 24px -4px rgba(160, 144, 193, 0.15)" } : {}}
                                    >
                                        <div class="relative w-full aspect-[5/2] overflow-hidden rounded-[14px] bg-slate-100 flex-shrink-0">
                                            <img
                                                src={itemImages()[item.id] || getCategoryImage(item.name, item.category)}
                                                alt={item.name}
                                                loading="lazy"
                                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>

                                        <div class={cn("px-2 pb-1 flex-1 flex flex-col justify-between", isEffectivelyCollapsed() ? "pt-2" : "pt-3")}>
                                            <div class="flex items-start justify-between gap-1">
                                                <h3 class={cn("font-black text-[#111111] leading-tight tracking-tight line-clamp-2 transition-all",
                                                    isEffectivelyCollapsed() ? "text-[16px] sm:text-[18px]" : "text-[19px] sm:text-[21px]"
                                                )}>
                                                    {item.name}
                                                </h3>
                                                <div class={`flex-shrink-0 mt-1 w-3.5 h-3.5 rounded-full border-2 shadow-sm ${getFoodType(item) === "veg" ? "bg-green-500 border-green-700 shadow-green-300" : "bg-red-500 border-red-700 shadow-red-300"}`} />
                                            </div>

                                            <div class={cn("flex items-center justify-between transition-all", isEffectivelyCollapsed() ? "mt-2" : "mt-4")}>
                                                <span class={cn("font-black text-[#111111] transition-all",
                                                    isEffectivelyCollapsed() ? "text-[16px] sm:text-[18px]" : "text-[18px] sm:text-[20px]"
                                                )}>
                                                    {formatCurrency(item.price)}
                                                </span>

                                                {qty() > 0 ? (() => {
                                                    const startHold = (e: Event) => {
                                                        e.stopPropagation();
                                                        holdTimer = setTimeout(() => {
                                                            holdTimer = undefined;
                                                            cart.updateQuantity(item.id, 0);
                                                        }, 300);
                                                    };

                                                    const endHold = (e: Event) => {
                                                        e.stopPropagation();
                                                        if (holdTimer) { clearTimeout(holdTimer); holdTimer = undefined; }
                                                    };

                                                    return (
                                                        <div class={`flex items-center justify-between w-[95px] h-9 px-1 py-1 rounded-full border ${getFoodType(item) === "veg" ? "bg-emerald-500 border-emerald-600" : "bg-red-500 border-red-600"}`}>
                                                            <button
                                                                onMouseDown={startHold}
                                                                onMouseUp={(e) => { endHold(e); cart.updateQuantity(item.id, qty() - 1); }}
                                                                onMouseLeave={endHold}
                                                                onTouchStart={startHold}
                                                                onTouchEnd={(e) => { endHold(e); cart.updateQuantity(item.id, qty() - 1); }}
                                                                onTouchCancel={endHold}
                                                                class="h-7 w-7 rounded-full bg-white/25 flex items-center justify-center text-white hover:bg-white/40 transition-colors select-none"
                                                            >
                                                                <Minus class="h-3.5 w-3.5" strokeWidth={3} />
                                                            </button>
                                                            <span class="flex-1 text-center text-[16px] font-bold text-white leading-none mb-px">
                                                                {qty() % 1 === 0 ? qty() : qty().toFixed(2).replace(/\.?0+$/, '')}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); cart.updateQuantity(item.id, qty() + 1); }}
                                                                class="h-7 w-7 rounded-full bg-white/25 flex items-center justify-center text-white hover:bg-white/40 transition-colors select-none"
                                                            >
                                                                <Plus class="h-3.5 w-3.5" strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    );
                                                })() : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); cart.addItem(item); }}
                                                        class="h-9 sm:h-10 px-4 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all bg-white shadow-sm flex items-center justify-center"
                                                    >
                                                        Add <Plus class="h-4 w-4 ml-1" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        </For>
                    </div>
                </div>
            </div>

            {/* Cart — Right panel */}
            <div class={`
                lg:w-[380px] xl:w-[410px] shrink-0 bg-white flex flex-col border border-slate-200 shadow-lg lg:rounded-b-[20px] lg:ml-2 mb-[10px] lg:mr-[5px]

                fixed inset-0 z-50 transition-transform duration-300 lg:relative lg:translate-x-0 lg:inset-auto
                ${showCart() ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            `}>
                <div class="border-b border-slate-200">
                    <div class="px-3 py-2 flex items-center gap-2">
                        {/* New Order */}
                        <button
                            onClick={() => { cart.clearCart(); setDiscount(""); setAmountPaid(""); }}
                            class="shrink-0 px-2.5 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[11px] flex items-center gap-1 transition-all shadow-sm"
                        >
                            New Order
                        </button>

                        {/* Fresh Order Type + Profile Dropdown */}
                        <div class="relative shrink-0">
                            <button
                                onClick={() => { setShowOrderDropdown(v => !v); setShowTableDropdown(false); }}
                                class={`h-9 px-3 rounded-[8px] flex items-center gap-1.5 text-sm font-bold transition-all shadow-sm ${showOrderDropdown() ? "bg-[#c0321a] text-white" : "bg-[#db3a24] text-white hover:bg-[#c0321a]"}`}
                            >
                                <Show when={orderType() === "dine_in"}><Utensils class="h-4 w-4" /></Show>
                                <Show when={orderType() === "pick_up"}><ShoppingBag class="h-4 w-4" /></Show>
                                <Show when={orderType() === "delivery"}><Bike class="h-4 w-4" /></Show>
                                <span>{selectedProfile() === "customer" ? "Customer" : selectedProfile() === "group" ? "Party / Group" : selectedProfile() === "receipt" ? "Receipt" : selectedProfile() === "waiter" ? "Waiter" : (orderType() === "dine_in" ? "Dine In" : orderType() === "pick_up" ? "Pick Up" : "Delvry")}</span>
                                <ChevronRight class={`h-3 w-3 ml-0.5 transition-transform ${showOrderDropdown() ? "-rotate-90" : "rotate-90"}`} />
                            </button>
                            <Show when={showOrderDropdown()}>
                                <div class="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowOrderDropdown(false); }} />
                                <div class="absolute top-full left-0 mt-1.5 bg-white border border-slate-100 rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 overflow-hidden min-w-[190px] py-1.5">
                                    {/* Order Types Section */}
                                    <div class="px-3 py-2">
                                        <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Order Type</div>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOrderType("dine_in"); setShowOrderDropdown(false); }} class={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors rounded-lg ${orderType() === "dine_in" ? "bg-[#db3a24] text-white" : "text-[#334155] hover:bg-slate-50"}`}>
                                            <Utensils class="h-4 w-4" /> Dine In
                                        </button>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOrderType("pick_up"); setShowOrderDropdown(false); }} class={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors rounded-lg ${orderType() === "pick_up" ? "bg-[#db3a24] text-white" : "text-[#334155] hover:bg-slate-50"}`}>
                                            <ShoppingBag class="h-4 w-4" /> Pick Up
                                        </button>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOrderType("delivery"); setShowOrderDropdown(false); }} class={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors rounded-lg ${orderType() === "delivery" ? "bg-[#db3a24] text-white" : "text-[#334155] hover:bg-slate-50"}`}>
                                            <Bike class="h-4 w-4" /> Delivery
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div class="h-[1px] bg-slate-200 my-2" />

                                    {/* Profile Section */}
                                    <div class="px-3 py-2">
                                        <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Profile</div>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProfile("customer"); setShowOrderDropdown(false); }} class={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors rounded-lg ${selectedProfile() === "customer" ? "bg-[#2563eb] text-white" : "text-[#334155] hover:bg-slate-50"}`}>
                                            <User class="h-4 w-4" /> Customer
                                        </button>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProfile("group"); setShowOrderDropdown(false); }} class={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors rounded-lg ${selectedProfile() === "group" ? "bg-[#2563eb] text-white" : "text-[#334155] hover:bg-slate-50"}`}>
                                            <Users class="h-4 w-4" /> Party / Group
                                        </button>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProfile("receipt"); setShowOrderDropdown(false); }} class={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors rounded-lg ${selectedProfile() === "receipt" ? "bg-[#2563eb] text-white" : "text-[#334155] hover:bg-slate-50"}`}>
                                            <ReceiptText class="h-4 w-4" /> Receipt
                                        </button>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProfile("waiter"); setShowOrderDropdown(false); }} class={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold transition-colors rounded-lg ${selectedProfile() === "waiter" ? "bg-[#2563eb] text-white" : "text-[#334155] hover:bg-slate-50"}`}>
                                            <User class="h-4 w-4" /> Waiter
                                        </button>
                                    </div>
                                </div>
                            </Show>
                        </div>

                        {/* Table No (Dine In) or Customer Name (other) — inline in top bar */}
                        <Show when={orderType() === "dine_in"}>
                            <div class="relative shrink-0">
                                <button
                                    onClick={() => { setShowTableDropdown(v => !v); setShowOrderDropdown(false); }}
                                    class={`h-9 px-3 border rounded-lg flex items-center gap-1.5 text-sm font-black transition-all ${showTableDropdown() ? "border-primary bg-primary/5 text-primary" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"}`}
                                >
                                    <span>{selectedTable()}</span>
                                    <ChevronRight class={`h-3.5 w-3.5 transition-transform ${showTableDropdown() ? "rotate-[270deg]" : "rotate-90"}`} />
                                </button>
                                <Show when={showTableDropdown()}>
                                    <div class="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowTableDropdown(false); }} />
                                    <div class="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[130px] max-h-[240px] overflow-y-auto">
                                        <For each={tables()}>
                                            {(table) => (
                                                <button
                                                    onClick={() => { setSelectedTable(table); setShowTableDropdown(false); }}
                                                    class={`w-full flex items-center px-4 py-2.5 text-sm font-bold transition-all ${selectedTable() === table ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"}`}
                                                >
                                                    {table}
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                        </Show>
                        <Show when={orderType() !== "dine_in"}>
                            <div class="flex flex-col gap-1 shrink-0">
                                <div class="relative flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Customer Name"
                                        value={cart.customerName}
                                        onInput={e => cart.setCustomerName(e.currentTarget.value)}
                                        class="h-9 w-28 bg-white border border-slate-300 rounded-lg pl-2.5 pr-8 text-sm font-bold outline-none focus:border-primary transition-all"
                                    />
                                    <button
                                        onClick={() => {
                                            if (showPhoneField()) {
                                                setShowPhoneField(false);
                                                cart.setCustomerPhone("");
                                            } else {
                                                setShowPhoneField(true);
                                            }
                                        }}
                                        title={showPhoneField() ? "Hide phone" : "Add phone number"}
                                        class={`absolute right-2 transition-all duration-200 ${showPhoneField() ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"}`}
                                    >
                                        <Phone class="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div
                                    class="overflow-hidden transition-all duration-300 ease-out"
                                    style={{
                                        "max-height": showPhoneField() ? "44px" : "0px",
                                        "opacity": showPhoneField() ? "1" : "0",
                                        "transform": showPhoneField() ? "translateY(0)" : "translateY(-6px)",
                                    }}
                                >
                                    <input
                                        type="tel"
                                        placeholder="Mobile No."
                                        value={cart.customerPhone}
                                        onInput={e => cart.setCustomerPhone(e.currentTarget.value)}
                                        onBlur={() => { if (!cart.customerPhone) setShowPhoneField(false); }}
                                        class="h-9 w-28 bg-white border border-slate-300 rounded-lg px-2.5 text-sm font-bold outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </Show>

                        {/* Spacer */}
                        <div class="flex-1" />

                        {/* Veg/NonVeg counts — right */}
                        <div class="flex items-center gap-2 mr-[14px]">
                            <Show when={nonVegCount() > 0}>
                                <div
                                    onClick={() => setFoodFilter(f => f === "non_veg" ? "all" : "non_veg")}
                                    class={`shrink-0 w-8 h-8 rounded-full bg-red-400 text-white text-sm font-black flex items-center justify-center shadow-md cursor-pointer transition-all ${foodFilter() === "non_veg" ? "ring-2 ring-offset-1 ring-red-400 scale-110" : "hover:scale-105"}`}
                                >
                                    {nonVegCount()}
                                </div>
                            </Show>
                            <Show when={vegCount() > 0}>
                                <div
                                    onClick={() => setFoodFilter(f => f === "veg" ? "all" : "veg")}
                                    class={`shrink-0 w-8 h-8 rounded-full bg-green-500 text-white text-sm font-black flex items-center justify-center shadow-md cursor-pointer transition-all ${foodFilter() === "veg" ? "ring-2 ring-offset-1 ring-green-500 scale-110" : "hover:scale-105"}`}
                                >
                                    {vegCount()}
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>

                <div class="flex-1 flex flex-col min-h-0">
                    <div class="grid grid-cols-[32px_1fr_96px_84px_76px] items-center gap-2 px-2 py-3 border-b border-slate-200 bg-[#fbf8f5]">
                        <div class="text-[11px] font-black uppercase tracking-widest text-[#5e6a7e] text-center">Sr</div>
                        <div class="text-[11px] font-black uppercase tracking-widest text-[#5e6a7e] ml-1">Items</div>
                        <div class="text-[11px] font-black uppercase tracking-widest text-[#5e6a7e] text-center">Custom</div>
                        <div class="text-[11px] font-black uppercase tracking-widest text-[#5e6a7e] text-center">Qty.</div>
                        <div class="text-[11px] font-black uppercase tracking-widest text-[#5e6a7e] text-right pr-2">Price</div>
                    </div>

                    <div class="flex-1 overflow-y-auto bg-white">
                        <Show when={cart.items.length === 0} fallback={
                            <For each={cart.items}>
                                {(item, index) => (
                                    <div class="grid grid-cols-[32px_1fr_96px_84px_76px] items-center gap-2 px-2 py-3 border-b border-slate-100 group">
                                        <div class="text-sm font-black text-slate-500 text-center">{index() + 1}</div>
                                        <div class="min-w-0 ml-px">
                                            <p class="font-bold text-slate-800 text-sm leading-tight truncate">{item.item_name}</p>
                                            <p class="text-[11px] text-slate-400 font-semibold mt-0.5">{formatCurrency(item.price)} / itm</p>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Add Note"
                                            value={itemNotes()[item.item_id] || ""}
                                            onInput={e => setItemNotes(n => ({ ...n, [item.item_id]: e.currentTarget.value }))}
                                            class="h-8 w-full rounded-md border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 placeholder:text-slate-400 px-2 outline-none focus:border-primary transition-all"
                                        />
                                        <div class="flex items-center justify-between px-1 rounded-md border border-slate-200 bg-white h-8 w-full hover:border-slate-300 transition-colors">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (Date.now() < suppressCartClicksUntil) return; cart.updateQuantity(item.item_id, item.quantity - 1); }}
                                                class="h-6 w-6 shrink-0 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                            >
                                                <Minus class="h-3.5 w-3.5" strokeWidth={2.5} />
                                            </button>
                                            <Show when={editingQuantity() === item.item_id} fallback={
                                                <span
                                                    class="text-sm font-black text-slate-900 flex-1 text-center cursor-pointer hover:bg-slate-50 rounded select-none"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditingQuantity(item.item_id, item.quantity); }}
                                                    title="Click to edit quantity (F3)"
                                                >
                                                    {(() => {
                                                        const q = cart.items.find(i => i.item_id === item.item_id)?.quantity || 0;
                                                        return q % 1 === 0 ? q : q.toFixed(2).replace(/\.?0+$/, '');
                                                    })()}
                                                </span>
                                            }>
                                                <input
                                                    type="text"
                                                    value={quantityInput()}
                                                    onInput={e => setQuantityInput(e.currentTarget.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") {
                                                            finishEditingQuantity(item.item_id);
                                                        } else if (e.key === "Escape") {
                                                            cancelEditingQuantity();
                                                        }
                                                    }}
                                                    onBlur={() => finishEditingQuantity(item.item_id)}
                                                    class="flex-1 w-full text-sm font-black text-slate-900 text-center outline-none bg-transparent"
                                                    ref={el => el?.focus()}
                                                />
                                            </Show>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (Date.now() < suppressCartClicksUntil) return; cart.updateQuantity(item.item_id, item.quantity + 1); }}
                                                class="h-6 w-6 shrink-0 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                            >
                                                <Plus class="h-3.5 w-3.5" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                        <div class="flex items-center justify-between gap-1 overflow-visible">
                                            <span class="text-[13px] font-black text-slate-900 tracking-tight">{formatCurrency(item.total_price)}</span>
                                            <button tabIndex={-1} onClick={(e) => { if (Date.now() < suppressCartClicksUntil || e.detail === 0) return; cart.updateQuantity(item.item_id, 0); }} class="h-7 w-7 shrink-0 rounded-md hover:bg-red-50 text-red-500 hover:text-red-600 flex items-center justify-center transition-colors">
                                                <Trash2 class="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        }>
                            <div class="h-full flex flex-col items-center justify-center text-center px-6">
                                <p class="text-[30px] text-slate-300 leading-none">No items added yet</p>
                                <p class="text-base text-slate-400 mt-1">Tap menu items to add</p>
                            </div>
                        </Show>
                    </div>

                    <div class="border-t border-slate-200 bg-white">
                        <div class="h-10 flex items-center justify-center border-b border-slate-200 text-slate-500">
                            <ChevronRight class="h-5 w-5 -rotate-90" />
                        </div>
                    </div>
                </div>

                <div class="border-t border-slate-200 bg-[#faf8f6]">
                    <div class="px-3 py-2 flex items-center gap-2 border-b border-slate-200">
                        <button class="shrink-0 h-7 px-3 rounded-md bg-[#ef4b2f] text-white text-xs font-black shadow-sm">{splitButtonText()}</button>
                        <label class="flex items-center gap-1 text-xs text-slate-700 font-medium whitespace-nowrap">
                            <input type="checkbox" checked={complimentary()} onChange={e => setComplimentary(e.currentTarget.checked)} class="h-3.5 w-3.5 rounded border-slate-300 accent-[#ef4b2f]" />
                            Comp.
                        </label>
                        <label class="flex items-center gap-1 text-xs text-slate-700 font-medium whitespace-nowrap">
                            <input type="checkbox" checked={salesReturn()} onChange={e => setSalesReturn(e.currentTarget.checked)} class="h-3.5 w-3.5 rounded border-slate-300 accent-[#ef4b2f]" />
                            S.Return
                        </label>
                        <button class="shrink-0 h-7 w-7 rounded-md bg-red-50 text-[#ef4b2f] flex items-center justify-center text-xs font-bold">
                            {percentButtonText()}
                        </button>
                        <div class="ml-auto flex items-center gap-1.5">
                            <span class="text-sm font-black text-slate-500 uppercase tracking-wide">Total</span>
                            <span class="text-2xl font-black text-slate-950 leading-none">{Math.round(total())}</span>
                        </div>
                    </div>

                    <div class="px-3 py-2 border-b border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar">
                        {[
                            { key: "cash", label: "Cash", icon: Wallet },
                            { key: "card", label: "Card", icon: CreditCard },
                            { key: "due", label: "Due", icon: Clock3 },
                            { key: "other", label: "Other", icon: ReceiptText },
                            { key: "more", label: "More", icon: ChevronRight }
                        ].map(option => (
                            <button
                                onClick={() => setPaymentMode(option.key as "cash" | "card" | "due" | "other" | "more")}
                                class={`shrink-0 h-8 px-3 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${paymentMode() === option.key ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                            >
                                <option.icon class="h-3.5 w-3.5" />
                                {option.label}
                                <Show when={paymentMode() === option.key && option.key === "cash"}>
                                    <span class="h-2 w-2 rounded-full bg-emerald-500" />
                                </Show>
                            </button>
                        ))}
                    </div>

                    <div class="px-3 py-3 flex items-center justify-center gap-6 border-b border-slate-200">
                        <label class="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={isPaid()} onChange={e => setIsPaid(e.currentTarget.checked)} class="h-4 w-4 rounded border-slate-300 accent-[#ef4b2f]" />
                            It's Paid
                        </label>
                        <label class="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={loyalty()} onChange={e => setLoyalty(e.currentTarget.checked)} class="h-4 w-4 rounded border-slate-300 accent-[#ef4b2f]" />
                            Loyalty
                        </label>
                    </div>

                    <div class="p-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        <button
                            onClick={handleBill}
                            disabled={loading() || cart.items.length === 0}
                            class="h-11 rounded-xl bg-[#2fac3d] text-white font-black text-base disabled:opacity-60"
                        >
                            <Show when={loading()} fallback={<>Save</>}>
                                <Loader2 class="h-4 w-4 animate-spin mx-auto" />
                            </Show>
                        </button>
                        <button
                            onClick={handleBill}
                            disabled={loading() || cart.items.length === 0}
                            class="h-11 rounded-xl bg-[#2fac3d] text-white font-black text-base disabled:opacity-60"
                        >
                            Save & Print
                        </button>
                        <button
                            onClick={() => {
                                if (cart.items.length === 0) {
                                    toast.error("Cart is empty");
                                    return;
                                }
                                // Generate E-Bill logic here
                                toast.success("E-Bill generated successfully!");
                            }}
                            disabled={loading() || cart.items.length === 0}
                            class="h-11 rounded-xl bg-[#2fac3d] text-white font-black text-base disabled:opacity-60"
                        >
                            Save & EBill
                        </button>
                        <button
                            onClick={() => {
                                if (cart.items.length === 0) {
                                    toast.error("Cart is empty");
                                    return;
                                }
                                // Generate KOT logic here
                                toast.success("KOT generated successfully!");
                            }}
                            disabled={loading() || cart.items.length === 0}
                            class="h-11 rounded-xl bg-[#2b140d] text-white font-black text-base disabled:opacity-60"
                        >
                            KOT
                        </button>
                        <button
                            onClick={() => {
                                if (cart.items.length === 0) {
                                    toast.error("Cart is empty");
                                    return;
                                }
                                // Generate KOT & Print logic here
                                toast.success("KOT generated and printed successfully!");
                            }}
                            disabled={loading() || cart.items.length === 0}
                            class="h-11 rounded-xl bg-[#2b140d] text-white font-black text-base disabled:opacity-60"
                        >
                            KOT & Print
                        </button>
                        <button
                            onClick={() => { cart.clearCart(); }}
                            class="h-11 rounded-xl bg-white border border-slate-300 text-slate-700 font-black text-base"
                        >
                            Hold
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile cart button */}
            <div class="lg:hidden fixed bottom-6 right-6 z-40">
                <button onClick={() => setShowCart(true)} class="h-14 w-14 bg-primary text-primary-foreground rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center relative">
                    <ShoppingCart class="h-6 w-6" />
                    <Show when={cart.items.length > 0}>
                        <span class="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                            {cart.items.length}
                        </span>
                    </Show>
                </button>
            </div>
        </div>
    );
}
