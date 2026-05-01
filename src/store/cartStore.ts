import { createStore, produce } from "solid-js/store";
import type { Item, OrderItem } from "@/types";

interface CartState {
    items: OrderItem[];
    customerName: string;
    customerPhone: string;
    gstEnabled: boolean;
}

const STORAGE_KEY = "cart-storage";

function loadFromStorage(): Partial<CartState> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
}

const saved = typeof window !== "undefined" ? loadFromStorage() : {};

const [cart, setCart] = createStore<CartState>({
    items: saved.items || [],
    customerName: saved.customerName || "",
    customerPhone: saved.customerPhone || "",
    gstEnabled: saved.gstEnabled || false
});

function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { }
}

export function useCartStore() {
    return {
        get items() { return cart.items; },
        get customerName() { return cart.customerName; },
        get customerPhone() { return cart.customerPhone; },
        get gstEnabled() { return cart.gstEnabled; },

        addItem(item: Item) {
            setCart(produce(s => {
                const existing = s.items.find(i => i.item_id === item.id);
                if (existing) {
                    existing.quantity += 1;
                    existing.total_price = existing.quantity * existing.price;
                } else {
                    s.items.push({
                        id: crypto.randomUUID(),
                        order_id: "",
                        item_id: item.id,
                        item_name: item.name,
                        quantity: 1,
                        price: item.price,
                        total_price: item.price
                    });
                }
            }));
            persist();
        },

        removeItem(itemId: string) {
            setCart("items", s => s.filter(i => i.item_id !== itemId));
            persist();
        },

        updateQuantity(itemId: string, quantity: number) {
            setCart(produce(s => {
                const idx = s.items.findIndex(i => i.item_id === itemId);
                if (idx !== -1) {
                    const q = Math.max(0, quantity);
                    if (q === 0) s.items.splice(idx, 1);
                    else {
                        s.items[idx].quantity = q;
                        s.items[idx].total_price = q * s.items[idx].price;
                    }
                }
            }));
            persist();
        },

        clearCart() {
            setCart({ items: [], customerName: "", customerPhone: "" });
            persist();
        },

        setCustomerInfo(name: string, phone: string) {
            setCart({ customerName: name, customerPhone: phone });
            persist();
        },

        setGstEnabled(enabled: boolean) {
            setCart("gstEnabled", enabled);
            persist();
        }
    };
}
