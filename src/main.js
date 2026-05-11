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

    if (!inventoryPagination || inventoryPagination._lastFilter !== currentFilter || inventoryPagination._lastSearch !== searchVal) {
        // Filter ya search change hua — pagination fresh banao, page 1 se start
        inventoryPagination = new window.LocalPagination(filtered, 15);
        inventoryPagination._lastFilter = currentFilter;
        inventoryPagination._lastSearch = searchVal;
    } else {
        // Same filter/search — current page preserve karo, lekin fresh data inject karo
        // (quantity update jaise changes ke liye)
        const currentPage = inventoryPagination.currentPage || 1;
        inventoryPagination = new window.LocalPagination(filtered, 15);
        inventoryPagination._lastFilter = currentFilter;
        inventoryPagination._lastSearch = searchVal;
        inventoryPagination.goToPage(currentPage);
    }
    
    const pageItems = inventoryPagination.getPageItems();
    console.log(`Rendering Inventory Table: Page ${inventoryPagination.currentPage}, Items: ${pageItems.length}/${filtered.length}`);
    if (pageItems.length > 0) {
        console.log('Sample Item (0):', { name: pageItems[0].name, qty: pageItems[0].quantity });
    }
    renderInventoryTable('inventory-tbody', pageItems, 0);
    
    // Render Pagination Controls
    if (typeof renderPaginationControls === 'function') {
        renderPaginationControls('inventory-pagination', inventoryPagination, 'changeInventoryPage');
    }
};

window.dashboardPaymentFilter = null; // 'CASH' | 'UPI' | 'DUES' | null
window.historyPaymentFilter = null;

window.togglePaymentFilter = (type, view) => {
    const applyHighlight = (el, typeName, isActive) => {
        if (!el) return;
        const textMap = { 'CASH': 'Cash', 'UPI': 'UPI', 'DUES': 'Dues' };
        if (isActive) {
            let color = typeName === 'CASH' ? '#10b981' : typeName === 'UPI' ? '#818cf8' : '#ef4444';
            el.style.color = color;
            el.style.background = `rgba(${typeName === 'CASH' ? '16, 185, 129' : typeName === 'UPI' ? '129, 140, 248' : '239, 68, 68'}, 0.2)`;
            el.style.border = `1px solid ${color}`;
            el.style.borderRadius = '6px';
            el.style.padding = '4px 8px';
            el.innerHTML = `${textMap[typeName]} <i class="fa-solid fa-xmark" style="font-size: 11px; margin-left: 4px;"></i>`;
        } else {
            el.style.color = '';
            el.style.background = '';
            el.style.border = '';
            el.style.borderRadius = '';
            el.style.padding = '';
            el.innerHTML = `${textMap[typeName]} <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i>`;
        }
    };

    if (view === 'dashboard') {
        window.dashboardPaymentFilter = window.dashboardPaymentFilter === type ? null : type;
        applyHighlight(document.getElementById('dashboard-th-cash'), 'CASH', window.dashboardPaymentFilter === 'CASH');
        applyHighlight(document.getElementById('dashboard-th-upi'), 'UPI', window.dashboardPaymentFilter === 'UPI');
        applyHighlight(document.getElementById('dashboard-th-dues'), 'DUES', window.dashboardPaymentFilter === 'DUES');
        
        // Sync the TODAY DUES card UI
        const statusText = document.getElementById('dashboard-dues-filter-status');
        const card = document.getElementById('dashboard-dues-filter-card');
        if (window.dashboardPaymentFilter === 'TODAY_DUES') {
            if(statusText) {
                statusText.innerText = 'Filter: DUES ONLY (Click to Clear)';
                statusText.style.background = '#ef4444';
                statusText.style.color = 'white';
            }
            if(card) card.style.background = 'rgba(239, 68, 68, 0.15)';
        } else {
            if(statusText) {
                statusText.innerText = 'Click to Filter Dues';
                statusText.style.background = 'rgba(239, 68, 68, 0.1)';
                statusText.style.color = 'var(--text-secondary)';
            }
            if(card) card.style.background = 'rgba(239, 68, 68, 0.05)';
        }
        if(typeof window.renderHistory === 'function') window.renderHistory();
    } else {
        window.historyPaymentFilter = window.historyPaymentFilter === type ? null : type;
        applyHighlight(document.getElementById('history-th-cash'), 'CASH', window.historyPaymentFilter === 'CASH');
        applyHighlight(document.getElementById('history-th-upi'), 'UPI', window.historyPaymentFilter === 'UPI');
        applyHighlight(document.getElementById('history-th-dues'), 'DUES', window.historyPaymentFilter === 'DUES');
        
        // Sync the TOTAL DUES card UI
        const statusText = document.getElementById('dues-filter-status');
        const card = document.getElementById('dues-filter-card');
        if (window.historyPaymentFilter === 'DUES') {
            window.showOnlyDues = true;
            if(statusText) {
                statusText.innerText = 'Filter: DUES ONLY (Click to Clear)';
                statusText.style.background = '#ef4444';
                statusText.style.color = 'white';
            }
            if(card) card.style.background = 'rgba(239, 68, 68, 0.15)';
        } else {
            window.showOnlyDues = false;
            if(statusText) {
                statusText.innerText = 'Click to Filter Dues';
                statusText.style.background = 'rgba(239, 68, 68, 0.1)';
                statusText.style.color = 'var(--text-secondary)';
            }
            if(card) card.style.background = 'rgba(239, 68, 68, 0.05)';
        }
    }
    window.renderHistory();
};

document.addEventListener('click', (e) => {
    const inDashboardSection = e.target.closest('#dashboard .recent-activity');
    const inHistorySection = e.target.closest('#history-transactions-panel');
    const isDuesCard = e.target.closest('#dues-filter-card') || e.target.closest('[onclick="toggleDuesFilter()"]');
    const isDashboardDuesCard = e.target.closest('#dashboard-dues-filter-card');
    
    let needsRender = false;

    const resetHighlight = (el, typeName) => {
        if (!el) return;
        const textMap = { 'CASH': 'Cash', 'UPI': 'UPI', 'DUES': 'Dues' };
        el.style.color = '';
        el.style.background = '';
        el.style.border = '';
        el.style.borderRadius = '';
        el.style.padding = '';
        if (typeName) el.innerHTML = `${textMap[typeName]} <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i>`;
    };

    if (!inDashboardSection && window.dashboardPaymentFilter && !isDashboardDuesCard) {
        window.dashboardPaymentFilter = null;
        resetHighlight(document.getElementById('dashboard-th-cash'), 'CASH');
        resetHighlight(document.getElementById('dashboard-th-upi'), 'UPI');
        resetHighlight(document.getElementById('dashboard-th-dues'), 'DUES');

        const statusText = document.getElementById('dashboard-dues-filter-status');
        const card = document.getElementById('dashboard-dues-filter-card');
        if(statusText) {
            statusText.innerText = 'Click to Filter Dues';
            statusText.style.background = 'rgba(239, 68, 68, 0.1)';
            statusText.style.color = 'var(--text-secondary)';
        }
        if(card) card.style.background = 'rgba(239, 68, 68, 0.05)';

        needsRender = true;
    }

    if (!inHistorySection && window.historyPaymentFilter && !isDuesCard) {
        window.historyPaymentFilter = null;
        resetHighlight(document.getElementById('history-th-cash'), 'CASH');
        resetHighlight(document.getElementById('history-th-upi'), 'UPI');
        resetHighlight(document.getElementById('history-th-dues'), 'DUES');
        
        // Also clear the TOTAL DUES card UI
        window.showOnlyDues = false;
        const statusText = document.getElementById('dues-filter-status');
        const card = document.getElementById('dues-filter-card');
        if(statusText) {
            statusText.innerText = 'Click to Filter Dues';
            statusText.style.background = 'rgba(239, 68, 68, 0.1)';
            statusText.style.color = 'var(--text-secondary)';
        }
        if(card) card.style.background = 'rgba(239, 68, 68, 0.05)';
        
        needsRender = true;
    }

    if (needsRender && typeof window.renderHistory === 'function') {
        window.renderHistory();
    }

    // Inventory Veg/Non-Veg Filter Auto-clear logic
    if (window.inventoryTypeFilter && window.inventoryTypeFilter !== 'all') {
        const isSearchBar = e.target.closest('#inventory .search-bar');
        const isFilterButton = e.target.closest('#filter-all') || e.target.closest('#filter-veg') || e.target.closest('#filter-nonveg');
        const isEditButton = e.target.closest('button[onclick^="editItem"]');
        const isStockModal = e.target.closest('#stockListModal');

        if (!isSearchBar && !isFilterButton && !isEditButton && !isStockModal) {
            if (typeof window.filterInventoryByType === 'function') {
                window.filterInventoryByType('all');
            }
        }
    }
});

window.renderHistory = () => {
    if (window.salesHistory) {
        // Dashboard recent sales
        let dashboardOrders = [...window.salesHistory];
        const dashboardSearch = document.getElementById('dashboard-dues-search')?.value?.toLowerCase() || '';
        
        if (dashboardSearch || window.dashboardPaymentFilter) {
            dashboardOrders = dashboardOrders.filter(sale => {
                const totalPaid = parseFloat(sale.total || 0) - parseFloat(sale.dues || 0);
                const split = sale.split_amounts || sale.splitAmounts;
                const pMode = (sale.payment_mode || sale.paymentMode || 'CASH').toUpperCase();
                let sCash = 0, sUpi = 0;
                if (pMode === 'UPI') {
                    sUpi = totalPaid;
                } else if ((pMode === 'BOTH' || pMode === 'SPLIT') && split) {
                    sCash = parseFloat(split.cash || 0);
                    sUpi = parseFloat(split.upi || 0);
                } else {
                    sCash = totalPaid;
                }
                const sDues = parseFloat(sale.dues || 0);

                if (window.dashboardPaymentFilter === 'CASH' && sCash <= 0) return false;
                if (window.dashboardPaymentFilter === 'UPI' && sUpi <= 0) return false;
                if (window.dashboardPaymentFilter === 'DUES' && sDues <= 0) return false;
                if (window.dashboardPaymentFilter === 'TODAY_DUES') {
                    if (sDues <= 0) return false;
                    const now = new Date();
                    const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(now) : '';
                    const sDateStr = sale.date ? (window.getDDMMYYYY ? window.getDDMMYYYY(new Date(sale.date)) : '') : '';
                    if (sDateStr !== todayStr) return false;
                }

                if (dashboardSearch) {
                    const cName = (sale.customerName || sale.customer_name || '').toLowerCase();
                    if (!cName.includes(dashboardSearch) || sDues <= 0) return false;
                }
                return true;
            });
        }
        
        // Pass 'dashboard' as mode/limit parameter so ui.js knows it's the dashboard
        renderSalesHistory('sales-tbody', dashboardOrders, 'dashboard');

        // Main History View with Date Range Filtering
        let historyOrders = [...window.salesHistory];
        const startDateStr = document.getElementById('history-start-date')?.value;
        const endDateStr = document.getElementById('history-end-date')?.value;
        const historySearch = document.getElementById('history-search')?.value?.toLowerCase() || '';

        if (startDateStr || endDateStr || window.historyPaymentFilter || historySearch) {
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
                
                if (window.historyPaymentFilter) {
                    const totalPaid = parseFloat(sale.total || 0) - parseFloat(sale.dues || 0);
                    const split = sale.split_amounts || sale.splitAmounts;
                    const pMode = (sale.payment_mode || sale.paymentMode || 'CASH').toUpperCase();
                    let sCash = 0, sUpi = 0;
                    if (pMode === 'UPI') {
                        sUpi = totalPaid;
                    } else if ((pMode === 'BOTH' || pMode === 'SPLIT') && split) {
                        sCash = parseFloat(split.cash || 0);
                        sUpi = parseFloat(split.upi || 0);
                    } else {
                        sCash = totalPaid;
                    }
                    const sDues = parseFloat(sale.dues || 0);

                    if (window.historyPaymentFilter === 'CASH' && sCash <= 0) return false;
                    if (window.historyPaymentFilter === 'UPI' && sUpi <= 0) return false;
                    if (window.historyPaymentFilter === 'DUES' && sDues <= 0) return false;
                }
                
                if (historySearch) {
                    const cName = (sale.customerName || sale.customer_name || '').toLowerCase();
                    const sId = String(sale.id || '').toLowerCase();
                    if (!cName.includes(historySearch) && !sId.includes(historySearch)) return false;
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
    if (window.expensesHistory) {
        let filtered = [...window.expensesHistory];
        const searchVal = document.getElementById('expense-search-history')?.value?.toLowerCase() || '';
        const startDateStr = document.getElementById('expense-from-date')?.value;
        const endDateStr = document.getElementById('expense-to-date')?.value;

        if (searchVal || startDateStr || endDateStr) {
            filtered = filtered.filter(exp => {
                // Search filter
                if (searchVal) {
                    const cat = (exp.main_category || exp.category || '').toLowerCase();
                    const subCat = (exp.sub_category || exp.subCategory || '').toLowerCase();
                    const reason = (exp.description || exp.reason || '').toLowerCase();
                    if (!cat.includes(searchVal) && !subCat.includes(searchVal) && !reason.includes(searchVal)) {
                        return false;
                    }
                }

                // Date filter
                if (exp.date) {
                    const expDate = new Date(exp.date);
                    expDate.setHours(0, 0, 0, 0);

                    if (startDateStr) {
                        const start = new Date(startDateStr);
                        start.setHours(0, 0, 0, 0);
                        if (expDate < start) return false;
                    }
                    if (endDateStr) {
                        const end = new Date(endDateStr);
                        end.setHours(23, 59, 59, 999);
                        if (expDate > end) return false;
                    }
                }

                return true;
            });
        }
        renderExpenseTable('expenses-tbody', filtered);
    }
};

window.renderCart = () => {
    renderCartWidget('cart-items-modern');
};

window.updateDashboard = () => {
    const now = new Date();
    const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(now) : '';
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayRevenue = 0, todayCash = 0, todayUpi = 0, todayDues = 0;
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
            todayDues += parseFloat(s.dues || 0);
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
        todayDues: todayDues.toFixed(2),
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

    // Realtime is now handled inside syncFromSupabase call in legacy.model.js
    
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

