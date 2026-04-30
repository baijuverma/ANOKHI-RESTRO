import { createSignal, createEffect, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { Order, Restaurant } from "@/types";

export default function PrintBillPage() {
    const params = useParams<{ id: string }>();
    const [order, setOrder] = createSignal<any>(null);
    const [restaurant, setRestaurant] = createSignal<Restaurant | null>(null);
    const [items, setItems] = createSignal<any[]>([]);
    const [loading, setLoading] = createSignal(true);

    createEffect(async () => {
        const id = params.id;
        if (!id) return;

        if (!isSupabaseConfigured()) {
            setOrder({ id, bill_number: "001", customer_name: "Demo Customer", total: 1250, gst_amount: 0, gst_enabled: false, payment_mode: "cash", status: "completed", created_at: new Date().toISOString() });
            setItems([{ id: "1", item_name: "Butter Chicken", quantity: 2, price: 350, total_price: 700 }, { id: "2", item_name: "Naan", quantity: 3, price: 50, total_price: 150 }]);
            setLoading(false);
            setTimeout(() => window.print(), 600);
            return;
        }

        try {
            const supabase = createClient();
            const [{ data: orderData }, { data: itemData }] = await Promise.all([
                supabase.from("orders").select("*, restaurants(*)").eq("id", id).single(),
                supabase.from("order_items").select("*").eq("order_id", id)
            ]);
            if (orderData?.restaurants) {
                setRestaurant(orderData.restaurants as any);
            }
            setOrder(orderData);
            setItems(itemData || []);
            setTimeout(() => window.print(), 800);
        } catch { } finally { setLoading(false); }
    });

    const formatCurr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

    return (
        <div class="min-h-screen bg-white p-6 print:p-0">
            <Show when={loading()}>
                <div class="flex items-center justify-center min-h-screen">
                    <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </Show>
            <Show when={!loading() && order()}>
                <div class="max-w-sm mx-auto font-mono text-black print:m-0 print:max-w-full">
                    {/* Header */}
                    <div class="text-center border-b border-dashed border-black pb-4 mb-4">
                        <h1 class="text-xl font-black uppercase tracking-widest">{restaurant()?.name || "Restaurant"}</h1>
                        <Show when={restaurant()?.address}>
                            <p class="text-xs mt-1">{restaurant()?.address}</p>
                        </Show>
                        <Show when={restaurant()?.phone}>
                            <p class="text-xs">Ph: {restaurant()?.phone}</p>
                        </Show>
                        <Show when={restaurant()?.gst_enabled && restaurant()?.gst_number}>
                            <p class="text-xs">GSTIN: {restaurant()?.gst_number}</p>
                        </Show>
                    </div>

                    {/* Bill Info */}
                    <div class="text-xs mb-4 space-y-0.5">
                        <div class="flex justify-between">
                            <span class="font-bold">Bill #:</span>
                            <span>{order().bill_number}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="font-bold">Date:</span>
                            <span>{format(new Date(order().created_at), "dd/MM/yyyy hh:mm a")}</span>
                        </div>
                        <Show when={order().customer_name}>
                            <div class="flex justify-between">
                                <span class="font-bold">Customer:</span>
                                <span>{order().customer_name}</span>
                            </div>
                        </Show>
                        <div class="flex justify-between">
                            <span class="font-bold">Payment:</span>
                            <span class="uppercase">{order().payment_mode}</span>
                        </div>
                    </div>

                    {/* Items */}
                    <div class="border-t border-dashed border-black pt-3 mb-3">
                        <div class="text-[10px] font-black uppercase flex justify-between mb-2">
                            <span>Item</span><span class="flex gap-4"><span>Qty</span><span>Rate</span><span>Amt</span></span>
                        </div>
                        <For each={items()}>
                            {(item) => (
                                <div class="text-xs flex justify-between mb-1">
                                    <span class="flex-1 truncate">{item.item_name}</span>
                                    <span class="flex gap-4 shrink-0 pl-2">
                                        <span class="w-6 text-center">{item.quantity}</span>
                                        <span class="w-12 text-right">{formatCurr(item.price)}</span>
                                        <span class="w-14 text-right font-bold">{formatCurr(item.total_price)}</span>
                                    </span>
                                </div>
                            )}
                        </For>
                    </div>

                    {/* Totals */}
                    <div class="border-t border-dashed border-black pt-3 text-xs space-y-0.5">
                        <div class="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurr(order().subtotal || (order().total - (order().gst_amount || 0)))}</span>
                        </div>
                        <Show when={order().gst_enabled && order().gst_amount > 0}>
                            <div class="flex justify-between">
                                <span>GST</span>
                                <span>{formatCurr(order().gst_amount)}</span>
                            </div>
                        </Show>
                        <Show when={order().discount_amount > 0}>
                            <div class="flex justify-between text-green-700">
                                <span>Discount</span>
                                <span>- {formatCurr(order().discount_amount)}</span>
                            </div>
                        </Show>
                        <div class="flex justify-between font-black text-base border-t border-black pt-1 mt-1">
                            <span>TOTAL</span>
                            <span>{formatCurr(order().total)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div class="text-center mt-6 text-xs border-t border-dashed border-black pt-4">
                        <p class="font-black">Thank you! Visit Again</p>
                        <p class="text-[10px] mt-1 opacity-60">This is a computer-generated bill</p>
                    </div>
                </div>
            </Show>
        </div>
    );
}
