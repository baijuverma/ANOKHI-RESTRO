import { cart, inventory, setState, db, tables } from './state.js';
import { saveDataToLocal } from './utils.js';

export function addToCart(item) {
    const existing = cart.find(c => String(c.id) == String(item.id));
    if(existing) {
        if(existing.cartQty < item.quantity) {
            existing.cartQty++;
            const cIdx = cart.indexOf(existing);
            if (cIdx > -1) { cart.splice(cIdx, 1); cart.unshift(existing); }
        } else {
            alert('Not enough stock!');
        }
    } else {
        cart.unshift({...item, cartQty: 1});
    }

    // Reorder Inventory logic
    const invIdx = inventory.findIndex(inv => String(inv.id) == String(item.id));
    if (invIdx > -1) {
        const selectedItem = inventory.splice(invIdx, 1)[0];
        inventory.unshift(selectedItem);
    }

    window.renderPOSItems(); 
    window.renderCart();
}

export function updateCartQty(id, delta) {
    const itemIndex = cart.findIndex(c => String(c.id) == String(id)); 
    if(itemIndex > -1) {
        const item = cart[itemIndex];
        const invItem = inventory.find(i => String(i.id) == String(id));
        
        item.cartQty += delta;
        if(item.cartQty <= 0) {
            cart.splice(itemIndex, 1);
        } else if (invItem && item.cartQty > invItem.quantity) {
            item.cartQty = invItem.quantity;
            alert('Not enough stock!');
        }
    }
    window.renderCart();
    setTimeout(() => { if(window.renderPOSItems) window.renderPOSItems(); }, 10);
}

export function newBill() {
    if (cart.length > 0) {
        if (!confirm('Are you sure you want to cancel?')) return;
    }
    setState.setTable(null);
    setState.setCart([]);
    window.renderCart();
    window.renderTableGrid();
    window.renderPOSItems();
}
