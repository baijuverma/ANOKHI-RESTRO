import { createItemCard } from '../../shared/ui/ItemCard.js';
import { inventory } from '../../entities/inventory/model.js';
import { cart, addToCart, updateCartQty } from '../../features/cart/model.js';
import { filterItems } from '../../features/filter/lib/filter-logic.js';

export const renderPOSGrid = (container, search = '', filterType = 'all') => {
    if (!container) return;
    container.innerHTML = '';

    // Use centralized robust filter logic
    const filtered = filterItems(inventory, search, filterType).filter(item => item.quantity > 0);
    console.log(`Grid Rendered: Filter=${filterType}, Search="${search}", TotalItems=${inventory.length}, FilteredItems=${filtered.length}`);

    filtered.forEach(item => {
        const cartItem = cart.find(c => String(c.id) === String(item.id));
        const cartQty = cartItem ? cartItem.cartQty : 0;
        const card = createItemCard(item, cartQty, addToCart, updateCartQty);
        container.appendChild(card);
    });
};

