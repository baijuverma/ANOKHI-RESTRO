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
import { initPdfReports }    from './features/dashboard/pdf-reports.js';
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
window.changeInventoryPage = (page) => {
    if (inventoryPagination) {
        if (page === undefined) inventoryPagination.loadMore();
        else inventoryPagination.goToPage(page);
        window.renderInventory();
    }
};

window.highlightInventoryItem = (id) => {
    if (!window.inventory) return;
    
    // Switch to Inventory view first
    if (typeof window.showView === 'function') window.showView('inventory');
    
    // Apply "All" filter to ensure item is visible
    if (typeof window.filterInventoryByType === 'function') window.filterInventoryByType('all');

    const filtered = window.inventory; // We forced 'all' filter above
    const itemIndex = filtered.findIndex(i => String(i.id) === String(id));
    
    if (itemIndex === -1) return;

    // Calculate page (15 items per page as seen in renderInventory)
    const pageSize = 15;
    const pageNum = Math.floor(itemIndex / pageSize) + 1;
    
    window.changeInventoryPage(pageNum);

    // Give DOM time to render
    setTimeout(() => {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('highlight-row-pulse');
            setTimeout(() => row.classList.remove('highlight-row-pulse'), 3000);
        }
    }, 300);
};

window.renderInventory = () => {
    if (!window.inventory) return;
    
    // Update Summary Card
    const totalCount = window.inventory.length;
    const outCount = window.inventory.filter(i => i.quantity === 0).length;
    const lowCount = window.inventory.filter(i => i.quantity > 0 && i.quantity <= (i.lowStockThreshold || 5)).length;
    
    const totalEl = document.getElementById('inv-total-count');
    const outEl = document.getElementById('inv-out-count');
    const lowEl = document.getElementById('inv-low-count');
    
    if (totalEl) totalEl.innerText = totalCount;
    if (outEl) outEl.innerText = outCount;
    if (lowEl) lowEl.innerText = lowCount;

    // Apply Veg/Non-Veg Filtering
    let filtered = window.inventory;
    const currentFilter = window.inventoryTypeFilter || 'all';
    const searchVal = document.getElementById('inventory-search')?.value?.toLowerCase() || '';
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(item => {
            const type = (item.itemType || '').toLowerCase().replace(/[- ]/g, '');
            return type === currentFilter;
        });
    }

    if (searchVal) {
        filtered = filtered.filter(item => 
            (item.name || '').toLowerCase().includes(searchVal) ||
            (item.category || '').toLowerCase().includes(searchVal)
        );
    }

    if (!inventoryPagination || inventoryPagination._lastFilter !== currentFilter || inventoryPagination._lastSearch !== searchVal || inventoryPagination.fullArray.length !== filtered.length) {
        inventoryPagination = new window.LocalPagination(filtered, 15);
        inventoryPagination._lastFilter = currentFilter;
        inventoryPagination._lastSearch = searchVal;
    }
    
    const pageItems = inventoryPagination.getPageItems();
    renderInventoryTable('inventory-tbody', pageItems, 0);
    
    // Render Pagination Controls
    if (typeof renderPaginationControls === 'function') {
        renderPaginationControls('inventory-pagination', inventoryPagination, 'changeInventoryPage');
    }
};

window.renderHistory = () => {
    if (window.salesHistory) {
        // Dashboard recent sales: always show latest 10, sorted by time — NO dues filter
        const dashboardOrders = [...window.salesHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
        renderSalesHistory('sales-tbody', dashboardOrders, 10);

        // Main History View with Date Range Filtering
        let historyOrders = [...window.salesHistory];
        const startDateStr = document.getElementById('history-start-date')?.value;
        const endDateStr = document.getElementById('history-end-date')?.value;

        if (startDateStr || endDateStr) {
            historyOrders = historyOrders.filter(sale => {
                const saleDate = new Date(sale.date);
                saleDate.setHours(0, 0, 0, 0);

                if (startDateStr) {
                    const start = new Date(startDateStr);
                    start.setHours(0, 0, 0, 0);
                    if (saleDate < start) return false;
                }
                if (endDateStr) {
                    const end = new Date(endDateStr);
                    end.setHours(23, 59, 59, 999);
                    if (saleDate > end) return false;
                }
                return true;
            });
        }

        renderSalesHistory('history-tbody', historyOrders, null);
        
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
    const now = new Date();
    const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(now) : '';
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayRevenue = 0, todayCash = 0, todayUpi = 0;
    let monthRevenue = 0, monthCash = 0, monthUpi = 0;

    (window.salesHistory || []).forEach(s => {
        if (!s.date) return;
        const sDate = new Date(s.date);
        const sDateStr = window.getDDMMYYYY ? window.getDDMMYYYY(sDate) : '';
        const isToday = sDateStr === todayStr;
        const isThisMonth = sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;

        if (!isToday && !isThisMonth) return;

        const totalPaid = parseFloat(s.total || 0) - parseFloat(s.dues || 0);
        const pMode = (s.payment_mode || s.paymentMode || 'CASH').toUpperCase();
        const split = s.split_amounts || s.splitAmounts;

        let sCash = 0, sUpi = 0;

        if (pMode === 'UPI') {
            sUpi = totalPaid;
        } else if ((pMode === 'BOTH' || pMode === 'SPLIT') && split) {
            sCash = parseFloat(split.cash || 0);
            sUpi = parseFloat(split.upi || 0);
        } else {
            sCash = totalPaid;
        }

        if (isToday) {
            todayCash += sCash;
            todayUpi += sUpi;
            todayRevenue += (sCash + sUpi);
        }
        if (isThisMonth) {
            monthCash += sCash;
            monthUpi += sUpi;
            monthRevenue += (sCash + sUpi);
        }
    });

    const todayExpenses = (window.expensesHistory || []).filter(e => {
        if (!e.date) return false;
        return window.getDDMMYYYY && window.getDDMMYYYY(new Date(e.date)) === todayStr;
    });
    const totalExpenseToday = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const monthExpenses = (window.expensesHistory || []).filter(e => {
        if (!e.date) return false;
        const eDate = new Date(e.date);
        return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
    });
    const totalExpenseMonth = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    renderDashboardStats({
        todayRevenue: todayRevenue.toFixed(2),
        todayCash: todayCash.toFixed(2),
        todayUpi: todayUpi.toFixed(2),
        monthRevenue: monthRevenue.toFixed(2),
        monthCash: monthCash.toFixed(2),
        monthUpi: monthUpi.toFixed(2),
        monthExpense: totalExpenseMonth.toFixed(2),
        totalExpenseToday: totalExpenseToday.toFixed(2),
        profitToday: (todayRevenue - totalExpenseToday).toFixed(2)
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
    initPdfReports();

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

