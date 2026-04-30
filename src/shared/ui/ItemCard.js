import { formatCurrency } from '../../shared/lib/utils.js';

export const createItemCard = (item, cartQty, onAdd, onUpdateQty) => {
    const inCart = cartQty > 0;
    const bulletColor = item.itemType === 'Non-Veg' ? '#ef4444' : '#22c55e';
    
    const div = document.createElement('div');
    div.className = `pos-item-card ${inCart ? 'in-cart' : ''}`;
    
    div.innerHTML = `
        <span class="bullet" style="position:absolute; top:8px; right:8px; background:${bulletColor};"></span>
        ${inCart ? `
            <div class="pos-item-overlay">
                <button class="overlay-btn minus" onclick="event.stopPropagation(); window.updateCartQty('${item.id}', -1)">-</button>
                <div class="overlay-qty-float">${cartQty}</div>
                <button class="overlay-btn plus" onclick="event.stopPropagation(); window.updateCartQty('${item.id}', 1)">+</button>
            </div>
        ` : ''}
        <div onclick="window.addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')})">
            <span class="category">${item.category}</span>
            <h4>${item.name}</h4>
            <div class="price">
                ${formatCurrency(item.price)} 
                <span style="font-size: 13px; font-weight: 500; opacity: 0.6; margin-left: 5px;">(${item.quantity})</span>
            </div>
        </div>
    `;
    
    return div;
};
