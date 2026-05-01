
import { truncateName, formatCurrency } from '../../shared/utils/index.js';

export const renderProductGrid = (containerId, items, onProductClick) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<div class="no-items">No products found</div>';
        return;
    }

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card glass-panel';
        card.onclick = () => onProductClick(product);
        
        card.innerHTML = `
            <div class="product-info">
                <h4 class="product-name">${truncateName(product.name)}</h4>
                <p class="product-price">${formatCurrency(product.price)}</p>
            </div>
            <div class="product-badge ${product.itemType === 'Veg' ? 'veg' : 'nonveg'}"></div>
        `;
        container.appendChild(card);
    });
};
