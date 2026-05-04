import { formatCurrency } from '../../shared/lib/utils.js';

export const createItemCard = (item, cartQty, onAdd, onUpdateQty) => {
    const inCart = cartQty > 0;
    const isNonVeg = (item.itemType || '').toLowerCase().replace(/[- ]/g, '') === 'nonveg';
    const bulletColor = isNonVeg ? '#ef4444' : '#22c55e';
    
    const div = document.createElement('div');
    div.className = `pos-item-card ${inCart ? 'in-cart' : ''}`;
    
    div.innerHTML = `
        <span class="bullet" style="position:absolute; top:8px; right:8px; background:${bulletColor}; z-index: 15;"></span>
        ${inCart ? `
            <div class="pos-item-overlay-bottom">
                <button class="overlay-btn-small minus" data-id="${item.id}">-</button>
                <input type="number" class="overlay-qty-small-input" value="${cartQty}" min="0" data-id="${item.id}" />
                <button class="overlay-btn-small plus" data-id="${item.id}">+</button>
            </div>
        ` : ''}
        <div class="card-content">
            <div class="stock-badge-top" style="color: ${item.quantity === 0 ? '#ef4444' : (item.quantity <= (item.lowStockThreshold || 5) ? '#fbbf24' : '#22c55e')}; font-weight: 800;">STK: ${item.quantity}</div>
            <h4 class="item-name">${item.name}</h4>
            <div class="item-price">${formatCurrency(item.price)}</div>
        </div>
    `;

    // Direct Event Listeners
    if (inCart) {
        div.querySelector('.minus').onclick = (e) => { e.stopPropagation(); onUpdateQty(item.id, -1); };
        div.querySelector('.plus').onclick = (e) => { e.stopPropagation(); onUpdateQty(item.id, 1); };
        
        const qtyInput = div.querySelector('.overlay-qty-small-input');
        if (qtyInput) {
            qtyInput.onclick = (e) => e.stopPropagation(); // prevent clicking input from adding item
            qtyInput.onchange = (e) => {
                e.stopPropagation();
                const newQty = parseInt(e.target.value);
                if (!isNaN(newQty)) {
                    const delta = newQty - cartQty;
                    if (delta !== 0) onUpdateQty(item.id, delta);
                } else {
                    e.target.value = cartQty; // revert if invalid
                }
            };
            qtyInput.onkeyup = (e) => {
                if (e.key === 'Enter') qtyInput.blur();
            };
        }
    }

    // Main Card Click
    div.onclick = () => {
        if (item.quantity <= 0) {
            if (typeof window.showToast === 'function') {
                window.showToast(`"${item.name}" is out of stock!`, "error");
            } else {
                alert("Out of stock!");
            }
            return;
        }
        onAdd(item);
    };

    return div;
};
