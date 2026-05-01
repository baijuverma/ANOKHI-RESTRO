
import { formatCurrency } from '../../shared/utils/index.js';

export const updateBillingUI = (cart) => {
    const subtotalEl = document.getElementById('bill-subtotal');
    const totalEl = document.getElementById('bill-total');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
    
    if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);
    if (totalEl) totalEl.innerText = formatCurrency(Math.round(subtotal));
    
    renderCartItems(cart);
};

const renderCartItems = (cart) => {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name}</span>
            <span>x${item.cartQty}</span>
            <span>${formatCurrency(item.price * item.cartQty)}</span>
        </div>
    `).join('');
};
