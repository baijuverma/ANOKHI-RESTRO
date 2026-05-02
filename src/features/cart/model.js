import { inventory, reorderInventory } from '../../entities/inventory/model.js';

export let cart = window.cart || [];

const syncWithWindow = () => {
    window.cart = cart;
    if (window.currentSelectedTable && window.updateTableCart) {
        window.updateTableCart(window.currentSelectedTable, cart);
    }
};

export const addToCart = (item) => {
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
            cart.splice(idx, 1);
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
