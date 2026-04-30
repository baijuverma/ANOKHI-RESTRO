import { createItemCard } from '../molecules/ItemCard.js';
import { inventory, cart, posTypeFilter } from '../../core/state.js';

export function renderPOSMenu(gridElement, search = '', onAdd, onUpdateQty) {
    if (!gridElement) return;
    gridElement.innerHTML = '';

    let filtered = inventory.filter(i => 
        i.name.toLowerCase().includes(search.toLowerCase()) && i.quantity > 0
    );

    // Filter by Veg/Non-Veg
    if (posTypeFilter === 'veg') filtered = filtered.filter(i => i.itemType !== 'Non-Veg');
    else if (posTypeFilter === 'nonveg') filtered = filtered.filter(i => i.itemType === 'Non-Veg');

    // Sort: In-cart items first
    filtered.sort((a, b) => {
        const aInCart = cart.some(c => String(c.id) == String(a.id)) ? 0 : 1;
        const bInCart = cart.some(c => String(c.id) == String(b.id)) ? 0 : 1;
        return aInCart - bInCart;
    });

    if (filtered.length === 0) {
        gridElement.innerHTML = '<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center;">No available items found.</p>';
        return;
    }

    filtered.forEach(item => {
        const cartItem = cart.find(c => String(c.id) == String(item.id));
        const card = createItemCard(item, cartItem, onAdd, onUpdateQty);
        gridElement.appendChild(card);
    });
}
