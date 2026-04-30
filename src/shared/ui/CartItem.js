import { formatCurrency } from '../lib/utils.js';

export const createCartItem = (item, index, onUpdateQty) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    
    const totalPrice = item.price * item.cartQty;
    
    div.innerHTML = `
        <div class="cart-col-sr">${index + 1}</div>
        <div class="cart-col-info">
            <div class="cart-item-name">${item.name.length > 10 ? item.name.substring(0, 8) + '..' : item.name}</div>
            <div class="cart-item-unit-price">${formatCurrency(item.price)} / itm</div>
        </div>
        <div class="cart-col-qty">
            <div class="qty-selector">
                <button class="qty-btn minus"><i class="fa-solid fa-minus"></i></button>
                <span class="qty-val">${item.cartQty}</span>
                <button class="qty-btn plus"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
        <div class="cart-col-total">${formatCurrency(totalPrice)}</div>
        <div class="cart-col-action">
            <button class="cart-delete-btn" title="Remove Item">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `;

    // Event Listeners
    div.querySelector('.minus').onclick = () => onUpdateQty(item.id, -1);
    div.querySelector('.plus').onclick = () => onUpdateQty(item.id, 1);
    div.querySelector('.cart-delete-btn').onclick = () => onUpdateQty(item.id, -item.cartQty);

    return div;
};

