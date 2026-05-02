// ============================================================
// src/main.js — Module Orchestrator
// Imports and initializes all FSD layer modules in correct order
// ============================================================

// ── STEP 0: Inject HTML Shell into DOM (must happen FIRST) ───
import { appShellHTML } from './app/layout.ui.js';
document.getElementById('root').innerHTML = appShellHTML;

// ── Layer 0: App Bootstrap (State + DB must load first) ──────
import './app/store.js';                               // Global state & Supabase DB init
import { initBoot } from './app/boot.js';              // DOM setup logic
import { initSettingsWidgets }   from './widgets/settings-cards/ui.js';

// Expose early for navigation handlers
window.initSettingsView = initSettingsWidgets;
console.log('Main.js — window.initSettingsView assigned:', !!window.initSettingsView);

// ── Layer 1: Shared Utilities ────────────────────────────────
import { initCoreLogic }     from './shared/lib/core/legacy.model.js';    // formatCurrency, getDDMMYYYY, etc.
import { initSupabaseLogic } from './shared/lib/supabase/legacy.model.js'; // syncFromSupabase, saveData, setupRealtime
import './shared/lib/ui/infinite-scroll.js';                             // Reusable infinite scroll utility

// ── Layer 2: Entities (pure data/model) ─────────────────────
import { syncInventory } from './entities/inventory/model.js';
import { syncTables }    from './entities/table/model.js';

// ── Layer 3: Features (business logic) ──────────────────────
import { initAuthLogic }     from './features/auth/legacy.model.js';
import { initInventoryLogic} from './features/inventory/legacy.model.js';
import { initPosLogic }      from './features/pos/legacy.model.js';
import { initHistoryLogic }  from './features/history/legacy.model.js';
import { initExpensesLogic } from './features/expenses/model.js';
import { initSettingsLogic } from './features/settings/legacy.model.js';
import { initReceiptLogic }  from './features/receipt/legacy.model.js';
import { setFilter, filterState } from './features/filter/model.js';
import { setOrderType }      from './features/order-type/model.js';
import { syncLayoutVisibility } from './features/layout/model.js';
import { addToCart, updateCartQty, reduceLastItemQty, cart, setCart } from './features/cart/model.js';
import { initDashboardLogic } from './features/dashboard/model.js';
import { initTablesLogic } from './features/tables/model.js';
import { initNotificationsLogic } from './features/notifications/model.js';

// ── Layer 4: Widgets (UI renderers) ─────────────────────────
import { renderPOSGrid }         from './widgets/pos-grid/ui.js';
import { renderCartWidget }      from './widgets/cart/ui.js';
import { renderTableGrid as renderTableWidget } from './widgets/table-grid/ui.js';
import { renderOrderTypeWidget } from './widgets/order-type/ui.js';
import { renderInventoryTable }  from './widgets/inventory-table/ui.js';
import { renderSalesHistory }    from './widgets/sales-history/ui.js';
import { updateCalendarData }    from './widgets/sales-calendar/ui.js';
import { updateCalendarView }    from './features/calendar-filter/model.js';
import { renderExpenseTable }    from './widgets/expense-table/ui.js';
import { renderDashboardStats }  from './widgets/dashboard-stats/ui.js';
// import { initSettingsWidgets }   from './widgets/settings-cards/ui.js'; // Moved up
import { initSidebar } from './widgets/sidebar/ui.js';

// ── Shared API ───────────────────────────────────────────────
import { getSupabase, subscribeToTable } from './shared/api/supabase.js';

// ============================================================
// INITIALIZATION ORDER (sequence matters!)
// ============================================================
// INITIALIZATION ORDER (sequence matters!)
// ============================================================

// 1. Core utilities (must be available before anything else)
initCoreLogic();

// 2. WINDOW BRIDGE — Expose FSD functions to legacy HTML onclick=""
// Bind these BEFORE initializing logic so that sync callbacks find them
window.addToCart      = addToCart;
window.updateCartQty  = updateCartQty;
window.setCart        = setCart;
window.setPOSFilter   = setFilter;
window.setOrderType   = setOrderType;
window.updateCalendarView = updateCalendarView;

window.renderTableGrid = () => {
    renderTableWidget('pos-tables-container', window.currentSelectedTable, (id) => {
        window.currentSelectedTable = id;
        if (typeof window.selectTable === 'function') {
            window.selectTable(id);
        } else {
            window.refreshUI();
        }
    });
};

window.renderOrderType = () => {
    renderOrderTypeWidget('order-type-container');
};

let inventoryPagination = null;
window.renderInventory = (isLoadMore = false) => {
    if (!window.inventory) return;
    
    // Apply Veg/Non-Veg Filtering
    let filtered = window.inventory;
    const currentFilter = window.inventoryTypeFilter || 'all';
    
    if (currentFilter !== 'all') {
        filtered = window.inventory.filter(item => {
            const type = (item.itemType || '').toLowerCase().replace(/[- ]/g, '');
            return type === currentFilter;
        });
    }

    if (!inventoryPagination || !isLoadMore) {
        inventoryPagination = new LocalPagination(filtered, 20);
    }
    
    const visibleItems = inventoryPagination.getVisibleItems();
    renderInventoryTable('inventory-tbody', visibleItems);
    
    // Add sentinel for infinite scroll if more items exist
    if (inventoryPagination.hasMore()) {
        const tbody = document.getElementById('inventory-tbody');
        const sentinelRow = document.createElement('tr');
        sentinelRow.id = 'inventory-sentinel';
        sentinelRow.innerHTML = `<td colspan="7" style="text-align:center; padding:20px; color:var(--text-secondary); opacity:0.6;"><i class="fa-solid fa-spinner fa-spin"></i> Loading more items...</td>`;
        tbody.appendChild(sentinelRow);
        
        setTimeout(() => {
            setupInfiniteScroll('inventory-sentinel', () => {
                if (inventoryPagination.loadMore()) {
                    window.renderInventory(true);
                }
            });
        }, 100);
    }
};

window.renderHistory = () => {
    if (window.salesHistory) {
        renderSalesHistory('sales-tbody', window.salesHistory, 10);
        renderSalesHistory('history-tbody', window.salesHistory, null);
        updateCalendarData(window.salesHistory);
        if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
    }
};

window.renderExpenses = () => {
    if (window.expensesHistory) renderExpenseTable('expenses-tbody', window.expensesHistory);
};

window.renderCart = () => {
    renderCartWidget('cart-items-modern');
};

window.updateDashboard = () => {
    const today = new Date();
    const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : '';

    const todaySales = (window.salesHistory || []).filter(s => {
        if (!s.date) return false;
        try {
            return window.getDDMMYYYY && window.getDDMMYYYY(new Date(s.date)) === todayStr;
        } catch (e) {
            return false;
        }
    });
    
    const todayExpenses = (window.expensesHistory || []).filter(e => {
        if (!e.date) return false;
        try {
            return window.getDDMMYYYY && window.getDDMMYYYY(new Date(e.date)) === todayStr;
        } catch (e) {
            return false;
        }
    });

    let totalRevenue = 0, todayCash = 0, todayUpi = 0;
    todaySales.forEach(s => {
        const total = parseFloat(s.total || 0);
        totalRevenue += total;
        
        const pMode = s.payment_mode || s.paymentMode || 'CASH';
        const split = s.split_amounts || s.splitAmounts;

        if (pMode === 'UPI') {
            todayUpi += total;
        } else if (pMode === 'BOTH' && split) {
            todayUpi += parseFloat(split.upi || 0);
            todayCash += parseFloat(split.cash || 0);
        } else {
            todayCash += total;
        }
    });

    const totalExpense = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    renderDashboardStats({
        totalRevenue: totalRevenue.toFixed(0),
        todayCash: todayCash.toFixed(0),
        todayUpi: todayUpi.toFixed(0),
        totalExpense: totalExpense.toFixed(0),
        profit: (totalRevenue - totalExpense).toFixed(0),
        totalItems: (window.inventory || []).length,
        lowStock: (window.inventory || []).filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0).length,
        outOfStock: (window.inventory || []).filter(i => i.quantity === 0).length
    });
};

window.refreshUI = () => {
    const gridContainer = document.getElementById('pos-item-grid');
    const searchVal     = document.getElementById('pos-search')?.value || '';
    if (gridContainer) renderPOSGrid(gridContainer, searchVal, filterState.current);

    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();
    window.renderOrderType();
    syncLayoutVisibility(window.selectedOrderType, window.currentSelectedTable);
    window.renderCart();

    if (typeof window.renderActiveOrders === 'function') window.renderActiveOrders();

    window.renderInventory();
    window.renderHistory();
    window.renderExpenses();
    window.updateDashboard();
    
    if (typeof window.updateExpenseStats === 'function') window.updateExpenseStats();
};

window.toggleTablesCurtain = () => {
    const wrapper = document.getElementById('tables-curtain-area');
    const icon    = document.getElementById('tables-curtain-icon');
    if (!wrapper || !icon) return;
    
    const isCollapsed = wrapper.classList.contains('tables-collapsed');
    
    if (isCollapsed) {
        wrapper.classList.remove('tables-collapsed');
        wrapper.classList.add('tables-expanded');
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    } else {
        wrapper.classList.remove('tables-expanded');
        wrapper.classList.add('tables-collapsed');
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    }
};

window.toggleCalendarChart = () => {
    const wrapper = document.getElementById('calendar-wrapper');
    const icon    = document.getElementById('calendar-toggle-icon');
    if (!wrapper || !icon) return;

    if (wrapper.style.display === 'none') {
        wrapper.style.display = 'block';
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        wrapper.style.display = 'none';
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
};

window.renderPOSItems = (search = '') => {
    const gridContainer = document.getElementById('pos-item-grid');
    if (gridContainer) renderPOSGrid(gridContainer, search, filterState.current);
};

window.toggleCartDetails = () => {
    const cartContainer  = document.querySelector('.cart-items-container');
    const posCart        = document.querySelector('.pos-cart');
    const detailsCurtain = document.getElementById('cart-details-curtain');
    const roundOffRow    = document.getElementById('round-off-row');
    const toggleBtn      = document.querySelector('.curtain-toggle');
    const icon           = document.getElementById('curtain-icon');

    if (cartContainer && detailsCurtain) {
        cartContainer.classList.toggle('expanded');
        if (posCart) posCart.classList.toggle('cart-expanded');
        detailsCurtain.classList.toggle('hidden-details');
        if (roundOffRow) {
            if (cartContainer.classList.contains('expanded')) {
                roundOffRow.classList.add('hide-completely');
            } else {
                roundOffRow.classList.remove('hide-completely');
            }
        }
        if (toggleBtn) toggleBtn.classList.toggle('active');
        if (icon) {
            if (cartContainer.classList.contains('expanded')) {
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            } else {
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            }
        }
    }
};

// 3. Database & Feature logic (depends on window bridge being ready)
const features = [
    { name: 'Supabase', init: initSupabaseLogic },
    { name: 'Auth', init: initAuthLogic },
    { name: 'Inventory', init: initInventoryLogic },
    { name: 'POS', init: initPosLogic },
    { name: 'History', init: initHistoryLogic },
    { name: 'Expenses', init: initExpensesLogic },
    { name: 'Settings', init: initSettingsLogic },
    { name: 'Receipt', init: initReceiptLogic },
    { name: 'Dashboard', init: initDashboardLogic },
    { name: 'Tables', init: initTablesLogic },
    { name: 'Notifications', init: initNotificationsLogic }
];

features.forEach(f => {
    try {
        f.init();
        console.log(`Initialized: ${f.name}`);
    } catch (e) {
        console.error(`Failed to initialize ${f.name}:`, e);
    }
});

// 4. Widget Logic
initSidebar();

// 5. Boot logic
initBoot();

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================
const initRealtime = () => {
    subscribeToTable('inventory', async () => {
        await syncInventory();
        window.refreshUI();
    });
    subscribeToTable('tables', async () => {
        await syncTables();
        window.refreshUI();
    });
    ['sales_history', 'expenses'].forEach(table => {
        subscribeToTable(table, async () => {
            if (typeof window.syncFromSupabase === 'function') {
                await window.syncFromSupabase();
                window.refreshUI();
            }
        });
    });
};

// ============================================================
// APP INIT
// ============================================================
const init = async () => {
    console.log('Anokhi Restro POS — FSD Architecture Active');

    // Initial render from local cache
    window.refreshUI();

    // Background sync
    await syncInventory();
    await syncTables();
    if (typeof window.syncFromSupabase === 'function') {
        await window.syncFromSupabase();
    }

    window.refreshUI();

    if (typeof window.renderActiveOrders === 'function') window.renderActiveOrders();

    initRealtime();

    // Global Timer
    setInterval(() => {
        document.querySelectorAll('.table-timer').forEach(el => {
            const start = parseInt(el.getAttribute('data-start') || '0');
            if (!start) return;
            const elapsed = Math.floor((Date.now() - start) / 1000);
            const h = Math.floor(elapsed / 3600);
            const m = Math.floor((elapsed % 3600) / 60);
            const s = elapsed % 60;
            el.textContent = h > 0
                ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
                : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        });
    }, 1000);
};

// --- GLOBAL KEYBOARD SHORTCUTS ---
// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

