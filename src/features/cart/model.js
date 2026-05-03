import { inventory, reorderInventory } from '../../entities/inventory/model.js';

export let cart = window.cart || [];

const syncWithWindow = () => {
    window.cart = cart;
    if (window.currentSelectedTable && window.updateTableCart) {
        window.updateTableCart(window.currentSelectedTable, cart);
    }
};

export const addToCart = (item) => {
    // Ensure item has an ID to prevent merging with other undefined-id items
    if (!item.id) {
        item.id = `tmp-${Date.now()}-${Math.random()}`;
    }

    const existing = cart.find(c => String(c.id) === String(item.id));
    if (existing) {
        if (existing.cartQty < item.quantity) {
            existing.cartQty++;
            const idx = cart.indexOf(existing);
            cart.splice(idx, 1);
            cart.unshift(existing);
        } else {
            alert('Not enough stock!');
        }
    } else {
        cart.unshift({ ...item, cartQty: 1 });
    }

    reorderInventory(item.id);
    syncWithWindow();
    if (window.refreshUI) window.refreshUI();
};

export const updateCartQty = (id, delta) => {
    const idx = cart.findIndex(c => String(c.id) === String(id));
    if (idx > -1) {
        const item = cart[idx];
        const invItem = inventory.find(i => String(i.id) === String(id));

        item.cartQty += delta;
        if (item.cartQty <= 0) {
            const removedItem = { ...item };
            cart.splice(idx, 1);
            
            if (window.showToast) {
                window.showToast(`${removedItem.name} removed`, "success", () => {
                    cart.unshift(removedItem);
                    syncWithWindow();
                    if (window.refreshUI) window.refreshUI();
                });
            }
        } else if (invItem && item.cartQty > invItem.quantity) {
            item.cartQty = invItem.quantity;
            alert('Not enough stock!');
        }
    }
    syncWithWindow();
    if (window.refreshUI) window.refreshUI();
};

// New: Function for Escape key logic
export const reduceLastItemQty = () => {
    if (cart.length > 0) {
        const lastItem = cart[cart.length - 1];
        updateCartQty(lastItem.id, -1);
    }
};

export const setCart = (newCart) => {
    cart = [...newCart];
    syncWithWindow();
    if (window.refreshUI) window.refreshUI();
};

export const clearCart = () => {
    cart = [];
    syncWithWindow();
};
