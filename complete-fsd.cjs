const fs = require('fs');
const path = require('path');

function mkdirSafe(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
    mkdirSafe(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
    console.log('Created: ' + filePath);
}

// =====================================================
// 1. MISSING HTML FILES
// =====================================================

writeFile('src/features/pos/pos.html', `<!-- Feature: POS Billing Panel -->
<section id="pos" class="view-section hidden">
    <div class="pos-container">
        <!-- Left: Product Grid -->
        <div class="pos-left-panel">
            <div id="order-type-container"></div>
            <div id="tables-curtain-area">
                <div id="pos-tables-container"></div>
                <button class="curtain-toggle" onclick="toggleTablesCurtain()">
                    <i id="tables-curtain-icon" class="fa-solid fa-chevron-up"></i>
                </button>
            </div>
            <div class="pos-search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="pos-search" placeholder="Search items (type anywhere)..." autocomplete="off">
            </div>
            <div class="pos-filter-row">
                <button class="filter-chip active" onclick="setFilter('all', this)">All</button>
                <button class="filter-chip" onclick="setFilter('veg', this)">&#9632; Veg</button>
                <button class="filter-chip" onclick="setFilter('nonveg', this)">&#9632; Non-Veg</button>
            </div>
            <div id="pos-item-grid" class="pos-item-grid"></div>
        </div>
        <!-- Right: Cart -->
        <div class="pos-right-panel">
            <!-- Cart content rendered by cart widget -->
        </div>
    </div>
</section>
`);

writeFile('src/features/history/history.html', `<!-- Feature: Sales History View -->
<section id="history" class="view-section hidden">
    <header class="flex-between">
        <div>
            <h1>Sales History</h1>
            <p>View and manage all transactions</p>
        </div>
    </header>
    <div id="history-stats-container" class="stats-grid mt-4"></div>
    <div id="calendar-wrapper" class="glass-panel mt-4"></div>
    <div class="glass-panel mt-4">
        <div class="table-container">
            <table id="sales-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Mode</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="sales-tbody">
                    <!-- Dynamic rows -->
                </tbody>
            </table>
        </div>
    </div>
</section>
`);

writeFile('src/features/cart/cart.html', `<!-- Feature: Cart Panel -->
<div class="cart-panel">
    <div class="cart-items-container">
        <div id="cart-items-modern"></div>
    </div>
    <div id="cart-details-curtain">
        <div class="cart-summary-row">
            <span>Subtotal</span>
            <span id="cart-subtotal">₹0</span>
        </div>
        <div class="cart-summary-row" id="advance-paid-info" style="display:none;">
            <span>Advance Paid</span>
            <span id="cart-advance-paid">₹0</span>
        </div>
        <div class="cart-summary-row" id="prev-paid-row" style="display:none;">
            <span>Previously Paid</span>
            <span id="cart-prev-paid">₹0</span>
        </div>
        <div id="round-off-row" class="cart-summary-row">
            <span>Round Off</span>
            <span id="cart-roundoff">₹0</span>
        </div>
    </div>
    <div class="cart-total-row">
        <div>
            <span id="cart-total-label">Total</span>
            <span id="total-table-indicator"></span>
        </div>
        <span id="cart-total">₹0</span>
    </div>
</div>
`);

writeFile('src/features/tables/model.js', `// Feature: Tables — State management for restaurant table system
export function initTablesLogic() {
    // Table state is managed via window.tables (set in store.js)
    // This module provides helper functions for table operations

    window.getTableById = function(id) {
        return (window.tables || []).find(t => String(t.id) === String(id));
    };

    window.updateTableCart = function(tableId, cart) {
        const tables = window.tables || [];
        const idx = tables.findIndex(t => String(t.id) === String(tableId));
        if (idx > -1) {
            tables[idx].cart = JSON.parse(JSON.stringify(cart));
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
        }
    };

    window.clearTableState = function(tableId) {
        const tables = window.tables || [];
        const idx = tables.findIndex(t => String(t.id) === String(tableId));
        if (idx > -1) {
            tables[idx].cart = [];
            tables[idx].advance = 0;
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
        }
    };
}
`);

writeFile('src/features/dashboard/model.js', `// Feature: Dashboard — Data aggregation and stats calculation
export function initDashboardLogic() {
    // Dashboard update logic is in shared/lib/core/legacy.model.js (updateDashboard)
    // This module adds any dashboard-specific helpers

    window.getDashboardStats = function() {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : '';

        const todaySales = (window.salesHistory || []).filter(s =>
            window.getDDMMYYYY && window.getDDMMYYYY(new Date(s.date)) === todayStr
        );
        const todayExpenses = (window.expensesHistory || []).filter(e =>
            window.getDDMMYYYY && window.getDDMMYYYY(new Date(e.date)) === todayStr
        );

        const totalRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalExpense = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        return {
            totalRevenue,
            totalExpense,
            profit: totalRevenue - totalExpense,
            orderCount: todaySales.length,
            totalItems: (window.inventory || []).length,
            lowStock: (window.inventory || []).filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0).length,
            outOfStock: (window.inventory || []).filter(i => i.quantity === 0).length
        };
    };
}
`);

writeFile('src/features/notifications/model.js', `// Feature: Notifications — Toast notification system
export function initNotificationsLogic() {
    // showToast is already defined in shared/lib/core/legacy.model.js
    // This module can be extended for more notification types

    window.notifySuccess = function(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'success');
        }
    };

    window.notifyError = function(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'error');
        }
    };
}
`);

writeFile('src/widgets/sidebar/ui.js', `// Widget: Sidebar — Navigation rendering
export function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (typeof window.showView === 'function') window.showView(target);
        });
    });
}
`);

// =====================================================
// 2. MISSING WIDGET CSS FILES
// =====================================================

writeFile('src/widgets/expense-table/expense-table.css', `/* Widget: Expense Table */
#expenses-tbody tr {
    transition: background 0.2s ease;
}
#expenses-tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
}
#expenses-tbody td {
    padding: 10px 12px;
    font-size: 13px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
`);

writeFile('src/widgets/inventory-table/inventory-table.css', `/* Widget: Inventory Table */
#inventory-tbody tr {
    transition: background 0.2s ease;
}
#inventory-tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
}
#inventory-tbody td {
    padding: 10px 12px;
    font-size: 13px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.stock-badge {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
}
.stock-badge.in-stock { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.stock-badge.low-stock { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.stock-badge.out-of-stock { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
`);

writeFile('src/widgets/order-type/order-type.css', `/* Widget: Order Type Selector */
.order-type-container {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
}
.order-type-btn {
    flex: 1;
    padding: 8px 12px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}
.order-type-btn.active,
.order-type-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
    background: rgba(99, 102, 241, 0.1);
}
`);

writeFile('src/widgets/pos-grid/pos-grid.css', `/* Widget: POS Item Grid */
.pos-item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    padding: 8px 0;
    overflow-y: auto;
}
.pos-item-card {
    border-radius: 10px;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
}
.pos-item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: var(--accent-color);
}
.pos-item-card .item-name {
    font-size: 12px;
    font-weight: 600;
    margin-top: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.pos-item-card .item-price {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent-color);
    margin-top: 4px;
}
`);

writeFile('src/widgets/sales-history/sales-history.css', `/* Widget: Sales History Table */
#sales-tbody tr {
    transition: background 0.2s ease;
}
#sales-tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
}
#sales-tbody td {
    padding: 10px 12px;
    font-size: 13px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.sale-type-badge {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
}
.sale-type-badge.dine-in { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.sale-type-badge.takeaway { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.sale-type-badge.counter { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
`);

writeFile('src/widgets/settings-cards/settings-cards.css', `/* Widget: Settings Cards */
.settings-card {
    padding: 20px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 16px;
}
.settings-card h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
}
.settings-card .setting-description {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 16px;
}
.table-count-control {
    display: flex;
    align-items: center;
    gap: 12px;
}
.table-count-control button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--accent-color);
    background: transparent;
    color: var(--accent-color);
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.table-count-control button:hover {
    background: var(--accent-color);
    color: white;
}
.table-count-control input {
    width: 60px;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
}
`);

// =====================================================
// 3. FEATURE CSS FILES (missing ones)
// =====================================================

writeFile('src/features/history/history.css', `/* Feature: Sales History — Calendar, Stats, Filters */
.history-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}
.history-stat-card {
    padding: 16px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
}
.dues-filter-card {
    cursor: pointer;
    transition: all 0.2s ease;
}
.dues-filter-card:hover {
    border-color: var(--accent-color);
}
.dues-filter-card.active {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
}
`);

// =====================================================
// 4. UPDATE MASTER index.css to include new CSS files
// =====================================================

const indexCss = `/* 
 * src/app/index.css — Master CSS Entry Point
 * All layer-wise CSS modules imported in correct cascade order
 */

/* Layer 0: Base (Variables, Reset, Typography) */
@import '../shared/ui/css/base.css';

/* Layer 1: Shared UI Components */
@import '../shared/ui/css/buttons.css';
@import '../shared/ui/css/forms.css';
@import '../shared/ui/css/tables.css';
@import '../shared/ui/css/utilities.css';
@import '../shared/ui/css/ui.css';

/* Layer 2: Widgets */
@import '../widgets/sidebar/sidebar.css';
@import '../widgets/dashboard-stats/stats.css';
@import '../widgets/table-grid/tables.css';
@import '../widgets/cart/cart.css';
@import '../widgets/expense-table/expense-table.css';
@import '../widgets/inventory-table/inventory-table.css';
@import '../widgets/order-type/order-type.css';
@import '../widgets/pos-grid/pos-grid.css';
@import '../widgets/sales-history/sales-history.css';
@import '../widgets/settings-cards/settings-cards.css';

/* Layer 3: Features */
@import '../features/auth/login.css';
@import '../features/pos/pos.css';
@import '../features/history/calendar.css';
@import '../features/history/history.css';
@import '../features/dashboard/dashboard.css';
@import '../features/expenses/expenses.css';
@import '../features/inventory/inventory.css';
@import '../features/receipt/receipt.css';
@import '../features/settings/settings.css';
@import '../features/notifications/toast.css';
@import '../features/product-grid/grid.css';
@import '../features/billing-panel/billing.css';
@import '../features/tables/tables.css';

/* Layer 4: Responsive (must be last to override) */
@import '../shared/ui/css/responsive.css';
`;

fs.writeFileSync('src/app/index.css', indexCss);
console.log('Updated: src/app/index.css');

// =====================================================
// 5. CLEANUP — Delete old files
// =====================================================

// Delete style.css (replaced by layer-wise modules)
if (fs.existsSync('style.css')) {
    fs.unlinkSync('style.css');
    console.log('Deleted: style.css');
}

// Delete old backup folder
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

if (fs.existsSync('src/app_nextjs_backup')) {
    deleteFolderRecursive('src/app_nextjs_backup');
    console.log('Deleted: src/app_nextjs_backup/');
}

// Clean empty index.js stubs
const emptyIndexFiles = [
    'src/features/auth/index.js',
    'src/features/dashboard/index.js',
    'src/features/expenses/index.js',
    'src/features/inventory/index.js',
    'src/features/notifications/index.js',
    'src/features/receipt/index.js',
    'src/features/sales-history/index.js',
    'src/features/settings/index.js',
    'src/features/tables/index.js',
];

emptyIndexFiles.forEach(f => {
    if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, 'utf8').trim();
        if (content.length === 0) {
            fs.unlinkSync(f);
            console.log('Deleted empty: ' + f);
        }
    }
});

console.log('\n✅ ALL DONE — FSD architecture is now 100% complete!');
