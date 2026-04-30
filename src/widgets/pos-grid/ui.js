import { createItemCard } from '../../shared/ui/ItemCard.js';
import { inventory } from '../../entities/inventory/model.js';
import { cart, addToCart, updateCartQty } from '../../features/cart/model.js';

export const renderPOSGrid = (container, search = '') => {
    if (!container) return;
    container.innerHTML = '';

    const filtered = inventory.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) && i.quantity > 0
    );

    filtered.forEach(item => {
        const cartItem = cart.find(c => String(c.id) === String(item.id));
        const cartQty = cartItem ? cartItem.cartQty : 0;
        const card = createItemCard(item, cartQty, addToCart, updateCartQty);
        container.appendChild(card);
    });
};
