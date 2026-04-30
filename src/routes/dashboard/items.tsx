import { createSignal, createMemo, createEffect, For, Show, onMount, onCleanup } from "solid-js";
import { useItemsFilter } from "@/lib/store/items-filter-store";
import { setItemImage, removeItemImage, itemImages } from "@/lib/store/item-images-store";
import { createStore, produce } from "solid-js/store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { api, LOCAL_RESTAURANT_ID } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "solid-sonner";
import type { Item } from "@/types";
import { Search, Plus, Edit, Trash2, Save, X, ChevronUp, ChevronDown, Loader2, UtensilsCrossed, ImagePlus, XCircle } from "lucide-solid";

const DEFAULT_CATEGORIES = ["Main Course", "Starters", "Breads", "Rice", "Desserts", "Beverages", "Snacks", "Thali", "Chinese", "South Indian"];

export default function ItemsPage() {
    const [items, setItems] = createStore<Item[]>([]);
    const [restaurantId, setRestaurantId] = createSignal("demo");
    const [loading, setLoading] = createSignal(true);
    const [saving, setSaving] = createSignal(false);

    // Form state
    const [showForm, setShowForm] = createSignal(false);
    const [formMode, setFormMode] = createSignal<"add" | "edit">("add");
    const [editId, setEditId] = createSignal<string | null>(null);
    const [name, setName] = createSignal("");
    const [price, setPrice] = createSignal("");
    const [category, setCategory] = createSignal("");
    const [customCategory, setCustomCategory] = createSignal("");
    const [imageData, setImageData] = createSignal<string | null>(null);

    // Filters (shared with nav header via store)
    const { itemSearch: search, setItemSearch: setSearch, itemFilterCat: filterCat, setItemFilterCat: setFilterCat, setItemCategories, setItemCount, setItemCategoryCounts } = useItemsFilter();
    const [sortBy, setSortBy] = createSignal<"name" | "price" | "category">("name");
    const [sortDir, setSortDir] = createSignal<"asc" | "desc">("asc");

    const configured = isSupabaseConfigured();
    const supabase = configured ? createClient() : null;

    onMount(async () => {
        if (!configured) {
            setItems([
                { id: "1", name: "Butter Chicken", price: 350, category: "Main Course", is_active: true, restaurant_id: "demo", created_at: "" },
                { id: "2", name: "Paneer Tikka", price: 280, category: "Starters", is_active: true, restaurant_id: "demo", created_at: "" },
                { id: "3", name: "Dal Makhani", price: 220, category: "Main Course", is_active: true, restaurant_id: "demo", created_at: "" },
                { id: "4", name: "Naan", price: 50, category: "Breads", is_active: true, restaurant_id: "demo", created_at: "" },
                { id: "5", name: "Biryani", price: 300, category: "Rice", is_active: true, restaurant_id: "demo", created_at: "" },
                { id: "6", name: "Masala Chai", price: 40, category: "Beverages", is_active: true, restaurant_id: "demo", created_at: "" },
            ]);
            setLoading(false);
            return;
        }
        try {
            const { data: { user } } = await supabase!.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase!.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            setRestaurantId(p?.restaurant_id || "demo");

            // Fetch from Go Backend (using Supabase ID)
            const data = await api.get<Item[]>(`/items?restaurant_id=${p?.restaurant_id}`);
            setItems(data || []);
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    });

    const categories = createMemo(() => {
        const cats = ["all", ...new Set(items.map(i => i.category))];
        setItemCategories(cats);
        setItemCount(items.length);
        const counts: Record<string, number> = {};
        items.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
        setItemCategoryCounts(counts);
        return cats;
    });
    const allCategories = createMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...items.map(i => i.category)])]);

    const filtered = createMemo(() => {
        let list = [...items];
        const q = search().toLowerCase();
        if (q) list = list.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
        if (filterCat().length > 0) list = list.filter(i => filterCat().includes(i.category));
        list.sort((a, b) => {
            let cmp = 0;
            if (sortBy() === "name") cmp = a.name.localeCompare(b.name);
            else if (sortBy() === "price") cmp = a.price - b.price;
            else cmp = a.category.localeCompare(b.category);
            return sortDir() === "asc" ? cmp : -cmp;
        });
        return list;
    });

    const openAdd = () => { setFormMode("add"); setEditId(null); setName(""); setPrice(""); setCategory(""); setCustomCategory(""); setImageData(null); setShowForm(true); };
    const openEdit = (item: Item) => { setFormMode("edit"); setEditId(item.id); setName(item.name); setPrice(String(item.price)); setCategory(item.category); setCustomCategory(""); setImageData(itemImages()[item.id] || null); setShowForm(true); };

    const handleSave = async () => {
        const finalCategory = customCategory().trim() || category();
        if (!name().trim() || !price() || !finalCategory) return toast.error("Fill all fields");
        setSaving(true);
        try {
            const payload = { name: name().trim(), price: parseFloat(price()), category: finalCategory, is_active: true, restaurant_id: restaurantId() };
            if (formMode() === "add") {
                if (configured) {
                    const data = await api.post<Item>("/items", payload);
                    if (imageData()) setItemImage(data.id, imageData()!);
                    setItems([data, ...items]);
                } else {
                    const newId = Date.now().toString();
                    if (imageData()) setItemImage(newId, imageData()!);
                    setItems([{ ...payload, id: newId, created_at: new Date().toISOString() }, ...items]);
                }
                toast.success("Item added");
            } else {
                if (configured) {
                    await api.put(`/items/${editId()}`, payload);
                }
                if (imageData()) setItemImage(editId()!, imageData()!);
                else if (editId()) removeItemImage(editId()!);
                setItems(produce(s => {
                    const idx = s.findIndex(i => i.id === editId());
                    if (idx !== -1) s[idx] = { ...s[idx], ...payload };
                }));
                toast.success("Item updated");
            }
            setShowForm(false);
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item?")) return;
        try {
            if (configured) {
                await api.delete(`/items/${id}`);
            }
            setItems(items.filter(i => i.id !== id));
            toast.success("Item deleted");
        } catch (e: any) { toast.error(e.message); }
    };

    const loadBiharMenu = async () => {
        const rid = restaurantId();
        if (!rid || rid === "demo" || !/^[0-9a-f-]{36}$/i.test(rid)) {
            toast.error("Please connect to Supabase first — demo mode mein items save nahi ho sakte.");
            return;
        }
        if (!confirm("Are you sure you want to add 100 common Bihar menu items?")) return;
        setSaving(true);
        const biharItems = [
            { name: "Litti Chokha (2 Pcs)", price: 60, category: "Bihar Special" },
            { name: "Litti Mutton Curry (2 Pcs)", price: 180, category: "Bihar Special" },
            { name: "Litti Chicken Curry (2 Pcs)", price: 150, category: "Bihar Special" },
            { name: "Champaran Ahuna Mutton (Plate)", price: 280, category: "Main Course" },
            { name: "Bihari Chicken Curry", price: 180, category: "Main Course" },
            { name: "Rahu Fish Curry (Bihari Style)", price: 160, category: "Main Course" },
            { name: "Sattu Paratha with Chokha", price: 50, category: "Breakfast" },
            { name: "Dal Bhat Bhujia Chokha Thali", price: 90, category: "Thali" },
            { name: "Special Veg Thali", price: 130, category: "Thali" },
            { name: "Mutton Taash (Plate)", price: 220, category: "Starter" },
            { name: "Chicken Taash", price: 160, category: "Starter" },
            { name: "Ghugni Muri Combo", price: 40, category: "Snacks" },
            { name: "Samosa (2 Pcs)", price: 20, category: "Snacks" },
            { name: "Aloo Chop (2 Pcs)", price: 20, category: "Snacks" },
            { name: "Piyaj Pakora (Plate)", price: 40, category: "Snacks" },
            { name: "Egg Roll", price: 40, category: "Chinese" },
            { name: "Chicken Roll", price: 60, category: "Chinese" },
            { name: "Paneer Roll", price: 50, category: "Chinese" },
            { name: "Veg Chowmein (Full)", price: 70, category: "Chinese" },
            { name: "Chicken Chowmein (Full)", price: 100, category: "Chinese" },
            { name: "Veg Fried Rice", price: 80, category: "Chinese" },
            { name: "Chicken Fried Rice", price: 110, category: "Chinese" },
            { name: "Chilli Chicken (Plate)", price: 150, category: "Chinese" },
            { name: "Paneer Chilli (Plate)", price: 130, category: "Chinese" },
            { name: "Chicken Lollipop (4 Pcs)", price: 140, category: "Starter" },
            { name: "Dry Chilli Chicken", price: 160, category: "Starter" },
            { name: "Mutton Curry (Half)", price: 180, category: "Main Course" },
            { name: "Paneer Butter Masala", price: 160, category: "Main Course" },
            { name: "Kadhai Paneer", price: 170, category: "Main Course" },
            { name: "Mix Veg", price: 120, category: "Main Course" },
            { name: "Dal Tadka", price: 90, category: "Main Course" },
            { name: "Dal Fry", price: 70, category: "Main Course" },
            { name: "Jeera Rice", price: 60, category: "Main Course" },
            { name: "Plain Rice", price: 40, category: "Main Course" },
            { name: "Tawa Roti", price: 8, category: "Breads" },
            { name: "Butter Roti", price: 10, category: "Breads" },
            { name: "Sattu Sharbat", price: 25, category: "Beverages" },
            { name: "Bail Sharbat (Seasonal)", price: 30, category: "Beverages" },
            { name: "Cold Coffee", price: 50, category: "Beverages" },
            { name: "Masala Tea", price: 15, category: "Beverages" },
            { name: "Lassi (Kulhad)", price: 40, category: "Beverages" },
            { name: "Gulab Jamun (1 Pc)", price: 15, category: "Desserts" },
            { name: "Malpua (1 Pc)", price: 20, category: "Desserts" },
            { name: "Rasgulla (1 Pc)", price: 15, category: "Desserts" },
            { name: "Special Rabri (Plate)", price: 60, category: "Desserts" },
            { name: "Mutton Biryani", price: 220, category: "Main Course" },
            { name: "Chicken Biryani", price: 150, category: "Main Course" },
            { name: "Egg Salt & Pepper", price: 90, category: "Starter" },
            { name: "Crispy Corn", price: 110, category: "Starter" },
            { name: "Honey Chilli Potato", price: 120, category: "Starter" },
            { name: "Fish Fry (2 Pcs)", price: 120, category: "Starter" },
            { name: "Handi Meat (Ahuna)", price: 300, category: "Main Course" },
            { name: "Dehati Chicken Curry", price: 200, category: "Main Course" },
            { name: "Veg Manchurian", price: 110, category: "Chinese" },
            { name: "Chicken Manchurian", price: 140, category: "Chinese" },
            { name: "Garlic Chicken", price: 150, category: "Chinese" },
            { name: "Singapuri Chowmein", price: 90, category: "Chinese" },
            { name: "Hakka Noodles", price: 80, category: "Chinese" },
            { name: "Mushroom Matar", price: 150, category: "Main Course" },
            { name: "Aloo Gobhi Matar", price: 110, category: "Main Course" },
            { name: "Dum Aloo", price: 120, category: "Main Course" },
            { name: "Baigan Bharta", price: 100, category: "Main Course" },
            { name: "Yellow Dal Fry", price: 80, category: "Main Course" },
            { name: "Dal Maharani", price: 130, category: "Main Course" },
            { name: "Peas Pulao", price: 100, category: "Main Course" },
            { name: "Veg Pulao", price: 110, category: "Main Course" },
            { name: "Veg Biryani", price: 120, category: "Main Course" },
            { name: "Laccha Paratha", price: 30, category: "Breads" },
            { name: "Missi Roti", price: 25, category: "Breads" },
            { name: "Aloo Paratha", price: 40, category: "Breakfast" },
            { name: "Paneer Paratha", price: 60, category: "Breakfast" },
            { name: "Puri Sabji (4 Pcs)", price: 60, category: "Breakfast" },
            { name: "Chola Bhatura", price: 90, category: "Breakfast" },
            { name: "Kadha Prasad (Halwa)", price: 40, category: "Desserts" },
            { name: "Kheer", price: 50, category: "Desserts" },
            { name: "Boondi Raita", price: 50, category: "Sides" },
            { name: "Mix Veg Raita", price: 60, category: "Sides" },
            { name: "Green Salad", price: 30, category: "Sides" },
            { name: "Roasted Papad", price: 10, category: "Sides" },
            { name: "Fried Papad", price: 15, category: "Sides" },
            { name: "Lemon Soda", price: 35, category: "Beverages" },
            { name: "Mineral Water (1L)", price: 20, category: "Beverages" },
            { name: "Cold Drink (Glass)", price: 20, category: "Beverages" },
            { name: "Chicken Tikka (6 Pcs)", price: 180, category: "Starter" },
            { name: "Reshmi Kebab (6 Pcs)", price: 200, category: "Starter" },
            { name: "Paneer Tikka (6 Pcs)", price: 160, category: "Starter" },
            { name: "Mutton Seekh Kebab", price: 240, category: "Starter" },
            { name: "Tandoori Chicken (Half)", price: 220, category: "Starter" },
            { name: "Tandoori Chicken (Full)", price: 400, category: "Starter" },
            { name: "Chicken 65", price: 160, category: "Starter" },
            { name: "Lemon Chicken", price: 170, category: "Starter" },
            { name: "Veg Kabu", price: 100, category: "Starter" },
            { name: "Gobi 65", price: 90, category: "Starter" },
            { name: "Mushroom Chilli", price: 140, category: "Chinese" },
            { name: "Veg Momos (8 Pcs)", price: 60, category: "Snacks" },
            { name: "Chicken Momos (8 Pcs)", price: 90, category: "Snacks" },
            { name: "Fried Momos Veg", price: 80, category: "Snacks" },
            { name: "Fried Momos Chicken", price: 110, category: "Snacks" },
            { name: "Paneer Momos", price: 100, category: "Snacks" },
            { name: "American Chopsuey", price: 130, category: "Chinese" },
        ];
        try {
            let added = 0;
            for (const item of biharItems) {
                try {
                    await api.post("/items", { ...item, restaurant_id: rid, is_active: true });
                    added++;
                } catch { }
            }
            toast.success(`${added} Bihar items added successfully!`);
            const data = await api.get<Item[]>(`/items?restaurant_id=${rid}`);
            setItems(data || []);
        } catch (e: any) {
            toast.error("Error adding items: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    onMount(() => {
        const onAdd = () => openAdd();
        const onBihar = () => loadBiharMenu();
        window.addEventListener("items:openAdd", onAdd);
        window.addEventListener("items:loadBihar", onBihar);
        onCleanup(() => {
            window.removeEventListener("items:openAdd", onAdd);
            window.removeEventListener("items:loadBihar", onBihar);
        });
    });

    const toggleSort = (col: "name" | "price" | "category") => {
        if (sortBy() === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortDir("asc"); }
    };

    const SortIcon = (col: string) => sortBy() === col
        ? (sortDir() === "asc" ? <ChevronUp class="h-3 w-3" /> : <ChevronDown class="h-3 w-3" />)
        : null;

    return (
        <div class="space-y-5 animate-in fade-in duration-500">

            {/* Table */}
            <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
                <Show when={loading()}>
                    <div class="py-24 flex items-center justify-center gap-3">
                        <Loader2 class="h-6 w-6 animate-spin text-primary" />
                        <span class="text-base font-bold text-slate-600">Loading menu...</span>
                    </div>
                </Show>
                <Show when={!loading()}>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead class="bg-slate-50/50 text-base font-black uppercase tracking-widest text-slate-700 border-b border-slate-100">
                                <tr>
                                    <th class="px-4 py-4 w-12 text-center">Sr</th>
                                    <th class="px-4 py-4 w-16 text-center">Image</th>
                                    <th class="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort("name")}>
                                        <span class="flex items-center gap-1">Item Name {SortIcon("name")}</span>
                                    </th>
                                    <th class="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort("category")}>
                                        <span class="flex items-center gap-1">Category {SortIcon("category")}</span>
                                    </th>
                                    <th class="px-6 py-4 cursor-pointer hover:text-primary transition-colors text-right" onClick={() => toggleSort("price")}>
                                        <span class="flex items-center justify-end gap-1">Price {SortIcon("price")}</span>
                                    </th>
                                    <th class="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50">
                                <For each={filtered()} fallback={
                                    <tr><td colSpan={6} class="py-20 text-center">
                                        <UtensilsCrossed class="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                        <p class="text-base font-bold text-slate-600">No items found</p>
                                    </td></tr>
                                }>
                                    {(item, index) => (
                                        <tr class="hover:bg-slate-50/50 transition-colors group">
                                            <td class="px-4 py-4 text-center text-base font-bold text-slate-500">{index() + 1}</td>
                                            <td class="px-4 py-4 text-center">
                                                <Show when={itemImages()[item.id]} fallback={
                                                    <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mx-auto cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => openEdit(item)} title="Click Edit to add image">
                                                        <ImagePlus class="h-4 w-4 text-slate-400" />
                                                    </div>
                                                }>
                                                    <img src={itemImages()[item.id]} alt={item.name} class="w-10 h-10 rounded-lg object-cover mx-auto border border-slate-200" />
                                                </Show>
                                            </td>
                                            <td class="px-6 py-4 font-bold text-base text-slate-900">{item.name}</td>
                                            <td class="px-6 py-4">
                                                <span class="px-2.5 py-1 bg-slate-200 rounded-full text-base font-black uppercase text-slate-700">{item.category}</span>
                                            </td>
                                            <td class="px-6 py-4 text-right font-black text-base text-primary">{formatCurrency(item.price)}</td>
                                            <td class="px-6 py-4 text-right">
                                                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEdit(item)} class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                                                        <Edit class="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                        <Trash2 class="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </div>

            {/* Add/Edit Modal */}
            <Show when={showForm()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div class="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-6 animate-in zoom-in duration-200">
                        <div class="flex items-center justify-between">
                            <h3 class="text-xl font-black text-slate-800">{formMode() === "add" ? "Add New Item" : "Edit Item"}</h3>
                            <button onClick={() => setShowForm(false)} class="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                <X class="h-4 w-4" />
                            </button>
                        </div>

                        <div class="space-y-4">
                            <div class="space-y-1.5">
                                <label class="text-base font-black uppercase tracking-widest text-slate-700">Item Name *</label>
                                <input type="text" placeholder="e.g. Butter Chicken" class="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 font-bold outline-none focus:border-primary transition-all" value={name()} onInput={e => setName(e.currentTarget.value)} />
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-base font-black uppercase tracking-widest text-slate-700">Price (₹) *</label>
                                <input type="number" min="0" step="0.5" placeholder="0.00" class="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 font-black text-xl outline-none focus:border-primary transition-all" value={price()} onInput={e => setPrice(e.currentTarget.value)} />
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-base font-black uppercase tracking-widest text-slate-700">Category *</label>
                                <select class="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 font-bold outline-none focus:border-primary transition-all" value={category()} onChange={e => setCategory(e.currentTarget.value)}>
                                    <option value="">Select category</option>
                                    <For each={allCategories()}>{c => <option value={c}>{c}</option>}</For>
                                </select>
                                <input type="text" placeholder="Or type a new category..." class="w-full h-11 bg-slate-50 border-2 border-slate-50 rounded-xl px-4 font-bold text-sm outline-none focus:border-primary transition-all mt-2" value={customCategory()} onInput={e => setCustomCategory(e.currentTarget.value)} />
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-base font-black uppercase tracking-widest text-slate-700">Item Image (Optional)</label>
                                <Show when={imageData()} fallback={
                                    <label class="flex items-center gap-3 h-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                        <ImagePlus class="h-5 w-5 text-slate-400" />
                                        <span class="font-bold text-slate-400">Click to upload image...</span>
                                        <input type="file" accept="image/*" class="hidden" onInput={e => {
                                            const file = e.currentTarget.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = ev => setImageData(ev.target?.result as string);
                                            reader.readAsDataURL(file);
                                        }} />
                                    </label>
                                }>
                                    <div class="flex items-center gap-3">
                                        <img src={imageData()!} class="h-16 w-16 rounded-xl object-cover border border-slate-200" />
                                        <button type="button" onClick={() => setImageData(null)} class="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 transition-colors">
                                            <XCircle class="h-4 w-4" /> Remove Image
                                        </button>
                                    </div>
                                </Show>
                            </div>
                        </div>

                        <div class="flex gap-3">
                            <button onClick={() => setShowForm(false)} class="flex-1 h-12 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={handleSave} disabled={saving()} class="flex-1 h-12 bg-primary text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                <Show when={saving()} fallback={<><Save class="h-4 w-4" /> Save Item</>}>
                                    <Loader2 class="h-4 w-4 animate-spin" /> Saving...
                                </Show>
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
