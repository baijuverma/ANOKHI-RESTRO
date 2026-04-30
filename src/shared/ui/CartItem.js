import { formatCurrency } from '../lib/utils.js';

export const createCartItem = (item, onUpdateQty) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
        <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>${formatCurrency(item.price)} x ${item.cartQty}</p>
        </div>
        <div class="cart-controls">
            <button class="qty-btn minus"><i class="fa-solid fa-minus"></i></button>
            <span class="cart-qty-num">${item.cartQty}</span>
            <button class="qty-btn plus"><i class="fa-solid fa-plus"></i></button>
        </div>
    `;

    // Event Listeners (Instead of inline onclick for FSD purity)
    div.querySelector('.minus').onclick = () => onUpdateQty(item.id, -1);
    div.querySelector('.plus').onclick = () => onUpdateQty(item.id, 1);

    return div;
};
