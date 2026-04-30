import { createSignal, createEffect, For, Show, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "solid-sonner";
import { Save, Loader2, Building2, Phone, MapPin, FileText, Percent, Printer, LayoutGrid, Eye, Trash2, Plus } from "lucide-solid";

const TEMPLATES = [
    { id: "thermal-invoice", label: "Thermal", desc: "80mm printer format" },
    { id: "professional-invoice", label: "Professional", desc: "A4 invoice format" },
    { id: "gst-invoice", label: "GST Invoice", desc: "GST tax format" },
];
const PRINTER_SIZES = ["58mm", "80mm", "A4"] as const;

export default function SettingsPage() {
    const [loading, setLoading] = createSignal(true);
    const [saving, setSaving] = createSignal(false);
    const [tableCount, setTableCount] = createSignal(parseInt(localStorage.getItem("pos_table_count") || "10"));
    const [restaurantId, setRestaurantId] = createSignal<string | null>(null);
    const [form, setForm] = createStore({
        name: "", phone: "", address: "",
        gst_number: "", gst_enabled: false, gst_percentage: 5,
        printer_size: "80mm" as "58mm" | "80mm" | "A4",
        invoice_template: "classic",
    });

    const supabase = isSupabaseConfigured() ? createClient() : null;

    const handlePreviewTemplate = (templateId: string) => {
        // Open invoice template preview in new window
        window.open(`/print/invoice-preview?template=${templateId}`, "_blank", "width=800,height=600,scrollbars=yes,resizable=yes");
    };

    const handleDeleteTemplate = (templateId: string) => {
        if (confirm(`Are you sure you want to delete this template?`)) {
            toast.error(`Template deletion not implemented yet for: ${templateId}`);
            // TODO: Implement actual template deletion logic
        }
    };

    const handleAddTemplate = () => {
        alert("Add New Template feature coming soon! You'll be able to create custom invoice templates with drag-and-drop designer.");
        // TODO: Implement add new template logic
    };

    onMount(async () => {
        if (!supabase) {
            setForm({ name: "Demo Restaurant", phone: "9876543210", address: "123 Main St, New Delhi", gst_number: "29AABCU9603R1ZJ", gst_enabled: true, gst_percentage: 18, printer_size: "80mm", invoice_template: "classic" });
            setLoading(false);
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: p } = await supabase.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
            if (!p?.restaurant_id) { setLoading(false); return; }
            setRestaurantId(p.restaurant_id);
            const { data } = await supabase.from("restaurants").select("*").eq("id", p.restaurant_id).single();
            if (data) setForm({
                name: data.name || "", phone: data.phone || "", address: data.address || "",
                gst_number: data.gst_number || "", gst_enabled: !!data.gst_enabled,
                gst_percentage: data.gst_percentage || 5, printer_size: data.printer_size || "80mm",
                invoice_template: data.invoice_template || "classic",
            });
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    });

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error("Restaurant name is required");
        setSaving(true);
        try {
            if (supabase && restaurantId()) {
                const { error } = await supabase.from("restaurants").update({
                    name: form.name, phone: form.phone, address: form.address,
                    gst_number: form.gst_number, gst_enabled: form.gst_enabled,
                    gst_percentage: form.gst_percentage, printer_size: form.printer_size,
                    invoice_template: form.invoice_template
                }).eq("id", restaurantId()!);
                if (error) throw error;
            }
            toast.success("Settings saved!");
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    return (
        <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 class="text-2xl font-black text-slate-800">Restaurant Settings</h1>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Configure your restaurant profile and billing</p>
            </div>

            <Show when={loading()}>
                <div class="py-24 flex items-center justify-center gap-3">
                    <Loader2 class="h-6 w-6 animate-spin text-primary" />
                    <span class="text-sm font-bold text-slate-400">Loading settings...</span>
                </div>
            </Show>

            <Show when={!loading()}>
                <div class="grid md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-5">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <Building2 class="h-5 w-5 text-primary" />
                            </div>
                            <h3 class="font-black text-slate-800">Basic Info</h3>
                        </div>

                        <Field label="Restaurant Name">
                            <div class="relative">
                                <Building2 class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input type="text" placeholder="My Restaurant" class="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-4 font-bold outline-none focus:border-primary transition-all" value={form.name} onInput={e => setForm("name", e.currentTarget.value)} />
                            </div>
                        </Field>

                        <Field label="Phone Number">
                            <div class="relative">
                                <Phone class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <input type="tel" placeholder="+91 98765 43210" class="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-4 font-bold outline-none focus:border-primary transition-all" value={form.phone} onInput={e => setForm("phone", e.currentTarget.value)} />
                            </div>
                        </Field>

                        <Field label="Address">
                            <div class="relative">
                                <MapPin class="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                                <textarea rows={3} placeholder="Full address..." class="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-4 py-3 font-bold text-sm outline-none focus:border-primary transition-all resize-none" value={form.address} onInput={e => setForm("address", e.currentTarget.value)} />
                            </div>
                        </Field>
                    </div>

                    {/* GST */}
                    <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-5">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="h-10 w-10 bg-green-50 rounded-2xl flex items-center justify-center">
                                <Percent class="h-5 w-5 text-green-600" />
                            </div>
                            <h3 class="font-black text-slate-800">GST Configuration</h3>
                        </div>

                        <label class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <div>
                                <p class="font-black text-slate-800 text-sm">Enable GST Billing</p>
                                <p class="text-[10px] font-bold text-slate-400 mt-0.5">Show GST on bills and reports</p>
                            </div>
                            <div
                                class={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${form.gst_enabled ? "bg-primary" : "bg-slate-300"}`}
                                onClick={() => setForm("gst_enabled", !form.gst_enabled)}
                            >
                                <div class={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.gst_enabled ? "translate-x-6" : "translate-x-1"}`} />
                            </div>
                        </label>

                        <Show when={form.gst_enabled}>
                            <Field label="GSTIN Number">
                                <div class="relative">
                                    <FileText class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <input type="text" placeholder="29AABCU9603R1ZJ" class="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-4 font-bold outline-none focus:border-primary transition-all" value={form.gst_number} onInput={e => setForm("gst_number", e.currentTarget.value)} />
                                </div>
                            </Field>

                            <Field label="GST Rate (%)">
                                <input type="number" min="0" max="28" step="0.5" class="w-full h-12 bg-slate-50 border-2 border-slate-50 rounded-2xl px-4 font-black text-xl outline-none focus:border-primary transition-all" value={form.gst_percentage} onInput={e => setForm("gst_percentage", parseFloat(e.currentTarget.value) || 5)} />
                            </Field>
                        </Show>
                    </div>
                </div>

                {/* Table Configuration */}
                <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-5">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="h-10 w-10 bg-orange-50 rounded-2xl flex items-center justify-center">
                            <LayoutGrid class="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 class="font-black text-slate-800">Table Configuration</h3>
                            <p class="text-[10px] font-bold text-slate-400">Tables shown in POS Dine In mode</p>
                        </div>
                    </div>
                    <Field label="Number of Tables">
                        <div class="flex items-center gap-4">
                            <button
                                onClick={() => { const c = Math.max(1, tableCount() - 1); setTableCount(c); localStorage.setItem("pos_table_count", String(c)); }}
                                class="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-2xl font-black text-slate-700 transition-all"
                            >
                                −
                            </button>
                            <span class="text-3xl font-black text-slate-800 w-16 text-center">{tableCount()}</span>
                            <button
                                onClick={() => { const c = Math.min(100, tableCount() + 1); setTableCount(c); localStorage.setItem("pos_table_count", String(c)); }}
                                class="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-2xl font-black text-slate-700 transition-all"
                            >
                                +
                            </button>
                        </div>
                    </Field>
                    <p class="text-xs font-bold text-slate-400">Tables will appear as Table-01, Table-02... up to Table-{String(tableCount()).padStart(2, "0")} in POS</p>
                </div>

                {/* Printer & Template */}
                <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/30 p-6 space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="h-10 w-10 bg-violet-50 rounded-2xl flex items-center justify-center">
                            <Printer class="h-5 w-5 text-violet-600" />
                        </div>
                        <h3 class="font-black text-slate-800">Print Settings</h3>
                    </div>

                    <Field label="Printer Paper Size">
                        <div class="flex gap-3">
                            <For each={PRINTER_SIZES}>
                                {size => (
                                    <button
                                        onClick={() => setForm("printer_size", size)}
                                        class={`flex-1 h-12 rounded-2xl font-black text-sm transition-all ${form.printer_size === size ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                                    >
                                        {size}
                                    </button>
                                )}
                            </For>
                        </div>
                    </Field>

                    <Field label="Invoice Template">
                        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                            {/* Thermal Template */}
                            <div class="relative group">
                                <div class="text-center mb-2">
                                    <h3 class="font-bold text-slate-700">Thermal</h3>
                                    <p class="text-xs text-slate-500">80mm printer format</p>
                                </div>
                                <div class="bg-white border-2 border-slate-200 rounded-lg shadow-lg overflow-hidden h-[250px]">
                                    <div class="bg-gray-100 p-4 h-full flex justify-center items-start">
                                        <div class="bg-white w-[60mm] p-3 font-mono text-[10px] leading-tight text-black transform scale-75">
                                            <div class="text-center mb-2">
                                                <h1 class="text-[12px] font-bold uppercase">Tasty Forks</h1>
                                                <p class="text-[8px]">123 Market Road, City</p>
                                            </div>
                                            <div class="border-t border-dashed border-black my-1"></div>
                                            <div class="flex justify-between text-[8px]">
                                                <span>Bill No: TF-1047</span>
                                                <span>Table: 07</span>
                                            </div>
                                            <div class="flex justify-between text-[8px]">
                                                <span>Date: 2026-02-06</span>
                                                <span>19:32</span>
                                            </div>
                                            <div class="border-t border-dashed border-black my-1"></div>
                                            <div class="flex font-bold text-[8px] border-b border-black pb-1">
                                                <span class="w-1/2">Item</span>
                                                <span class="w-[10%] text-right">Qty</span>
                                                <span class="w-[20%] text-right">Rate</span>
                                                <span class="w-[20%] text-right">Amt</span>
                                            </div>
                                            <div class="flex py-1 text-[8px]">
                                                <span class="w-1/2">Paneer Tikka</span>
                                                <span class="w-[10%] text-right">2</span>
                                                <span class="w-[20%] text-right">120.00</span>
                                                <span class="w-[20%] text-right font-bold">240.00</span>
                                            </div>
                                            <div class="flex justify-between text-[8px] font-bold pt-1">
                                                <span>Total:</span>
                                                <span>₹472.50</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Radio Button */}
                                <div class="absolute bottom-2 left-2 z-10">
                                    <label class="flex items-center cursor-pointer bg-white/90 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            value="thermal-invoice"
                                            checked={form.invoice_template === "thermal-invoice"}
                                            onChange={() => setForm("invoice_template", "thermal-invoice")}
                                            class="mr-2"
                                        />
                                        <span class="text-sm font-medium">Select</span>
                                    </label>
                                </div>

                                {/* View Icon - Bottom Right */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePreviewTemplate("thermal-invoice"); }}
                                    class="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 shadow-sm z-10"
                                    title="Preview Thermal Template"
                                >
                                    <Eye class="h-4 w-4 text-slate-600" />
                                </button>

                                {/* Delete Icon - Top Right */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate("thermal-invoice"); }}
                                    class="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500/90 border border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10"
                                    title="Delete Thermal Template"
                                >
                                    <Trash2 class="h-4 w-4 text-white" />
                                </button>
                            </div>

                            {/* Professional Template */}
                            <div class="relative group">
                                <div class="text-center mb-2">
                                    <h3 class="font-bold text-slate-700">Professional</h3>
                                    <p class="text-xs text-slate-500">A4 invoice format</p>
                                </div>
                                <div class="bg-white border-2 border-slate-200 rounded-lg shadow-lg overflow-hidden h-[250px]">
                                    <div class="bg-gray-100 p-4 h-full flex justify-center items-start">
                                        <div class="bg-white w-[120mm] p-3 text-gray-800 transform scale-50 origin-top">
                                            <div class="absolute top-0 left-0 w-full h-1 bg-pink-600"></div>
                                            <div class="flex justify-between items-start mb-2">
                                                <div class="flex items-center gap-1">
                                                    <div class="w-4 h-4 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded"></div>
                                                    <h1 class="text-[8px] font-bold">Instagram</h1>
                                                </div>
                                                <p class="text-[6px] font-bold uppercase text-gray-500">Tax Invoice</p>
                                            </div>
                                            <div class="grid grid-cols-2 gap-2 mb-2 text-[6px]">
                                                <div>
                                                    <p class="text-pink-600 font-bold">Bill To:</p>
                                                    <p class="font-bold">Adam Mosseri</p>
                                                </div>
                                                <div class="text-right">
                                                    <p>Invoice #: INV-001</p>
                                                    <p>Date: 10 March 2026</p>
                                                </div>
                                            </div>
                                            <table class="w-full text-left text-[6px]">
                                                <thead>
                                                    <tr class="bg-pink-600 text-white">
                                                        <th class="p-1">#</th>
                                                        <th class="p-1">Description</th>
                                                        <th class="p-1 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr class="border-b">
                                                        <td class="p-1">1</td>
                                                        <td class="p-1">Digital Marketing</td>
                                                        <td class="p-1 text-right">₹21,186</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div class="flex justify-end mt-2">
                                                <div class="text-right text-[6px]">
                                                    <div class="flex justify-between">
                                                        <span>Total:</span>
                                                        <span class="font-bold text-pink-600">₹32,899.48</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Radio Button */}
                                <div class="absolute bottom-2 left-2 z-10">
                                    <label class="flex items-center cursor-pointer bg-white/90 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            value="professional-invoice"
                                            checked={form.invoice_template === "professional-invoice"}
                                            onChange={() => setForm("invoice_template", "professional-invoice")}
                                            class="mr-2"
                                        />
                                        <span class="text-sm font-medium">Select</span>
                                    </label>
                                </div>

                                {/* View Icon - Bottom Right */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePreviewTemplate("professional-invoice"); }}
                                    class="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 shadow-sm z-10"
                                    title="Preview Professional Template"
                                >
                                    <Eye class="h-4 w-4 text-slate-600" />
                                </button>

                                {/* Delete Icon - Top Right */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate("professional-invoice"); }}
                                    class="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500/90 border border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10"
                                    title="Delete Professional Template"
                                >
                                    <Trash2 class="h-4 w-4 text-white" />
                                </button>
                            </div>

                            {/* GST Invoice Template */}
                            <div class="relative group">
                                <div class="text-center mb-2">
                                    <h3 class="font-bold text-slate-700">GST Invoice</h3>
                                    <p class="text-xs text-slate-500">GST tax format</p>
                                </div>
                                <div class="bg-white border-2 border-slate-200 rounded-lg shadow-lg overflow-hidden h-[250px]">
                                    <div class="bg-gray-100 p-4 h-full flex justify-center items-start">
                                        <div class="bg-white w-[120mm] p-3 text-gray-800 transform scale-50 origin-top">
                                            <div class="flex justify-between items-start mb-2">
                                                <div>
                                                    <h1 class="text-[8px] font-black text-gray-900 uppercase">Tax Invoice</h1>
                                                    <p class="text-[4px] text-gray-500 font-bold uppercase">Original for Recipient</p>
                                                </div>
                                                <div class="text-right">
                                                    <h2 class="text-[6px] font-bold uppercase">Aapka SaaS Business</h2>
                                                    <p class="text-[4px]">Gaya, Bihar - 823001</p>
                                                    <p class="text-[4px] font-bold">GSTIN: 10ABCCX1234Z1Z1</p>
                                                </div>
                                            </div>
                                            <div class="grid grid-cols-2 gap-2 mb-2 text-[4px]">
                                                <div>
                                                    <p>Invoice No: GST/2026/1024</p>
                                                    <p>Date: 11 March 2026</p>
                                                </div>
                                                <div class="text-right">
                                                    <p class="font-black">Ramdeep Prasad Yadav</p>
                                                    <p>GSTIN: (Unregistered)</p>
                                                </div>
                                            </div>
                                            <table class="w-full text-left text-[4px]">
                                                <thead>
                                                    <tr class="bg-gray-800 text-white">
                                                        <th class="p-1">#</th>
                                                        <th class="p-1">Description</th>
                                                        <th class="p-1">HSN</th>
                                                        <th class="p-1 text-right">Taxable</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr class="border">
                                                        <td class="p-1">1</td>
                                                        <td class="p-1">SaaS Billing Software</td>
                                                        <td class="p-1">9973</td>
                                                        <td class="p-1 text-right font-bold">11000.00</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div class="flex justify-end mt-2">
                                                <div class="text-right text-[4px]">
                                                    <div class="flex justify-between">
                                                        <span>Grand Total:</span>
                                                        <span class="font-black">₹17,700.00</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Radio Button */}
                                <div class="absolute bottom-2 left-2 z-10">
                                    <label class="flex items-center cursor-pointer bg-white/90 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                        <input
                                            type="radio"
                                            name="invoice_template"
                                            value="gst-invoice"
                                            checked={form.invoice_template === "gst-invoice"}
                                            onChange={() => setForm("invoice_template", "gst-invoice")}
                                            class="mr-2"
                                        />
                                        <span class="text-sm font-medium">Select</span>
                                    </label>
                                </div>

                                {/* View Icon - Bottom Right */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePreviewTemplate("gst-invoice"); }}
                                    class="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 shadow-sm z-10"
                                    title="Preview GST Invoice Template"
                                >
                                    <Eye class="h-4 w-4 text-slate-600" />
                                </button>

                                {/* Delete Icon - Top Right */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate("gst-invoice"); }}
                                    class="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500/90 border border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10"
                                    title="Delete GST Invoice Template"
                                >
                                    <Trash2 class="h-4 w-4 text-white" />
                                </button>
                            </div>

                            {/* Add New Template Card */}
                            <div class="relative group">
                                <div class="text-center mb-2">
                                    <h3 class="font-bold text-slate-700">Add New</h3>
                                    <p class="text-xs text-slate-500">Create template</p>
                                </div>
                                <div 
                                    onClick={handleAddTemplate}
                                    class="bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-dashed border-primary/50 rounded-lg shadow-lg overflow-hidden h-[250px] cursor-pointer hover:from-primary/20 hover:to-primary/30 hover:border-primary transition-all duration-300 flex flex-col items-center justify-center"
                                >
                                    <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                                        <Plus class="h-8 w-8 text-primary" />
                                    </div>
                                    <h4 class="font-bold text-primary text-lg mb-2">Add New Template</h4>
                                    <p class="text-xs text-primary/70 text-center px-4">Create custom invoice template with your design</p>
                                </div>
                            </div>
                        </div>
                    </Field>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving()}
                    class="w-full h-14 bg-primary text-primary-foreground font-black text-base rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <Show when={saving()} fallback={<><Save class="h-5 w-5" /> Save All Settings</>}>
                        <Loader2 class="h-5 w-5 animate-spin" /> Saving...
                    </Show>
                </button>
            </Show>
        </div>
    );
}

function Field(props: { label: string; children: any }) {
    return (
        <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{props.label}</label>
            {props.children}
        </div>
    );
}
