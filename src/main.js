import { syncInventory } from './entities/inventory/model.js';
import { syncTables } from './entities/table/model.js';
import { addToCart, updateCartQty, cart } from './features/cart/model.js';
import { renderPOSGrid } from './widgets/pos-grid/ui.js';

// Global exports for HTML compatibility (Legacy support)
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;

window.refreshUI = () => {
    const gridContainer = document.getElementById('pos-item-grid');
    renderPOSGrid(gridContainer);
    
    // Also call legacy renders if they exist in app.js
    if (typeof window.renderCart === 'function') window.renderCart();
};

const init = async () => {
    console.log('Anokhi Restro: FSD + Atomic Refactor Initializing...');
    
    // Initial Data Sync
    await syncInventory();
    await syncTables();
    
    // Initial Render
    window.refreshUI();

    // Event Listeners
    const searchInput = document.getElementById('pos-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const gridContainer = document.getElementById('pos-item-grid');
            renderPOSGrid(gridContainer, e.target.value);
        });
    }
};

document.addEventListener('DOMContentLoaded', init);
