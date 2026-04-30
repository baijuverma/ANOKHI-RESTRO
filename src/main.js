import { syncInventory } from './entities/inventory/model.js';
import { syncTables } from './entities/table/model.js';
import { addToCart, updateCartQty, reduceLastItemQty, cart } from './features/cart/model.js';
import { renderPOSGrid } from './widgets/pos-grid/ui.js';
import { renderCartWidget } from './widgets/cart/ui.js';
import { renderTableGrid as renderTableWidget } from './widgets/table-grid/ui.js';
import { logout } from './features/auth/model.js';

// Global exports for HTML compatibility (Legacy support)
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.logout = logout;

window.renderTableGrid = () => {
    renderTableWidget('pos-tables-container', window.currentSelectedTable, (id) => {
        window.currentSelectedTable = id;
        if (typeof window.selectTable === 'function') {
            window.selectTable(id); // Call legacy to sync other UI parts
        } else {
            window.refreshUI();
        }
    });
};

window.renderPOSItems = (search = '') => {
    const gridContainer = document.getElementById('pos-item-grid');
    if (gridContainer) renderPOSGrid(gridContainer, search);
};

window.renderCart = () => {
    renderCartWidget('cart-items');
};

window.refreshUI = () => {
    const gridContainer = document.getElementById('pos-item-grid');
    if (gridContainer) renderPOSGrid(gridContainer);
    
    // Refresh the table selection highlight if legacy exists
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();

    // Refresh the Cart Widget
    window.renderCart();
};

const init = async () => {
    console.log('Anokhi Restro: Hybrid FSD + Atomic Refactor Active');
    
    // Initial Data Sync
    await syncInventory();
    await syncTables();
    
    // Initial Render
    window.refreshUI();

    // Global Keydown Handler for Escape logic
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (!activeModal && window.cart && window.cart.length > 0) {
                e.preventDefault();
                reduceLastItemQty(); 
            }
        }
    });

    // Event Listeners for Search
    const searchInput = document.getElementById('pos-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const gridContainer = document.getElementById('pos-item-grid');
            renderPOSGrid(gridContainer, e.target.value);
        });
    }
};

document.addEventListener('DOMContentLoaded', init);
