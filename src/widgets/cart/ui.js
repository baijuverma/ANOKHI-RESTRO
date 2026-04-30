import { createCartItem } from '../../shared/ui/CartItem.js';
import { cart, updateCartQty } from '../../features/cart/model.js';
import { formatCurrency } from '../../shared/lib/utils.js';

export const renderCartWidget = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cart.length > 0) {
        // Add Header Row
        const header = document.createElement('div');
        header.className = 'cart-header';
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
        container.appendChild(itemEl);
    });

    // Update Summary
    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);

    if (typeof window.calculateTotal === 'function') window.calculateTotal();
};

