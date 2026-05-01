import { syncInventory } from './entities/inventory/model.js';
import { syncTables } from './entities/table/model.js';
import { getSupabase, subscribeToTable } from './shared/api/supabase.js';
import { addToCart, updateCartQty, reduceLastItemQty, cart, setCart } from './features/cart/model.js';
import { renderPOSGrid } from './widgets/pos-grid/ui.js';
import { renderCartWidget } from './widgets/cart/ui.js';
import { renderTableGrid as renderTableWidget } from './widgets/table-grid/ui.js';
import { renderOrderTypeWidget } from './widgets/order-type/ui.js';
import { setFilter, filterState } from './features/filter/model.js';
import { setOrderType, currentOrderType } from './features/order-type/model.js';
import { initKeyboardShortcuts } from './features/keyboard/model.js';
import { syncLayoutVisibility } from './features/layout/model.js';
import { renderInventoryTable } from './widgets/inventory-table/ui.js';
import { renderSalesHistory } from './widgets/sales-history/ui.js';
import { renderExpenseTable } from './widgets/expense-table/ui.js';
import { renderDashboardStats } from './widgets/dashboard-stats/ui.js';
import { initSettingsWidgets } from './widgets/settings-cards/ui.js';


import { formatCurrency, getDDMMYYYY } from './shared/lib/utils.js';

// Global exports for HTML compatibility (Legacy support)
window.formatCurrency = formatCurrency;
window.getDDMMYYYY = getDDMMYYYY;
window.addToCart = addToCart;
window.updateCartQty = updateCartQty;
window.setPOSFilter = setFilter;
window.setOrderType = setOrderType;
window.setCart = setCart;
window.initSettingsView = initSettingsWidgets;

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
    if (gridContainer) renderPOSGrid(gridContainer, search, filterState.current);
};

window.renderCart = () => {
    renderCartWidget('cart-items');
};

window.toggleCartDetails = () => {
    const cartContainer = document.querySelector('.cart-items-container');
    const detailsCurtain = document.getElementById('cart-details-curtain');
    const roundOffRow = document.getElementById('round-off-row');
    const toggleBtn = document.querySelector('.curtain-toggle');
    const icon = document.getElementById('curtain-icon');

    if (cartContainer && detailsCurtain) {
        cartContainer.classList.toggle('expanded');
        detailsCurtain.classList.toggle('hidden-details');
        
        // Forcefully hide Round Off row using master class
        if (roundOffRow) {
            if (cartContainer.classList.contains('expanded')) {
                roundOffRow.classList.add('hide-completely');
            } else {
                roundOffRow.classList.remove('hide-completely');
            }
        }

        if (toggleBtn) toggleBtn.classList.toggle('active');
        
        // Toggle icon class for rotation
        if (icon) {
            if (cartContainer.classList.contains('expanded')) {
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            } else {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            }
        }
    }
};

window.refreshUI = () => {
    const gridContainer = document.getElementById('pos-item-grid');
    const searchVal = document.getElementById('pos-search')?.value || '';
    if (gridContainer) renderPOSGrid(gridContainer, searchVal, filterState.current);
    
    // Refresh the table selection highlight if legacy exists
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();

    // Refresh Order Type Widget
    window.renderOrderType();

    // FSD Layout Sync: Handle visibility of Tables, Arrow, and Table Name
    syncLayoutVisibility(window.selectedOrderType, window.currentSelectedTable);

    // Refresh the Cart Widget
    window.renderCart();

    // -------------------------------------------------------------------------
    // SECTION-WISE MODULAR REFRESH (FSD WIDGETS)
    // -------------------------------------------------------------------------

    // 1. Refresh Inventory Section
    if (window.inventory) {
        renderInventoryTable('inventory-tbody', window.inventory);
    }

    // 2. Refresh Sales History Section
    if (window.sales) {
        renderSalesHistory('sales-tbody', window.sales);
    }

    // 3. Refresh Expenses Section
    if (window.expenses) {
        renderExpenseTable('expenses-tbody', window.expenses);
    }

    // 4. Refresh Dashboard Stats
    const totalSale = (window.sales || []).reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
    const totalExpense = (window.expenses || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalOrders = (window.sales || []).length;
    
    renderDashboardStats({ 
        totalSale: totalSale.toFixed(2), 
        totalExpense: totalExpense.toFixed(2),
        totalOrders: totalOrders
    });
};

const initRealtime = () => {
    console.log('Initializing Supabase Realtime (WebSockets)...');
    
    // 1. Sync Inventory on changes
    subscribeToTable('inventory', async () => {
        console.log('Realtime Update: Inventory');
        await syncInventory();
        window.refreshUI();
    });

    // 2. Sync Tables on changes
    subscribeToTable('tables', async () => {
        console.log('Realtime Update: Tables');
        await syncTables();
        window.refreshUI();
    });

    // 3. Sync Sales History & Expenses on changes
    ['sales_history', 'expenses'].forEach(table => {
        subscribeToTable(table, async () => {
            console.log(`Realtime Update: ${table}`);
            if (typeof window.syncFromSupabase === 'function') {
                await window.syncFromSupabase();
                window.refreshUI();
            }
        });
    });
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

    // Initialize Settings Widgets (FSD)
    initSettingsWidgets();

    // Initialize Realtime Sync (WebSockets)
    initRealtime();

    // Event Listeners for Search moved to app.js or handled via input event
};

document.addEventListener('DOMContentLoaded', init);
