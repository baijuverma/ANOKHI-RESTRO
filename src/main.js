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

// ── Layer 1: Shared Utilities ────────────────────────────────
import { initCoreLogic }     from './shared/lib/core/legacy.model.js';    // formatCurrency, getDDMMYYYY, etc.
import { initSupabaseLogic } from './shared/lib/supabase/legacy.model.js'; // syncFromSupabase, saveData, setupRealtime

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
import { renderExpenseTable }    from './widgets/expense-table/ui.js';
import { renderDashboardStats }  from './widgets/dashboard-stats/ui.js';
import { initSettingsWidgets }   from './widgets/settings-cards/ui.js';
import { initSidebar } from './widgets/sidebar/ui.js';

// ── Shared API ───────────────────────────────────────────────
import { getSupabase, subscribeToTable } from './shared/api/supabase.js';

// ============================================================
// INITIALIZATION ORDER (sequence matters!)
// ============================================================

// 1. Core utilities (must be available before anything else)
initCoreLogic();

// 2. Database sync logic
initSupabaseLogic();

// 3. Feature logic (depends on core + db)
initAuthLogic();
initInventoryLogic();
initPosLogic();
initHistoryLogic();
initExpensesLogic();
initSettingsLogic();
initReceiptLogic();
initDashboardLogic();
initTablesLogic();
initNotificationsLogic();

// 4. Widget Logic
initSidebar();

// 5. Boot logic — DOM is already ready because modules run after parse
// (No need for DOMContentLoaded wrapper here)
initBoot();

// ============================================================
// WINDOW BRIDGE — Expose FSD functions to legacy HTML onclick=""
// ============================================================

window.addToCart      = addToCart;
window.updateCartQty  = updateCartQty;
window.setCart        = setCart;

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

window.toggleTablesCurtain = () => {
    const wrapper = document.getElementById('tables-curtain-area');
    const icon    = document.getElementById('tables-curtain-icon');
    if (!wrapper || !icon) return;
    wrapper.classList.toggle('curtain-collapsed');
    if (wrapper.classList.contains('curtain-collapsed')) {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    } else {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    }
};

window.renderPOSItems = (search = '') => {
    const gridContainer = document.getElementById('pos-item-grid');
    if (gridContainer) renderPOSGrid(gridContainer, search, filterState.current);
};

window.initSettingsView = initSettingsWidgets;

window.toggleCartDetails = () => {
    const cartContainer  = document.querySelector('.cart-items-container');
    const detailsCurtain = document.getElementById('cart-details-curtain');
    const roundOffRow    = document.getElementById('round-off-row');
    const toggleBtn      = document.querySelector('.curtain-toggle');
    const icon           = document.getElementById('curtain-icon');

    if (cartContainer && detailsCurtain) {
        cartContainer.classList.toggle('expanded');
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

window.renderCart = () => {
    renderCartWidget('cart-items-modern');
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

    if (window.inventory)        renderInventoryTable('inventory-tbody', window.inventory);
    if (window.salesHistory)     renderSalesHistory('sales-tbody', window.salesHistory);
    if (window.expensesHistory)  renderExpenseTable('expenses-tbody', window.expensesHistory);

    const totalSale    = (window.salesHistory    || []).reduce((a, c) => a + (parseFloat(c.total)  || 0), 0);
    const totalExpense = (window.expensesHistory || []).reduce((a, c) => a + (parseFloat(c.amount) || 0), 0);
    const totalOrders  = (window.salesHistory    || []).length;

    renderDashboardStats({
        totalSale:    totalSale.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        totalOrders:  totalOrders
    });
};

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
// APP INIT (runs after DOM is injected by layout.ui.js)
// ============================================================
const init = async () => {
    console.log('Anokhi Restro POS — FSD Architecture Active');

    await syncInventory();
    await syncTables();

    window.refreshUI();

    if (typeof window.renderActiveOrders === 'function') window.renderActiveOrders();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (!activeModal && window.cart?.length > 0) {
                e.preventDefault();
                reduceLastItemQty();
            }
        }
    });

    // Global Timer — updates table timers every second
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

    initRealtime();
};

// Run after layout is injected into DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
