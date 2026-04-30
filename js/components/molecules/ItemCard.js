import { formatCurrency } from '../../core/utils.js';

export function createItemCard(item, cartItem, onAdd, onUpdateQty) {
    const inCart = !!cartItem;
    const bulletColor = item.itemType === 'Non-Veg' ? '#ef4444' : '#22c55e';
    
    const div = document.createElement('div');
    div.className = `pos-item-card ${inCart ? 'in-cart' : ''}`;
    div.setAttribute('data-id', item.id);
    
    if (!inCart) {
        div.onclick = () => onAdd(item);
    }
    
    div.innerHTML = `
        <span style="position:absolute; top:8px; right:8px; width:10px; height:10px; border-radius:50%; background:${bulletColor}; box-shadow:0 0 4px ${bulletColor}; z-index:3;"></span>
        ${inCart ? `
            <div class="pos-item-overlay">
                <button class="overlay-btn minus" onclick="event.stopPropagation(); window.updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                <div class="overlay-qty-float">${cartItem.cartQty}</div>
                <button class="overlay-btn plus" onclick="event.stopPropagation(); window.updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
        ` : ''}
        <div>
            <span class="category">${item.category}</span>
            <h4>${item.name}</h4>
        </div>
        <div>
            <div class="price">${formatCurrency(item.price)}</div>
            <div class="stock"><i class="fa-solid fa-layer-group" style="font-size: 10px;"></i> ${item.quantity} in stock</div>
        </div>
    `;
    
    return div;
}
