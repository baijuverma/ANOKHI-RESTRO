import { syncInventory } from './entities/inventory/model.js';
import { syncTables } from './entities/table/model.js';
import { addToCart, updateCartQty, reduceLastItemQty, cart } from './features/cart/model.js';
import { renderPOSGrid } from './widgets/pos-grid/ui.js';

// Global exports for HTML compatibility (Legacy support)
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;

window.refreshUI = () => {
    const gridContainer = document.getElementById('pos-item-grid');
    renderPOSGrid(gridContainer);
    
    const tableGrid = document.getElementById('pos-tables-container');
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();

    // Ensure the cart list (yellow area) refreshes
    if (typeof window.renderCart === 'function') window.renderCart();
};

const init = async () => {
    console.log('Anokhi Restro: FSD + Atomic Refactor Initializing...');
    
    // Initial Data Sync
    await syncInventory();
    await syncTables();
    
    // Initial Render
    window.refreshUI();

    // Global Keydown Handler for Escape logic
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (!activeModal && cart.length > 0) {
                e.preventDefault();
                reduceLastItemQty(); // Decrease qty one by one
            }
        }
    });

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
