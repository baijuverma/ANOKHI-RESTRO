import { syncInventory } from './entities/inventory/model.js';
import { syncTables } from './entities/table/model.js';
import { addToCart, updateCartQty, reduceLastItemQty, cart } from './features/cart/model.js';
import { renderPOSGrid } from './widgets/pos-grid/ui.js';
import { renderCartWidget } from './widgets/cart/ui.js';
import { renderTableGrid as renderTableWidget } from './widgets/table-grid/ui.js';
import { renderOrderTypeWidget } from './widgets/order-type/ui.js';
import { setFilter, currentFilter } from './features/filter/model.js';
import { setOrderType, currentOrderType } from './features/order-type/model.js';
import { initKeyboardShortcuts } from './features/keyboard/model.js';

// Global exports for HTML compatibility (Legacy support)
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.logout = logout;
window.setPOSFilter = setFilter;
window.setOrderType = setOrderType;

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

window.renderOrderType = () => {
    renderOrderTypeWidget('order-type-container');
};

window.toggleTablesCurtain = () => {
    const wrapper = document.getElementById('tables-curtain-area');
    const icon = document.getElementById('tables-curtain-icon');
    if (!wrapper || !icon) return;

    if (wrapper.classList.contains('tables-collapsed')) {
        wrapper.classList.remove('tables-collapsed');
        wrapper.classList.add('tables-expanded');
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    } else {
        wrapper.classList.remove('tables-expanded');
        wrapper.classList.add('tables-collapsed');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    }
};

window.renderPOSItems = (search = '') => {
    const gridContainer = document.getElementById('pos-item-grid');
    if (gridContainer) renderPOSGrid(gridContainer, search, currentFilter);
};

window.renderCart = () => {
    renderCartWidget('cart-items');
};

window.refreshUI = () => {
    const gridContainer = document.getElementById('pos-item-grid');
    const searchVal = document.getElementById('pos-search')?.value || '';
    if (gridContainer) renderPOSGrid(gridContainer, searchVal, currentFilter);
    
    // Refresh the table selection highlight if legacy exists
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();

    // Refresh Order Type Widget
    window.renderOrderType();

    // Update Table Indicator next to Total
    const tableIndicator = document.getElementById('total-table-indicator');
    if (tableIndicator) {
        if (window.currentSelectedTable) {
            // Find in global tables or fallback to ID
            const found = (window.tables || []).find(t => String(t.id) === String(window.currentSelectedTable));
            const name = found ? found.name : `Table ${window.currentSelectedTable}`;
            tableIndicator.textContent = `(${name})`;
        } else {
            tableIndicator.textContent = '';
        }
    }

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

    // Refresh UI initially
    window.refreshUI();

    // Global Timer Tick (Updates all visible table timers every second)
    setInterval(() => {
        document.querySelectorAll('.table-timer').forEach(el => {
            const start = el.getAttribute('data-start');
            if (!start) return;
            const diff = Math.floor((Date.now() - new Date(start)) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        });
    }, 1000);

    // Initialize Keyboard Shortcuts (FSD)
    initKeyboardShortcuts();

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
