import { createStore } from "solid-js/store";
import type { Item } from "@/types";

export interface CartItem {
    item_id: string;
    item_name: string;
    quantity: number;
    price: number;
    total_price: number;
}

interface CartState {
    items: CartItem[];
    customerName: string;
    customerPhone: string;
    gstEnabled: boolean;
}

const [cart, setCart] = createStore<CartState>({
    items: [],
    customerName: "",
    customerPhone: "",
    gstEnabled: false,
});

export function useCartStore() {
    return {
        get items() { return cart.items; },
        get customerName() { return cart.customerName; },
        get customerPhone() { return cart.customerPhone; },
        get gstEnabled() { return cart.gstEnabled; },

        setCustomerName(name: string) { setCart("customerName", name); },
        setCustomerPhone(phone: string) { setCart("customerPhone", phone); },
        setGstEnabled(enabled: boolean) { setCart("gstEnabled", enabled); },

        addItem(item: Item) {
            const existing = cart.items.find(i => i.item_id === item.id);
            if (existing) {
                setCart("items", i => i.item_id === item.id, "quantity", q => q + 1);
                setCart("items", i => i.item_id === item.id, "total_price", tp => tp + item.price);
            } else {
                setCart("items", [...cart.items, {
                    item_id: item.id,
                    item_name: item.name,
                    quantity: 1,
                    price: item.price,
                    total_price: item.price,
                }]);
            }
        },

        updateQuantity(item_id: string, quantity: number) {
            if (quantity <= 0) {
                setCart("items", cart.items.filter(i => i.item_id !== item_id));
            } else {
                const item = cart.items.find(i => i.item_id === item_id);
                if (!item) return;
                setCart("items", i => i.item_id === item_id, "quantity", quantity);
                setCart("items", i => i.item_id === item_id, "total_price", item.price * quantity);
            }
        },

        clearCart() {
            setCart({ items: [], customerName: "", customerPhone: "" });
        },
    };
}
