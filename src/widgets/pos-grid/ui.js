import { createItemCard } from '../../shared/ui/ItemCard.js';
import { inventory } from '../../entities/inventory/model.js';
import { cart, addToCart, updateCartQty } from '../../features/cart/model.js';
import { filterItems } from '../../features/filter/lib/filter-logic.js';

export const renderPOSGrid = (container, search = '', filterType = 'all') => {
    if (!container) return;
    container.innerHTML = '';

    const currentInventory = window.inventory || inventory;
    const filtered = filterItems(currentInventory, search, filterType);

    filtered.forEach(item => {
        const currentCart = window.cart || cart;
        const cartItem = currentCart.find(c => String(c.id) === String(item.id));
        const cartQty = cartItem ? cartItem.cartQty : 0;
        const card = createItemCard(item, cartQty, addToCart, updateCartQty);
        container.appendChild(card);
    });
};
