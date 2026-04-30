import { createCartItem } from '../../shared/ui/CartItem.js';
import { cart, updateCartQty } from '../../features/cart/model.js';
import { formatCurrency } from '../../shared/lib/utils.js';

export const renderCartWidget = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += (item.price * item.cartQty);
        const itemEl = createCartItem(item, updateCartQty);
        container.appendChild(itemEl);
    });

    // Update Summary in index.html (Direct DOM manipulation for now)
    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);

    // Trigger total calculation in app.js for now (Hybrid Sync)
    if (typeof window.calculateTotal === 'function') window.calculateTotal();
};
