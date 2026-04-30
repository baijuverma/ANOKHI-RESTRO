import { createItemCard } from '../../shared/ui/ItemCard.js';
import { inventory } from '../../entities/inventory/model.js';
import { cart, addToCart, updateCartQty } from '../../features/cart/model.js';

export const renderPOSGrid = (container, search = '', filterType = 'all') => {
    if (!container) return;
    container.innerHTML = '';

    const filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterType === 'all' || 
                             (filterType === 'veg' && item.itemType === 'Veg') || 
                             (filterType === 'nonveg' && item.itemType === 'Non-Veg');
        return matchesSearch && matchesFilter && item.quantity > 0;
    });

    filtered.forEach(item => {
        const cartItem = cart.find(c => String(c.id) === String(item.id));
        const cartQty = cartItem ? cartItem.cartQty : 0;
        const card = createItemCard(item, cartQty, addToCart, updateCartQty);
        container.appendChild(card);
    });
};
