import { createCartItem } from '../../shared/ui/CartItem.js';
import { cart, updateCartQty } from '../../features/cart/model.js';
import { formatCurrency } from '../../shared/lib/utils.js';

export const renderCartWidget = (containerId) => {
    // Force use of the new modern container ID
    const container = document.getElementById('cart-items-modern');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cart.length > 0) {
        // Add Header Row
        const header = document.createElement('div');
        header.className = 'cart-header-modern';
        header.innerHTML = `
            <div class="cart-col-sr">SR</div>
            <div class="cart-col-info">ITEMS</div>
            <div class="cart-col-qty">QTY.</div>
            <div class="cart-col-total">PRICE</div>
            <div class="cart-col-action"></div>
        `;
        container.appendChild(header);
    }

    let subtotal = 0;
    cart.forEach((item, index) => {
        subtotal += (item.price * item.cartQty);
        const itemEl = createCartItem(item, index, updateCartQty);
        // Ensure the item element also gets the modern class if it's created via module
        itemEl.className = 'cart-item-modern'; 
        container.appendChild(itemEl);
    });


    // Update Summary
    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);

    if (typeof window.calculateTotal === 'function') window.calculateTotal();
};

