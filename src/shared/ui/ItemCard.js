import { formatCurrency } from '../../shared/lib/utils.js';

export const createItemCard = (item, cartQty, onAdd, onUpdateQty) => {
    const inCart = cartQty > 0;
    const isNonVeg = (item.itemType || '').toLowerCase().replace(/[- ]/g, '') === 'nonveg';
    const bulletColor = isNonVeg ? '#ef4444' : '#22c55e';
    
    const div = document.createElement('div');
    div.className = `pos-item-card ${inCart ? 'in-cart' : ''}`;
    
    div.innerHTML = `
        <span class="bullet" style="position:absolute; top:8px; right:8px; background:${bulletColor};"></span>
        ${inCart ? `
            <div class="pos-item-overlay">
                <button class="overlay-btn minus" data-id="${item.id}">-</button>
                <div class="overlay-qty-float">${cartQty}</div>
                <button class="overlay-btn plus" data-id="${item.id}">+</button>
            </div>
        ` : ''}
        <div class="card-content">
            <div class="stock-badge-top">${item.quantity} in stock</div>
            <h4>${item.name.length > 10 ? item.name.substring(0, 8) + '..' : item.name}</h4>
            <div class="price">${formatCurrency(item.price)}</div>
        </div>
    `;

    // Direct Event Listeners
    if (inCart) {
        div.querySelector('.minus').onclick = (e) => { e.stopPropagation(); onUpdateQty(item.id, -1); };
        div.querySelector('.plus').onclick = (e) => { e.stopPropagation(); onUpdateQty(item.id, 1); };
    }

    // Main Card Click
    div.onclick = () => onAdd(item);

    return div;
};
