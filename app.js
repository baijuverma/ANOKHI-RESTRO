// Supabase Configuration
const SUPABASE_URL = 'https://fhshckrdkasopfneujmw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qFlDlQChYsm7WobmTOmc6w_Wkb3XSBl';
let db = null;
try {
    const _supa = window.supabase || window.Supabase;
    if (_supa && _supa.createClient) {
        db = _supa.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch(e) {
    console.warn('Supabase not loaded, running in offline mode:', e);
}

// Utility: Truncate Name to 10 chars (8 text + 2 dots)
function truncateName(name) {
    if (!name) return '';
    return name.length > 10 ? name.substring(0, 8) + '..' : name;
}

// Defensive Stubs for Modular Functions (Prevents crashes on file:// protocol)
window.renderInventory = window.renderInventory || function() {};
window.renderPOSItems = window.renderPOSItems || function() {};
window.renderHistory = window.renderHistory || function() {};
window.renderTableGrid = window.renderTableGrid || function() {};
window.renderExpenses = window.renderExpenses || function() {};
window.updateDashboard = window.updateDashboard || function() {};
window.updateExpenseStats = window.updateExpenseStats || function() {};
window.initSettingsView = window.initSettingsView || function() {};

// Safe Storage Helper
function getLocalData(key, defaultVal) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
        console.warn(`Error parsing localStorage key "${key}":`, e);
        return defaultVal;
    }
}

// Data Structures (Initialized with local cache, will be updated from Supabase)
let inventory = getLocalData('anokhi_inventory', []);
let salesHistory = getLocalData('anokhi_sales', []);
let activeOrders = getLocalData('anokhi_active_orders', []);
let expensesHistory = getLocalData('anokhi_expenses', []);
let cart = window.cart || []; window.cart = cart;
window.selectedOrderType = 'DINE_IN';
window.currentSelectedTable = null;
let inventoryTypeFilter = 'all'; // 'all' | 'veg' | 'nonveg'
let posTypeFilter = 'all'; // 'all' | 'veg' | 'nonveg'
let tables = getLocalData('anokhi_tables', Array.from({length: 12}, (_, i) => ({
    id: `T${i+1}`,
    name: `Table ${i+1}`,
    cart: [],
    advance: 0,
    advanceMode: 'CASH'
})));
window.tables = tables;

let editingSaleId = null;
let previousPaidAmount = 0;

// Initial Data Sync from Supabase
window.syncFromSupabase = async function() {
    if (!db) { console.warn('Supabase unavailable, skipping sync.'); return; }
    try {
        const { data: invData } = await db.from('inventory').select('*');
        if (invData && invData.length > 0) {
            inventory = invData.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                itemType: i.item_type || 'Veg',
                price: i.price,
                quantity: i.quantity,
                lowStockThreshold: i.low_stock_threshold || 5
            }));
            localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
        }

        // Fetch only the latest 20 sales initially for better performance
        const { data: salesData } = await db.from('sales_history').select('*').order('date', { ascending: false }).range(0, 19);
        if (salesData) {
            salesHistory = salesData;
            localStorage.setItem('anokhi_sales', JSON.stringify(salesHistory));
        }

        const { data: tableData } = await db.from('tables').select('*');
        if (tableData && tableData.length > 0) {
            // Map db tables to local structure if needed
            tables = tables.map(t => {
                const dbTable = tableData.find(dt => dt.id === t.id);
                return dbTable ? { ...t, ...dbTable } : t;
            });
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
    localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
        }

        const { data: expData } = await db.from('expenses').select('*').order('date', { ascending: false });
        if (expData && expData.length > 0) {
            expensesHistory = expData;
            localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
        }

        const { data: activeData } = await db.from('active_orders').select('*').order('created_at', { ascending: false });
        if (activeData) {
            activeOrders = activeData.map(o => ({
                id: o.id,
                orderType: o.order_type,
                items: o.items,
                total: o.total,
                discount: o.discount || 0,
                roundOff: o.round_off || 0,
                customerName: o.customer_name,
                customerMobile: o.customer_mobile,
                createdAt: o.created_at
            }));
            localStorage.setItem('anokhi_active_orders', JSON.stringify(activeOrders));
        }

        // Re-render views safely
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderPOSItems === 'function') renderPOSItems();
        if (typeof renderHistory === 'function') renderHistory();
        if (typeof renderTableGrid === 'function') renderTableGrid();
        if (typeof renderActiveOrders === 'function') renderActiveOrders();
        if (typeof renderExpenses === 'function') renderExpenses();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof updateExpenseStats === 'function') updateExpenseStats();
    } catch (err) {
        console.error('Sync Error:', err);
    }
}

// Supabase Realtime Setup
function setupRealtime() {
    if (!db) {
        console.warn('Supabase DB not initialized, Realtime disabled.');
        return;
    }

    console.log('Initializing Supabase Realtime...');

    // 1. Inventory Realtime
    db.channel('inventory-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
            console.log('Realtime Inventory Update:', payload);
            const { eventType, new: newItem, old: oldItem } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const mapped = {
                    id: newItem.id,
                    name: newItem.name,
                    category: newItem.category,
                    itemType: newItem.item_type || 'Veg',
                    price: newItem.price,
                    quantity: newItem.quantity,
                    lowStockThreshold: newItem.low_stock_threshold || 5
                };
                const idx = inventory.findIndex(i => i.id === mapped.id);
                if (idx > -1) {
                    inventory[idx] = mapped;
                } else {
                    inventory.push(mapped);
                }
            } else if (eventType === 'DELETE') {
                inventory = inventory.filter(i => i.id !== oldItem.id);
            }
            
            localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderPOSItems === 'function') renderPOSItems();
            if (typeof updateDashboard === 'function') updateDashboard();
        })
        .subscribe();

    // 2. Tables Realtime
    db.channel('tables-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
            console.log('Realtime Tables Update:', payload);
            const { eventType, new: newTable } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const idx = tables.findIndex(t => t.id === newTable.id);
                if (idx > -1) {
                    tables[idx] = { 
                        ...tables[idx], 
                        id: newTable.id,
                        name: newTable.name,
                        cart: newTable.cart || [],
                        advance: newTable.advance || 0,
                        advanceMode: newTable.advance_mode || 'CASH'
                    };
                } else {
                    tables.push({
                        id: newTable.id,
                        name: newTable.name,
                        cart: newTable.cart || [],
                        advance: newTable.advance || 0,
                        advanceMode: newTable.advance_mode || 'CASH'
                    });
                }
            }
            
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
            if (typeof renderTableGrid === 'function') renderTableGrid();
            
            // If the table being edited is the current table, refresh its state
            if (window.currentSelectedTable && window.currentSelectedTable.id === newTable.id) {
                window.currentSelectedTable = tables.find(t => t.id === newTable.id);
                window.cart = window.currentSelectedTable.cart || [];
                if (typeof renderCart === 'function') renderCart();
            }
        })
        .subscribe();

    // 3. Sales History Realtime
    db.channel('sales-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_history' }, payload => {
            console.log('Realtime Sales Update:', payload);
            const { eventType, new: newSale, old: oldSale } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const mapped = {
                    id: newSale.id,
                    date: newSale.date,
                    items: newSale.items,
                    total: newSale.total,
                    discount: newSale.discount,
                    roundOff: newSale.round_off,
                    paymentMode: newSale.payment_mode,
                    splitAmounts: newSale.split_amounts,
                    orderType: newSale.order_type,
                    tableName: newSale.table_name,
                    advancePaid: newSale.advance_paid
                };
                const idx = salesHistory.findIndex(s => s.id === mapped.id);
                if (idx > -1) {
                    salesHistory[idx] = mapped;
                } else {
                    salesHistory.unshift(mapped);
                }
            } else if (eventType === 'DELETE') {
                salesHistory = salesHistory.filter(s => s.id !== oldSale.id);
            }
            
            localStorage.setItem('anokhi_sales', JSON.stringify(salesHistory));
            if (typeof renderHistory === 'function') renderHistory();
            if (typeof updateDashboard === 'function') updateDashboard();
        })
        .subscribe();

    // 4. Expenses Realtime
    db.channel('expenses-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => {
            console.log('Realtime Expenses Update:', payload);
            const { eventType, new: newExpense, old: oldExpense } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const idx = expensesHistory.findIndex(e => e.id === newExpense.id);
                if (idx > -1) {
                    expensesHistory[idx] = newExpense;
                } else {
                    expensesHistory.unshift(newExpense);
                }
            } else if (eventType === 'DELETE') {
                expensesHistory = expensesHistory.filter(e => e.id !== oldExpense.id);
            }
            
            localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
            if (typeof renderExpenses === 'function') renderExpenses();
            if (typeof updateExpenseStats === 'function') updateExpenseStats();
            if (typeof updateDashboard === 'function') updateDashboard();
        })
        .subscribe();

    // 5. Active Orders Realtime
    db.channel('active-orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'active_orders' }, payload => {
            console.log('Realtime Active Orders Update:', payload);
            const { eventType, new: newOrder, old: oldOrder } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const mapped = {
                    id: newOrder.id,
                    orderType: newOrder.order_type,
                    items: newOrder.items,
                    total: newOrder.total,
                    discount: newOrder.discount || 0,
                    roundOff: newOrder.round_off || 0,
                    customerName: newOrder.customer_name,
                    customerMobile: newOrder.customer_mobile,
                    createdAt: newOrder.created_at
                };
                const idx = activeOrders.findIndex(o => o.id === mapped.id);
                if (idx > -1) activeOrders[idx] = mapped;
                else activeOrders.unshift(mapped);
            } else if (eventType === 'DELETE') {
                activeOrders = activeOrders.filter(o => o.id !== oldOrder.id);
            }
            
            localStorage.setItem('anokhi_active_orders', JSON.stringify(activeOrders));
            if (typeof renderActiveOrders === 'function') renderActiveOrders();
        })
        .subscribe();
}

// DOM Elements
const views = document.querySelectorAll('.view-section');
const navItems = document.querySelectorAll('.nav-item');

// Initialize App
window.showView = function(targetId) {
    const views = document.querySelectorAll('.view-section');
    const navItems = document.querySelectorAll('.nav-item');
    
    // Hide all views
    views.forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    
    // Show target view
    const targetView = document.getElementById(targetId);
    if (targetView) {
        targetView.classList.add('active');
        targetView.classList.remove('hidden');
    }
    
    // Update active nav
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === targetId) {
            item.classList.add('active');
        }
    });

    // Refresh view specific data
    if(targetId === 'dashboard') updateDashboard();
    if(targetId === 'inventory') renderInventory();
    if(targetId === 'pos') renderPOSItems();
    if(targetId === 'history') renderHistory();
    if(targetId === 'expenses') {
        if (typeof renderExpenses === 'function') renderExpenses();
        if (typeof updateExpenseStats === 'function') updateExpenseStats();
    }
    if(targetId === 'settings') {
        if (typeof initSettingsView === 'function') initSettingsView();
    }
}

window.checkLogin = function() {
    const pwdInput = document.getElementById('login-password');
    const pwd = pwdInput ? pwdInput.value : '';
    const storedPwd = localStorage.getItem('anokhi_admin_pwd');
    
    // Allow stored password OR default 8540
    if (pwd === storedPwd || pwd === '8540' || (!storedPwd && pwd === '8540')) {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.add('hide');
            setTimeout(() => {
                loginScreen.style.display = 'none';
                loginScreen.classList.remove('hide');
            }, 500);
        }
        
        showView('dashboard');
        console.log('Login successful');
    } else {
        pwdInput.parentElement.classList.add('shake');
        setTimeout(() => pwdInput.parentElement.classList.remove('shake'), 500);
        
        console.warn('Incorrect password entered.');
        if (pwdInput) {
            pwdInput.value = '';
            pwdInput.focus();
        }
    }
}

window.verifySettingsDoB = function() {
    console.log("verifySettingsDoB function called!");
    const dobInput = document.getElementById('settings-admin-dob').value;
    const adminDoB = localStorage.getItem('anokhi_admin_dob') || '1989-12-15';
    
    console.log("Input Value:", dobInput);
    console.log("Expected Value:", adminDoB);

    if (!dobInput) {
        alert('Please select the Date of Birth first.');
        return;
    }

    if (dobInput === adminDoB) {
        console.log("Verification Success!");
        document.getElementById('settings-password-section').classList.remove('force-hidden');
        document.getElementById('settings-dob-section').classList.add('force-hidden');
        alert('Verified! Please enter new password.');
    } else {
        console.log("Verification Failed!");
        alert('Incorrect DOB! System expected ' + adminDoB + ' but got ' + dobInput);
    }
}

window.updateAdminPassword = function() {
    const newPwd = document.getElementById('new-admin-password').value;
    const confirmPwd = document.getElementById('confirm-admin-password').value;

    if (!newPwd) {
        alert('Please enter a new password.');
        return;
    }

    if (newPwd !== confirmPwd) {
        alert('Passwords do not match!');
        return;
    }

    localStorage.setItem('anokhi_admin_pwd', newPwd);
    alert('Password updated successfully! This will be required next time you log in.');
    
    // Reset and hide sections
    document.getElementById('new-admin-password').value = '';
    document.getElementById('confirm-admin-password').value = '';
    document.getElementById('settings-admin-dob').value = '';
    document.getElementById('settings-password-section').classList.add('force-hidden');
    document.getElementById('settings-dob-section').classList.remove('force-hidden');
}

window.logout = function() {
    if (confirm('Are you sure you want to logout and lock the system?')) {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            const pwdInput = document.getElementById('login-password');
            if (pwdInput) {
                pwdInput.value = '';
                setTimeout(() => pwdInput.focus(), 100);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Always show login screen on load
    const loginScreen = document.getElementById('login-screen');
    if(loginScreen) {
        loginScreen.style.display = 'flex';
        const pwdInput = document.getElementById('login-password');
        if (pwdInput) {
            pwdInput.value = '';
            setTimeout(() => pwdInput.focus(), 100);
        }
    }

    // Global Keyboard Shortcuts & Search Redirection
    document.addEventListener('keydown', (e) => {
        const searchInput = document.getElementById('pos-search');
        const posView = document.getElementById('pos');
        const loginScreen = document.getElementById('login-screen');
        const activeModal = document.querySelector('.modal.active');
        const active = document.activeElement;

        // 1. Skip if system locked/login screen visible
        if (loginScreen && loginScreen.style.display !== 'none' && !loginScreen.classList.contains('hide')) return;

        // 2. Handle Modals (Highest Priority)
        if (activeModal) {
            if (e.key === 'Escape') {
                if (typeof closeModal === 'function') closeModal(activeModal.id);
                return;
            }
            if (e.key === 'Enter') {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
                if (typeof closeModal === 'function') closeModal(activeModal.id);
                return;
            }
            return; 
        }

        // 3. Ignore if user is inside another real input/textarea/select
        const isOtherInput = active && 
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) && 
            active !== searchInput;
        
        if (isOtherInput) {
            if (e.key === 'Enter' && (typeof cart !== 'undefined' && cart.length > 0) && (active.id === 'pay-cash-amount' || active.id === 'pay-upi-amount')) {
                if (typeof processSale === 'function') processSale();
            }
            return;
        }

        // 4. Ignore system shortcuts
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // 5. ESC Logic
        if (e.key === 'Escape') {
            if (active === searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.blur();
                return;
            }
            if (typeof newBill === 'function') newBill();
        }

        // 6. ENTER Logic
        if (e.key === 'Enter') {
            if (typeof cart !== 'undefined' && cart.length > 0) {
                if (typeof processSale === 'function') processSale();
            }
        }

        // 7. Type to Search Logic
        if (!searchInput) return;

        if (e.key.length === 1) {
            // Switch to POS if not active
            if (posView && !posView.classList.contains('active')) {
                if (typeof showView === 'function') showView('pos');
            }
            
            if (active !== searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.value += e.key;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (e.key === 'Backspace' && active !== searchInput) {
            if (posView && posView.classList.contains('active')) {
                e.preventDefault();
                searchInput.focus();
                if (searchInput.value.length > 0) {
                    searchInput.value = searchInput.value.slice(0, -1);
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        } else if (e.key === 'F4') {
            e.preventDefault();
            if (typeof openAdvanceModal === 'function') openAdvanceModal();
        } else if (e.key === 'F8') {
            e.preventDefault();
            if (typeof holdOrder === 'function') holdOrder();
        }
    });

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (typeof showView === 'function') showView(target);
        });
    });

    // Form Submissions
    const itemForm = document.getElementById('item-form');
    if (itemForm) itemForm.addEventListener('submit', handleItemSubmit);
    
    const restockForm = document.getElementById('restock-form');
    if (restockForm) restockForm.addEventListener('submit', handleRestockSubmit);
    
    const posSearchInput = document.getElementById('pos-search');
    if (posSearchInput) posSearchInput.addEventListener('input', (e) => {
        if (typeof renderPOSItems === 'function') renderPOSItems(e.target.value);
    });

    // Initial Renders (Show local cache first)
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderPOSItems === 'function') renderPOSItems();
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof renderTableGrid === 'function') renderTableGrid();
    if (typeof renderExpenses === 'function') renderExpenses();
    if (typeof updateExpenseStats === 'function') updateExpenseStats();

    // Sync from Supabase in background
    if (typeof syncFromSupabase === 'function') {
        syncFromSupabase().then(() => {
            if (typeof setupRealtime === 'function') setupRealtime();
        });
    }

    // Default to Dine-In on Load (Defensive check)
    const dineInBtn = document.querySelector('.order-type-btn[onclick*="DINE_IN"]');
    if (dineInBtn && typeof setOrderType === 'function') {
        setOrderType('DINE_IN', dineInBtn);
    }
});

// Utility: Save to LocalStorage
// Utility: Save to LocalStorage and Sync to Supabase
async function saveData() {
    localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
    localStorage.setItem('anokhi_sales', JSON.stringify(salesHistory));
    localStorage.setItem('anokhi_tables', JSON.stringify(tables));
    localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
    localStorage.setItem('anokhi_active_orders', JSON.stringify(activeOrders));

    // Async push to Supabase
    if (!db) return;
    try {
        // Upsert inventory
        if (inventory.length > 0) {
            await db.from('inventory').upsert(inventory.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                item_type: i.itemType || 'Veg',
                price: i.price,
                quantity: i.quantity,
                low_stock_threshold: i.lowStockThreshold || 5
            })));
        }
        
        // Upsert tables
        if (tables.length > 0) {
            await db.from('tables').upsert(tables.map(t => ({
                id: t.id,
                name: t.name,
                cart: t.cart,
                advance: t.advance,
                advance_mode: t.advanceMode
            })));
        }

        // Upsert Active Orders
        if (activeOrders.length > 0) {
            await db.from('active_orders').upsert(activeOrders.map(o => ({
                id: o.id,
                order_type: o.orderType,
                items: o.items,
                total: o.total,
                discount: o.discount,
                round_off: o.roundOff,
                customer_name: o.customerName,
                customer_mobile: o.customer_mobile,
                created_at: o.createdAt
            })));
        }

        // For sales history, we usually only add new ones, but upsert is safer if we allow edits
        if (expensesHistory.length > 0) { await db.from('expenses').upsert(expensesHistory); }

        if (salesHistory.length > 0) {
            await db.from('sales_history').upsert(salesHistory.map(s => ({
                id: s.id,
                date: s.date,
                items: s.items,
                total: s.total,
                discount: s.discount,
                round_off: s.roundOff,
                payment_mode: s.paymentMode,
                split_amounts: s.splitAmounts,
                order_type: s.orderType,
                table_name: s.tableName,
                advance_paid: s.advancePaid
            })));
        }
    } catch (err) {
        console.error('Push Error:', err);
    }
}

// Format Currency
function formatCurrency(amount) {
    return String.fromCharCode(8377) + parseFloat(amount).toFixed(2);
}

// Format Date to DD/MM/YYYY
function getDDMMYYYY(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format Date & Time
function formatDateTime(isoString) {
    const d = new Date(isoString);
    const datePart = getDDMMYYYY(d);
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    
    return `${datePart}, ${strTime}`;
}

// Modals
window.openAddItemModal = function() {
    document.getElementById('item-form').reset();
    document.getElementById('item-id').value = '';
    document.getElementById('item-low-stock').value = '5';
    document.getElementById('modal-title').innerText = 'Add New Item';
    // Reset veg/nonveg to Veg
    const vegRadio = document.getElementById('type-veg');
    if (vegRadio) vegRadio.checked = true;
    // Populate item name datalist from existing inventory
    populateItemNameDatalist();
    openModal('addItemModal');
}

function populateItemNameDatalist() {
    const dl = document.getElementById('item-name-list');
    if (!dl) return;
    dl.innerHTML = inventory.map(i => `<option value="${i.name}"></option>`).join('');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

window.showStockList = function(type) {
    let list = [];
    let title = '';
    
    if (type === 'total') {
        list = inventory;
        title = 'Total Items Available';
    } else if (type === 'low') {
        list = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0);
        title = 'Low Stock Items';
    } else if (type === 'out') {
        list = inventory.filter(i => i.quantity === 0);
        title = 'Out of Stock Items';
    }
    
    document.getElementById('stock-list-title').innerText = title;
    const tbody = document.getElementById('stock-list-tbody');
    tbody.innerHTML = '';
    
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No items found in this category.</td></tr>';
    } else {
        list.forEach(item => {
            let statusColor = 'var(--success-color)';
            if (item.quantity === 0) statusColor = 'var(--danger-color)';
            else if (item.quantity <= (item.lowStockThreshold || 5)) statusColor = 'var(--warning-color)';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${truncateName(item.name)}</td>
                <td>${item.category}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${item.quantity}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    openModal('stockListModal');
}

window.showTodaySalesList = function() {
    const todayStr = getDDMMYYYY(new Date());
    let todaySales = salesHistory.filter(s => getDDMMYYYY(new Date(s.date)) === todayStr);
    
    // aggregate items
    let itemsSold = {};
    todaySales.forEach(sale => {
        sale.items.forEach(item => {
            if(!itemsSold[item.id]) {
                itemsSold[item.id] = { name: item.name, qty: 0, total: 0 };
            }
            itemsSold[item.id].qty += item.cartQty;
            itemsSold[item.id].total += item.price * item.cartQty;
        });
    });
    
    const tbody = document.getElementById('today-sales-tbody');
    tbody.innerHTML = '';
    
    const itemIds = Object.keys(itemsSold);
    if (itemIds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No items sold today.</td></tr>';
    } else {
        itemIds.forEach(id => {
            const data = itemsSold[id];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${truncateName(data.name)}</td>
                <td style="font-weight:bold; color:var(--accent-color);">${data.qty}</td>
                <td>${formatCurrency(data.total)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    openModal('todaySalesModal');
}

// Dashboard Logic
function updateDashboard() {
    const todayStr = getDDMMYYYY(new Date());
    let todaySales = salesHistory.filter(s => getDDMMYYYY(new Date(s.date)) === todayStr);
    let todayRev = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    
    let todayCash = todaySales.reduce((sum, sale) => {
        if (sale.paymentMode === 'BOTH') return sum + sale.splitAmounts.cash;
        return sum + ((sale.paymentMode || 'CASH') === 'CASH' ? sale.total : 0);
    }, 0);
    
    let todayUpi = todaySales.reduce((sum, sale) => {
        if (sale.paymentMode === 'BOTH') return sum + sale.splitAmounts.upi;
        return sum + (sale.paymentMode === 'UPI' ? sale.total : 0);
    }, 0);

    // Profit Calculation (Today)
    const todayExpenses = expensesHistory.filter(e => getDDMMYYYY(new Date(e.date)) === todayStr);
    const todayExpTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfitToday = todayRev - todayExpTotal;
    
    const profitEl = document.getElementById('total-profit');
    if (profitEl) {
        profitEl.innerText = formatCurrency(netProfitToday);
        profitEl.style.color = netProfitToday >= 0 ? '#22c55e' : '#ef4444';
        const card = document.getElementById('profit-card');
        if (card) card.style.borderLeft = `4px solid ${netProfitToday >= 0 ? '#22c55e' : '#ef4444'}`;
    }

    let totalItems = inventory.length;
    let lowStock = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0).length;
    let outOfStock = inventory.filter(i => i.quantity === 0).length;

    document.getElementById('total-revenue').innerText = formatCurrency(todayRev);
    document.getElementById('today-cash').innerText = formatCurrency(todayCash);
    document.getElementById('today-upi').innerText = formatCurrency(todayUpi);

    document.getElementById('total-items').innerText = totalItems;
    document.getElementById('low-stock').innerText = lowStock;
    document.getElementById('out-of-stock').innerText = outOfStock;

    // Recent Sales
    const tbody = document.querySelector('#recent-sales-table tbody');
    tbody.innerHTML = '';
    
    const recentSales = [...salesHistory].slice(0, 5);
    if(recentSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent sales</td></tr>';
    }

    recentSales.forEach(sale => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${sale.id}</td>
            <td>${formatDateTime(sale.date)}</td>
            <td>${sale.items.length} items</td>
            <td>${formatCurrency(sale.total)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Inventory Logic
function handleItemSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const name = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const itemType = document.querySelector('input[name="item-type"]:checked')?.value || 'Veg';
    const price = parseFloat(document.getElementById('item-price').value);
    const quantity = parseInt(document.getElementById('item-quantity').value);
    const lowStockThreshold = parseInt(document.getElementById('item-low-stock').value) || 5;

    if (id) {
        // Update
        const index = inventory.findIndex(i => i.id == id);
        if(index > -1) {
            inventory[index] = { ...inventory[index], name, category, itemType, price, quantity, lowStockThreshold };
        }
    } else {
        // Add
        const isDuplicate = inventory.some(i => i.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (isDuplicate) {
            alert(`Duplicate Entry: An item named "${name}" already exists in the inventory. Please use a unique name.`);
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            name, category, itemType, price, quantity, lowStockThreshold
        };
        inventory.push(newItem);
    }

    saveData();
    closeModal('addItemModal');
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof updateDashboard === 'function') updateDashboard();
}

function renderInventory() {
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';

    let filtered = inventory;
    if (inventoryTypeFilter === 'veg') {
        filtered = inventory.filter(i => (i.itemType || '').toLowerCase().replace(/[- ]/g, '') !== 'nonveg');
    } else if (inventoryTypeFilter === 'nonveg') {
        filtered = inventory.filter(i => (i.itemType || '').toLowerCase().replace(/[- ]/g, '') === 'nonveg');
    }

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No items found.</td></tr>';
        return;
    }

    filtered.forEach(item => {
        let statusClass = 'status-instock';
        let statusText = 'In Stock';
        
        if (item.quantity === 0) {
            statusClass = 'status-outstock';
            statusText = 'Out of Stock';
        } else if (item.quantity <= (item.lowStockThreshold || 5)) {
            statusClass = 'status-lowstock';
            statusText = 'Low Stock';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${truncateName(item.name)}</strong></td>
            <td>${item.category}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn" style="color: var(--success-color); border: 1px solid var(--success-color); background: rgba(16, 185, 129, 0.1);" onclick="openRestockModal('${item.id}')" title="Add Stock"><i class="fa-solid fa-plus"></i></button>
                <button class="action-btn edit" onclick="editItem('${item.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteItem('${item.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openRestockModal = function(id) {
    const item = inventory.find(i => i.id === id);
    if(item) {
        document.getElementById('restock-item-id').value = item.id;
        document.getElementById('restock-item-name').innerText = `Adding stock for: ${item.name}`;
        document.getElementById('restock-quantity').value = '';
        openModal('restockModal');
    }
}

function handleRestockSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('restock-item-id').value;
    const qtyToAdd = parseInt(document.getElementById('restock-quantity').value);

    const index = inventory.findIndex(i => i.id == id);
    if(index > -1 && qtyToAdd > 0) {
        inventory[index].quantity += qtyToAdd;
        saveData();
        closeModal('restockModal');
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updateDashboard === 'function') updateDashboard();
    }
}

window.editItem = function(id) {
    const item = inventory.find(i => i.id === id);
    if(item) {
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-category').value = item.category;
        const isNonVeg = (item.itemType || '').toLowerCase().replace(/[- ]/g, '') === 'nonveg';
        const typeRadio = document.getElementById(isNonVeg ? 'type-nonveg' : 'type-veg');
        if (typeRadio) typeRadio.checked = true;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-quantity').value = item.quantity;
        document.getElementById('item-low-stock').value = item.lowStockThreshold || 5;
        document.getElementById('modal-title').innerText = 'Edit Item';
        populateItemNameDatalist();
        openModal('addItemModal');
    }
}

window.deleteItem = async function(id) {
    if(confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(i => i.id !== id);
        saveData();
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updateDashboard === 'function') updateDashboard();
        
        // Explicit delete from Supabase
        await db.from('inventory').delete().eq('id', id);
    }
}

// POS Logic
function renderCart() {
    const cartContainer = document.getElementById('cart-items-modern');
    if (!cartContainer) return;
    cartContainer.innerHTML = '';
    
    if (cart.length > 0) {
        const header = document.createElement('div');
        header.className = 'cart-header-modern';
        header.innerHTML = `
            <div class="cart-col-sr">SR</div>
            <div class="cart-col-info">ITEMS</div>
            <div class="cart-col-qty">QTY.</div>
            <div class="cart-col-total">PRICE</div>
            <div class="cart-col-action"></div>
        `;
        cartContainer.appendChild(header);
    }

    let subtotal = 0;
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.cartQty;
        subtotal += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item-modern';
        div.innerHTML = `
            <div class="cart-col-sr">${index + 1}</div>
            <div class="cart-col-info">
                <div class="cart-item-name">${truncateName(item.name)}</div>
                <div class="cart-item-unit-price">${formatCurrency(item.price)} / itm</div>
            </div>
            <div class="cart-col-qty">
                <div class="qty-selector">
                    <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty-val">${item.cartQty}</span>
                    <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
            <div class="cart-col-total">${formatCurrency(itemTotal)}</div>
            <div class="cart-col-action">
                <button class="cart-delete-btn" onclick="updateCartQty('${item.id}', -${item.cartQty})" title="Remove Item">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
        cartContainer.appendChild(div);
    });


    const subtotalEl = document.getElementById('cart-subtotal');
    if (subtotalEl) subtotalEl.innerText = formatCurrency(subtotal);
    calculateTotal();
    
    // Also refresh POS items grid
    const searchVal = document.getElementById('pos-search') ? document.getElementById('pos-search').value : '';
    if (typeof window.renderPOSItems === 'function') {
        window.renderPOSItems(searchVal);
    } else if (typeof renderPOSItems === 'function') {
        renderPOSItems(searchVal);
    }
}

window.newBill = function() {
    // If cart has items, ask for confirmation
    if (cart.length > 0) {
        if (!confirm('Are you sure you want to cancel this order? All unsaved changes will be lost.')) {
            return;
        }
    }

    // If a table is selected, clear its saved cart and advance as well (Full Cancel)
    if (currentSelectedTable) {
        const tableIndex = tables.findIndex(t => t.id === currentSelectedTable);
        if (tableIndex > -1) {
            tables[tableIndex].cart = [];
            tables[tableIndex].advance = 0;
            saveData();
        }
    }
    
    // Reset POS State
    currentSelectedTable = null;
    cart = [];
    document.getElementById('current-table-name').innerText = 'No Table Selected';
    document.getElementById('advance-paid-info').style.display = 'none';
    
    // Reset to default Order Type UI (Dine-In)
    const dineInBtn = document.querySelector('.order-type-btn[onclick*="DINE_IN"]');
    if (dineInBtn) setOrderType('DINE_IN', dineInBtn);
    
    renderCart();
    renderTableGrid(); // Update the grid so table turns from RED to GLASS/GREEN
    if(typeof renderPOSItems === 'function') renderPOSItems(); 
}

window.calculateTotal = function() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
    let discPercentInput = document.getElementById('cart-discount-percent');
    let discFixedInput = document.getElementById('cart-discount-fixed');
    
    let discPercent = discPercentInput ? (parseFloat(discPercentInput.value) || 0) : 0;
    let discFixed = discFixedInput ? (parseFloat(discFixedInput.value) || 0) : 0;
    
    // Ensure % is not more than 100
    if (discPercent > 100) {
        discPercent = 100;
        if(discPercentInput) discPercentInput.value = 100;
    }

    let discountAmount = (subtotal * (discPercent / 100)) + discFixed;

    // Ensure total discount is not more than subtotal
    if (discountAmount > subtotal) {
        discountAmount = subtotal;
    }
    
    let advancePaid = 0;
    if (selectedOrderType === 'DINE_IN' && currentSelectedTable) {
        const table = tables.find(t => t.id === currentSelectedTable);
        if (table) advancePaid = table.advance;
    }

    let totalBeforeRound = subtotal - discountAmount - advancePaid;
    let finalTotal = Math.max(0, Math.round(totalBeforeRound));
    let refundAmount = totalBeforeRound < 0 ? Math.abs(Math.round(totalBeforeRound)) : 0;

    const refundInfo = document.getElementById('refund-info');
    const totalLabel = document.getElementById('cart-total-label');
    if(totalLabel) totalLabel.innerText = (refundAmount > 0) ? 'Payable' : 'Total';

    document.getElementById('cart-total').innerText = formatCurrency(finalTotal);
    
    // Update dues whenever total changes
    if (typeof calculateDues === 'function') calculateDues();
    
    return { subtotal, discount: discountAmount, advance: advancePaid, roundOff, total: finalTotal };
}

window.clearCart = function() {
    cart = [];
    const discPercentIn = document.getElementById('cart-discount-percent');
    const discFixedIn = document.getElementById('cart-discount-fixed');
    if(discPercentIn) discPercentIn.value = '';
    if(discFixedIn) discFixedIn.value = '';
    
    // Reset payment fields
    const cashIn = document.getElementById('pay-cash-amount');
    const upiIn = document.getElementById('pay-upi-amount');
    if(cashIn) cashIn.value = '';
    if(upiIn) upiIn.value = '';

    // Reset editing state
    editingSaleId = null;
    previousPaidAmount = 0;
    const prevPaidRow = document.getElementById('prev-paid-row');
    if(prevPaidRow) prevPaidRow.style.display = 'none';
    
    renderCart();
}

window.calculateDues = function() {
    const totalEl = document.getElementById('cart-total');
    if (!totalEl) return;
    
    const totalStr = totalEl.innerText.replace(/[^0-9.]/g, '');
    const finalTotal = parseFloat(totalStr) || 0;
    
    const cashInput = document.getElementById('pay-cash-amount');
    const upiInput = document.getElementById('pay-upi-amount');
    
    let cashPaid = parseFloat(cashInput.value) || 0;
    let upiPaid = parseFloat(upiInput.value) || 0;
    
    // Total Paid = Previous + Current
    let totalPaid = previousPaidAmount + cashPaid + upiPaid;
    
    let dues = Math.max(0, finalTotal - totalPaid);
    
    // Update the UI element and visibility
    const duesEl = document.getElementById('cart-dues');
    const duesRow = document.getElementById('dues-row');
    if (duesEl) duesEl.innerText = formatCurrency(dues);
    
    if (duesRow) {
        if (dues > 0.01) {
            duesRow.style.display = 'flex';
            duesRow.style.color = 'var(--danger-color)';
            // Clear any error states
            cashInput.style.borderColor = '';
            upiInput.style.borderColor = '';
        } else if (totalPaid > finalTotal + 0.01) {
            // OVERPAYMENT CASE: Show warning
            duesRow.style.display = 'flex';
            duesRow.style.color = '#ff4d4d';
            document.getElementById('cart-dues').innerText = 'Limit Exceeded!';
            cashInput.style.borderColor = '#ff4d4d';
            upiInput.style.borderColor = '#ff4d4d';
        } else {
            duesRow.style.display = 'none';
            cashInput.style.borderColor = '';
            upiInput.style.borderColor = '';
        }
    }
}

window.toggleSplitPayment = function() {
    // Redundant now as both fields are always visible
    calculateDues();
}

window.processSale = function() {
    if(cart.length === 0) return alert('Cart is empty!');

    if (selectedOrderType === 'DINE_IN' && !currentSelectedTable) {
        return alert('Validation Error: Please select a table before completing a Dine-In sale.');
    }

    const totals = calculateTotal();
    const total = totals.total;
    const payCash = parseFloat(document.getElementById('pay-cash-amount').value) || 0;
    const payUpi = parseFloat(document.getElementById('pay-upi-amount').value) || 0;
    
    let currentPaid = payCash + payUpi;
    let totalPaidCombined = (typeof previousPaidAmount !== 'undefined' ? previousPaidAmount : 0) + currentPaid;

    // VALIDATION: Prevent overpayment
    if (totalPaidCombined > total + 0.01) {
        alert('Invalid Payment! Total paid amount (₹' + totalPaidCombined.toFixed(2) + ') cannot exceed the Bill Total (₹' + total.toFixed(2) + '). Please correct the amount.');
        return;
    }

    const dues = total - totalPaidCombined;

    if (dues > 0.01) {
        // CREDIT SALE: Require customer details
        document.getElementById('modal-dues-amount').innerText = formatCurrency(dues);
        document.getElementById('cust-name').value = '';
        document.getElementById('cust-mobile').value = '';
        openModal('customerModal');
    } else {
        // NORMAL SALE: Just confirm
        if (!confirm('Are you sure you want to complete this sale?')) {
            return;
        }
        finalizeSaleRecord();
    }
}

window.completeCreditSale = function() {
    const name = document.getElementById('cust-name').value.trim();
    const mobile = document.getElementById('cust-mobile').value.trim();
    
    if (!name || !mobile) {
        return alert('Please enter both Customer Name and Mobile Number.');
    }
    if (mobile.length !== 10) {
        return alert('Please enter a valid 10-digit mobile number.');
    }
    
    finalizeSaleRecord(name, mobile);
    closeModal('customerModal');
}

// Active Orders (Hold/Takeaway) Logic
window.holdOrder = async function() {
    console.log("Hold Order Triggered. Cart Length:", cart.length);
    
    if (!cart || cart.length === 0) {
        return alert('Cart is empty! Please add some items first.');
    }
    
    // For Dine-In, we already have table-based persistence
    if (selectedOrderType === 'DINE_IN' && !currentSelectedTable) {
        return alert('Please select a Table first or switch to Takeaway mode to hold this order.');
    }

    try {
        const totals = calculateTotal();
        const newActiveOrder = {
            id: `ACT-${Date.now()}`,
            orderType: selectedOrderType,
            items: JSON.parse(JSON.stringify(cart)), // Deep copy
            total: totals.total,
            discount: totals.discount || 0,
            roundOff: totals.roundOff || 0,
            customerName: document.getElementById('cust-name')?.value || null,
            customerMobile: document.getElementById('cust-mobile')?.value || null,
            createdAt: new Date().toISOString()
        };

        console.log("Saving Active Order:", newActiveOrder);
        activeOrders.unshift(newActiveOrder);
        
        // If it was a Dine-In table, clear that table's cart
        if (selectedOrderType === 'DINE_IN' && currentSelectedTable) {
            const tIdx = tables.findIndex(t => t.id === currentSelectedTable);
            if (tIdx > -1) {
                tables[tIdx].cart = [];
                tables[tIdx].advance = 0;
            }
        }

        await saveData();
        clearCart();
        
        // Reset state
        currentSelectedTable = null;
        const tableNameEl = document.getElementById('current-table-name');
        if (tableNameEl) tableNameEl.innerText = 'No Table Selected';
        
        if (typeof renderActiveOrders === 'function') renderActiveOrders();
        if (typeof renderTableGrid === 'function') renderTableGrid();
        
        alert('Order Success: Order is now on Hold.');
    } catch (error) {
        console.error("Hold Order Error:", error);
        alert('Error: Could not hold order. Check console for details.');
    }
};

window.loadActiveOrder = async function(id) {
    const order = activeOrders.find(o => o.id === id);
    if (!order) return;

    if (cart.length > 0) {
        if (!confirm('Cart has items. Replace with this active order?')) return;
    }

    cart = [...order.items];
    selectedOrderType = order.orderType;
    
    // Update UI for order type
    const btnClass = order.orderType === 'DINE_IN' ? 'DINE_IN' : (order.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'QUICK');
    const targetBtn = document.querySelector(`.order-type-btn[onclick*="${btnClass}"]`);
    if (targetBtn && typeof setOrderType === 'function') setOrderType(order.orderType, targetBtn);

    // Remove from active orders
    activeOrders = activeOrders.filter(o => o.id !== id);
    
    await saveData();
    
    // Explicitly delete from Supabase to ensure clean removal
    if (db) await db.from('active_orders').delete().eq('id', id);

    renderCart();
    if (typeof renderActiveOrders === 'function') renderActiveOrders();
    console.log('Order loaded from Hold.');
};

window.deleteActiveOrder = async function(id) {
    if (!confirm('Are you sure you want to delete this pending order?')) return;
    
    activeOrders = activeOrders.filter(o => o.id !== id);
    await saveData();
    if (db) await db.from('active_orders').delete().eq('id', id);
    
    if (typeof renderActiveOrders === 'function') renderActiveOrders();
};

window.renderActiveOrders = function() {
    const container = document.getElementById('active-orders-list');
    if (!container) return;
    container.innerHTML = '';

    if (activeOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:12px;">No pending takeaway orders.</div>';
        return;
    }

    activeOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'active-order-card glass-panel';
        card.style.cssText = 'margin-bottom:10px; padding:12px; border-left:3px solid var(--accent-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer;';
        card.onclick = () => loadActiveOrder(order.id);
        
        const timeStr = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const typeIcon = order.orderType === 'TAKEAWAY' ? 'fa-bag-shopping' : 'fa-bolt';
        
        card.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:700; font-size:13px; display:flex; align-items:center; gap:5px;">
                    <i class="fa-solid ${typeIcon}" style="color:var(--accent-color);"></i>
                    <span>${order.orderType}</span>
                    <span style="font-size:10px; color:var(--text-secondary); font-weight:400;">(${timeStr})</span>
                </div>
                <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">
                    ${order.items.length} items • <strong>${formatCurrency(order.total)}</strong>
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="action-btn" style="color:var(--danger-color); font-size:12px;" onclick="event.stopPropagation(); deleteActiveOrder('${order.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
};

function finalizeSaleRecord(custName = null, custMobile = null) {
    const totals = calculateTotal();
    const total = totals.total;
    const discount = totals.discount;
    const roundOff = totals.roundOff;
    // Get current payment values
    const payCash = parseFloat(document.getElementById('pay-cash-amount').value) || 0;
    const payUpi = parseFloat(document.getElementById('pay-upi-amount').value) || 0;

    // Merge payments if editing
    let finalCash = payCash;
    let finalUpi = payUpi;
    let finalSaleId = Math.floor(100000 + Math.random() * 900000).toString();
    let finalCustName = custName;
    let finalCustMobile = custMobile;

    if (editingSaleId) {
        const oldSale = salesHistory.find(s => s.id == editingSaleId);
        if (oldSale) {
            finalSaleId = oldSale.id;
            finalCash += (oldSale.splitAmounts?.cash || 0);
            finalUpi += (oldSale.splitAmounts?.upi || 0);
            if (!finalCustName) finalCustName = oldSale.customerName;
            if (!finalCustMobile) finalCustMobile = oldSale.customerMobile;
            
            // Remove old record
            salesHistory = salesHistory.filter(s => s.id != editingSaleId);
        }
    }

    const finalSplitAmounts = { cash: finalCash, upi: finalUpi };

    // Deduct Inventory
    cart.forEach(cartItem => {
        const invItem = inventory.find(i => i.id === cartItem.id);
        if(invItem) {
            invItem.quantity -= cartItem.cartQty;
        }
    });

    // Record Sale
    const sale = {
        id: finalSaleId,
        date: new Date().toISOString(),
        items: [...cart],
        total: total,
        discount: discount,
        roundOff: roundOff,
        paymentMode: (finalCash > 0 && finalUpi > 0) ? 'BOTH' : (finalUpi > 0 ? 'UPI' : 'CASH'),
        splitAmounts: finalSplitAmounts,
        orderType: selectedOrderType,
        tableName: selectedOrderType === 'DINE_IN' && currentSelectedTable ? tables.find(t => t.id === currentSelectedTable).name : null,
        advancePaid: totals.advance,
        customerName: finalCustName,
        customerMobile: finalCustMobile,
        dues: Math.max(0, total - (finalCash + finalUpi))
    };
    
    // Clear held table if applicable
    if (selectedOrderType === 'DINE_IN' && currentSelectedTable) {
        const tableIndex = tables.findIndex(t => t.id === currentSelectedTable);
        if (tableIndex > -1) {
            tables[tableIndex].cart = [];
            tables[tableIndex].advance = 0;
        }
    }

    salesHistory.unshift(sale);
    saveData();

    // Reset editing state
    editingSaleId = null;
    previousPaidAmount = 0;
    const prevPaidRow = document.getElementById('prev-paid-row');
    if(prevPaidRow) prevPaidRow.style.display = 'none';

    // Show Receipt Modal
    showReceipt(sale);

    // Reset UI
    currentSelectedTable = null;
    document.getElementById('current-table-name').innerText = 'No Table Selected';
    document.getElementById('advance-paid-info').style.display = 'none';
    clearCart();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderPOSItems === 'function') renderPOSItems();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderTableGrid === 'function') renderTableGrid();
}

function showReceipt(sale) {
    const details = document.getElementById('receipt-details');
    let itemsHtml = sale.items.map(i => `
        <div class="receipt-item">
            <span>${truncateName(i.name)} (x${i.cartQty})</span>
            <span>${formatCurrency(i.price * i.cartQty)}</span>
        </div>
    `).join('');

    const totalPaid = (sale.splitAmounts?.cash || 0) + (sale.splitAmounts?.upi || 0);

    details.innerHTML = `
        <p style="text-align:center; color:var(--text-secondary); margin-bottom: 4px;">Order #${sale.id}</p>
        <p style="text-align:center; color:var(--text-secondary); font-size: 11px; margin-bottom: 8px;">${formatDateTime(sale.date)}</p>
        
        <div style="text-align:center; margin-bottom: 16px;">
            <span class="status-badge" style="background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 14px; padding: 4px 16px;">
                ${sale.orderType === 'DINE_IN' ? '<i class="fa-solid fa-utensils"></i> DINE-IN' : 
                  sale.orderType === 'TAKEAWAY' ? '<i class="fa-solid fa-bag-shopping"></i> TAKEAWAY' : 
                  '<i class="fa-solid fa-bolt"></i> COUNTER QUICK'}
            </span>
            ${sale.tableName ? `<div style="margin-top: 5px; font-weight: 700; color: var(--accent-color);">${sale.tableName}</div>` : ''}
        </div>

        ${sale.customerName ? `
        <div style="background: rgba(245, 158, 11, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px dashed var(--warning-color);">
            <div style="font-size: 12px; color: var(--text-secondary);">Customer Details (Credit Sale)</div>
            <div style="font-weight: 700; color: var(--warning-color);">${sale.customerName}</div>
            <div style="font-size: 13px; color: var(--text-primary);">${sale.customerMobile}</div>
        </div>
        ` : ''}

        <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px;">
            ${itemsHtml}
            
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px; padding-top: 12px;">
                ${sale.discount > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 14px; color: var(--warning-color);">
                    <span>Discount</span>
                    <span>-${formatCurrency(sale.discount)}</span>
                </div>` : ''}
                ${sale.advancePaid > 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 14px; color: var(--warning-color);">
                    <span>Advance Already Paid</span>
                    <span>-${formatCurrency(sale.advancePaid)}</span>
                </div>` : ''}
                ${sale.roundOff && sale.roundOff !== 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 14px; color: var(--text-secondary);">
                    <span>Round Off</span>
                    <span>${(sale.roundOff >= 0 ? '+' : '') + formatCurrency(sale.roundOff).replace('Î“Ã©â•£-', '-Î“Ã©â•£')}</span>
                </div>` : ''}
                
                <div style="display:flex; justify-content:space-between; margin-top: 10px; font-weight:bold; font-size: 18px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                    <span>Grand Total</span>
                    <span style="color:var(--success-color);">${formatCurrency(sale.total)}</span>
                </div>

                ${sale.dues > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--text-primary); font-weight: 600;">
                    <span>Paid Amount</span>
                    <span>${formatCurrency(totalPaid)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 16px; color: #f87171; font-weight: 800; background: rgba(248, 113, 113, 0.1); padding: 5px; border-radius: 4px;">
                    <span>Dues / Baki</span>
                    <span>${formatCurrency(sale.dues)}</span>
                </div>
                ` : `
                <div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--success-color); font-weight: 700; text-align: center; display: block;">
                    <i class="fa-solid fa-circle-check"></i> FULLY PAID (${sale.paymentMode})
                </div>
                `}
            </div>
        </div>
    `;

    openModal('receiptModal');
}

let currentCalendarDate = null;
let showOnlyDues = false; // New global flag for filtering

window.updateCalendarView = function() {
    const m = parseInt(document.getElementById('calendar-month-select').value);
    const y = parseInt(document.getElementById('calendar-year-select').value);
    currentCalendarDate = new Date(y, m, 1);
    
    renderHistory();
}

function renderCalendarChart(dailyTotals) {
    const wrapper = document.getElementById('calendar-wrapper');
    if(!wrapper) return;

    let targetDate = new Date();
    if (currentCalendarDate) {
        targetDate = currentCalendarDate;
    } else {
        currentCalendarDate = targetDate;
    }
    
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); // 0-6 (Sun-Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let monthOptions = monthNames.map((m, idx) => `<option value="${idx}" ${idx === month ? 'selected' : ''}>${m}</option>`).join('');
    
    let currentYearObj = new Date().getFullYear();
    let years = [];
    for(let y = currentYearObj - 5; y <= currentYearObj + 5; y++) {
        years.push(y);
    }
    let yearOptions = years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('');
    
    let html = `
        <div style="text-align: center; margin-bottom: 16px; display: flex; justify-content: center; gap: 10px;">
            <select id="calendar-month-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="updateCalendarView()">
                ${monthOptions}
            </select>
            <select id="calendar-year-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="updateCalendarView()">
                ${yearOptions}
            </select>
        </div>
        <div class="calendar-header">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-chart">
    `;
    
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = String(day).padStart(2, '0') + '/' + String(month + 1).padStart(2, '0') + '/' + year;
        const total = dailyTotals[dStr] ? dailyTotals[dStr].total : 0;
        const orders = dailyTotals[dStr] ? dailyTotals[dStr].orders : 0;
        const cashAmt = dailyTotals[dStr] ? dailyTotals[dStr].cash : 0;
        const upiAmt = dailyTotals[dStr] ? dailyTotals[dStr].upi : 0;
        
        let extraClass = total > 0 ? 'has-sales' : '';
        let displayTotal = total > 0 ? formatCurrency(total) : '-';
        let displayOrders = orders > 0 ? `${orders} order(s)` : '';
        let breakdownHtml = total > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1);">
                <span style="color:var(--success-color);" title="Cash Sale">Cash: ${cashAmt}</span>
                <span style="color:#818cf8;" title="UPI Sale">UPI: ${upiAmt}</span>
            </div>
        ` : '';

        html += `
            <div class="calendar-day ${extraClass}" title="${dStr}">
                <div class="flex-between">
                    <span class="calendar-date-num">${day}</span>
                    <span style="font-size: 11px; color: var(--text-secondary);">${displayOrders}</span>
                </div>
                <div class="calendar-sales-amt">${displayTotal}</div>
                ${breakdownHtml}
            </div>
        `;
    }
    
    html += `</div>`;
    wrapper.innerHTML = html;
}

window.toggleDuesFilter = function() {
    showOnlyDues = !showOnlyDues;
    const statusText = document.getElementById('dues-filter-status');
    const card = document.getElementById('dues-filter-card');
    
    if (showOnlyDues) {
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
    
    renderHistory();
}

// History Logic
function renderHistory() {
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = '';

    if(salesHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No sales history found.</td></tr>';
        renderCalendarChart({});
        return;
    }

    // Calculate Monthly Calendar Totals
    const calendarTotals = {};
    salesHistory.forEach(sale => {
        const dateStr = getDDMMYYYY(new Date(sale.date));
        if(!calendarTotals[dateStr]) {
            calendarTotals[dateStr] = { orders: 0, total: 0, cash: 0, upi: 0 };
        }
        calendarTotals[dateStr].orders += 1;
        calendarTotals[dateStr].total += sale.total;
        
        const pMode = sale.paymentMode || 'CASH';
        if(pMode === 'UPI') {
            calendarTotals[dateStr].upi += sale.total;
        } else if (pMode === 'BOTH' && sale.splitAmounts) {
            calendarTotals[dateStr].upi += (sale.splitAmounts.upi || 0);
            calendarTotals[dateStr].cash += (sale.splitAmounts.cash || 0);
        } else {
            calendarTotals[dateStr].cash += sale.total;
        }
    });

    renderCalendarChart(calendarTotals);

    // Calculate Monthly Summary for the cards in Header
    const targetMonth = currentCalendarDate ? currentCalendarDate.getMonth() : new Date().getMonth();
    const targetYear = currentCalendarDate ? currentCalendarDate.getFullYear() : new Date().getFullYear();

    const monthlySales = salesHistory.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const monthlyExpenses = expensesHistory.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    let mTotal = 0, mCash = 0, mUpi = 0;
    monthlySales.forEach(s => {
        mTotal += s.total;
        if (s.paymentMode === "UPI") mUpi += s.total;
        else if (s.paymentMode === "BOTH" && s.splitAmounts) {
            mUpi += (s.splitAmounts.upi || 0);
            mCash += (s.splitAmounts.cash || 0);
        } else mCash += s.total;
    });

    const mExpTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const mNetProfit = mTotal - mExpTotal;

    // Update UI Cards
    const mSaleEl = document.getElementById("monthly-sale-total");
    const mCashEl = document.getElementById("monthly-cash");
    const mUpiEl = document.getElementById("monthly-upi");
    
    if (mSaleEl) mSaleEl.innerText = formatCurrency(mTotal);
    if (mCashEl) mCashEl.innerText = formatCurrency(mCash);
    if (mUpiEl) mUpiEl.innerText = formatCurrency(mUpi);
    
    const mExpEl = document.getElementById("monthly-expense-total");
    if (mExpEl) mExpEl.innerText = formatCurrency(mExpTotal);
    
    // Calculate Total Dues from all time
    const totalDuesHistory = salesHistory.reduce((sum, s) => sum + (parseFloat(s.dues) || 0), 0);
    const totalDuesHistoryEl = document.getElementById("history-total-dues");
    if (totalDuesHistoryEl) totalDuesHistoryEl.innerText = formatCurrency(totalDuesHistory);

    const mProfitEl = document.getElementById("monthly-profit-total");
    if (mProfitEl) {
        mProfitEl.innerText = formatCurrency(mNetProfit);
        mProfitEl.style.color = mNetProfit >= 0 ? "#22c55e" : "#ef4444";
        const mProfitCard = document.getElementById("monthly-profit-card");
        if (mProfitCard) mProfitCard.style.borderLeft = `4px solid ${mNetProfit >= 0 ? "#22c55e" : "#ef4444"}`;
    }

    const sortedHistory = showOnlyDues 
        ? salesHistory.filter(s => (s.dues || 0) > 0.01) 
        : salesHistory;

    sortedHistory.forEach(sale => {
        if (!sale) return;
        const items = sale.items || [];
        const itemsStr = items.map(i => `${i.name || 'Unknown'} (x${i.cartQty || 0})`).join(', ');
        
        const tr = document.createElement('tr');
        
        const pMode = sale.paymentMode || 'CASH';
        let pModeBadge = '';
        
        if (sale.status === 'HELD') {
            pModeBadge = '<span class="status-badge" style="background: #334155; color: white; font-weight: 800;">HELD</span>';
        } else if (sale.status === 'ADVANCE') {
            pModeBadge = '<span class="status-badge" style="background: var(--warning-color); color: white; font-weight: 800;">ADVANCE</span>';
        } else if (sale.dues > 0) {
            pModeBadge = '<span class="status-badge" style="background: #ef4444; color: white; font-weight: 800;">CREDIT</span>';
            pModeBadge += `<div style="font-size: 11px; color: #ef4444; margin-top: 4px; font-weight: 700;">Dues: ${formatCurrency(sale.dues)}</div>`;
        } else if (pMode === 'UPI') {
            pModeBadge = '<span class="status-badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">UPI</span>';
        } else if (pMode === 'BOTH') {
            pModeBadge = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">SPLIT</span>';
        } else {
            pModeBadge = '<span class="status-badge status-instock">CASH</span>';
        }

        // Highlight Row for Credit/Held/Advance
        if (sale.status === 'HELD' || sale.status === 'ADVANCE') {
            tr.style.background = '#fef9c3'; 
            tr.style.color = '#1e293b';      
            tr.style.borderLeft = '4px solid #f59e0b';
        } else if (sale.dues > 0) {
            tr.style.background = 'rgba(239, 68, 68, 0.05)'; 
            tr.style.borderLeft = '4px solid #ef4444';
        }

        const typeBadge = `
            <span style="font-size: 11px; display: block; color: ${sale.status ? '#475569' : 'var(--text-secondary)'}; margin-top: 4px;">
                ${sale.orderType === 'DINE_IN' ? 'Dine-In' : sale.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Counter'}
            </span>
        `;

        const displayDate = sale.date || sale.timestamp || new Date();

        tr.innerHTML = `
            <td style="color: inherit;">
                <strong>#${sale.id.toString().slice(-6)}</strong>
                ${typeBadge}
                ${sale.customerName ? `<div style="font-size: 11px; color: var(--warning-color); font-weight: 700; margin-top: 4px;"><i class="fa-solid fa-user"></i> ${sale.customerName}</div>` : ''}
            </td>
            <td style="color: inherit;">${formatDateTime(displayDate)}</td>
            <td style="color: inherit;"><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsStr}">${itemsStr}</div></td>
            <td>${pModeBadge}</td>
            <td style="color:${(sale.status || sale.dues > 0) ? '#1e293b' : 'var(--success-color)'}; font-weight:bold;">${formatCurrency(sale.total)}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-primary" style="padding: 6px 12px; font-size:12px;" onclick="viewReceipt('${sale.id}')">View</button>
                    <button class="btn-primary" style="padding: 6px 12px; font-size:12px; background: var(--warning-color); border: none;" onclick="editSale('${sale.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-danger" style="padding: 6px 12px; font-size:12px;" onclick="deleteSale('${sale.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add Load More button if there are potentially more records
    if (salesHistory.length >= 20) {
        const loadMoreRow = document.createElement('tr');
        loadMoreRow.id = 'load-more-row';
        loadMoreRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px;">
                <button id="load-more-btn" class="btn-primary" style="background: rgba(255,255,255,0.05); border: 1px solid var(--panel-border); width: 200px;" onclick="loadMoreSales()">
                    <i class="fa-solid fa-arrow-down"></i> Load More Transactions
                </button>
            </td>
        `;
        tbody.appendChild(loadMoreRow);
    }
}

let isLoadingMore = false;
window.loadMoreSales = async function() {
    if (isLoadingMore || !db) return;
    isLoadingMore = true;
    
    const btn = document.getElementById('load-more-btn');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;
    }

    try {
        const start = salesHistory.length;
        const end = start + 19;
        
        const { data, error } = await db.from('sales_history')
            .select('*')
            .order('date', { ascending: false })
            .range(start, end);

        if (error) throw error;

        if (data && data.length > 0) {
            salesHistory = [...salesHistory, ...data];
            // No need to re-render everything, just append to table
            if (typeof renderHistory === 'function') renderHistory(); 
        } else {
            // No more data
            if (btn) btn.innerHTML = 'No more transactions';
            setTimeout(() => {
                const row = document.getElementById('load-more-row');
                if (row) row.remove();
            }, 2000);
        }
    } catch (err) {
        console.error('Load More Error:', err);
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Error Loading';
            btn.disabled = false;
        }
    } finally {
        isLoadingMore = false;
    }
}

// Attach globally for inline onclick
window.viewReceipt = function(id) {
    const sale = salesHistory.find(s => s.id === id);
    if(sale) showReceipt(sale);
}

window.deleteSale = async function(saleId) {
    const password = prompt("Enter Admin Password to delete this sale:");
    if (password === '8540') {
        const saleIndex = salesHistory.findIndex(s => s.id === saleId);
        if (saleIndex > -1) {
            const sale = salesHistory[saleIndex];
            
            // Restock inventory
            sale.items.forEach(cartItem => {
                const invItem = inventory.find(i => i.id === cartItem.id);
                if (invItem) {
                    invItem.quantity += cartItem.cartQty;
                }
            });

            // Remove sale
            salesHistory.splice(saleIndex, 1);
            saveData();
            
            // Explicit delete from Supabase
            await db.from('sales_history').delete().eq('id', saleId);

            // Re-render
            renderHistory();
            updateDashboard();
            renderInventory();
            alert("Sale deleted and stock restored successfully.");
        }
    } else if (password !== null) {
        alert("Incorrect Password! You do not have permission to delete this sale.");
    }
}

// --- Expenses Logic ---
window.updateExpenseSubCats = function() {
    const mainCatRaw = document.getElementById('expense-main-cat').value;
    const mainCat = mainCatRaw.trim().toLowerCase();
    const subCatInput = document.getElementById('expense-sub-cat');
    const subCatList = document.getElementById('sub-cat-list');
    
    // Clear and hide sub category initially
    subCatList.innerHTML = '';

    const subCats = {
        'staff': ['Salary', 'Advance', 'Rent', 'Electricity Bill', 'Water Bill', 'Maintenance'],
        'material': ['Groceries', 'Vegetables', 'Gas Cylinder', 'Packaging', 'Meat/Chicken', 'Dairy Products']
    };

    // Flexible matching
    let matchedKey = null;
    if (mainCat.includes('staff')) matchedKey = 'staff';
    else if (mainCat.includes('material')) matchedKey = 'material';

    if (matchedKey) {
        subCatInput.disabled = false;
        subCats[matchedKey].forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            subCatList.appendChild(opt);
        });
    } else {
        subCatInput.disabled = true;
        subCatInput.value = ''; // Only clear if invalid
    }
}




window.handleExpenseSubmit = async function(e) {
    e.preventDefault();
    const mainCat = document.getElementById('expense-main-cat').value;
    const subCat = document.getElementById('expense-sub-cat').value;
    const desc = document.getElementById('expense-desc').value;

    const cash = parseFloat(document.getElementById('expense-cash').value) || 0;
    const upi = parseFloat(document.getElementById('expense-upi').value) || 0;
    const udhar = parseFloat(document.getElementById('expense-udhar').value) || 0;

    if (cash === 0 && upi === 0 && udhar === 0) {
        return alert('Please enter an amount in at least one field (Cash, UPI, or Udhar).');
    }

    const modes = [
        { name: 'Cash', val: cash },
        { name: 'UPI', val: upi },
        { name: 'Udhar', val: udhar }
    ];

    let addedCount = 0;
    modes.forEach(m => {
        if (m.val > 0) {
            const newExpense = {
                id: (Date.now() + addedCount).toString(),
                date: new Date().toISOString(),
                main_category: mainCat,
                sub_category: subCat,
                amount: m.val,
                payment_mode: m.name,
                description: desc
            };
            expensesHistory.unshift(newExpense);
            addedCount++;
        }
    });

    saveData();
    e.target.reset();
    renderExpenses();
    updateExpenseStats();
    alert('Expense(s) added successfully!');
}

function renderExpenses() {
    const tbody = document.getElementById('expenses-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    expensesHistory.forEach(exp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDateLabel(exp.date)}</td>
            <td>${exp.main_category}</td>
            <td>${exp.sub_category}</td>
            <td>${formatCurrency(exp.amount)}</td>
            <td><span class="status-badge" style="background:rgba(255,255,255,0.1)">${exp.payment_mode}</span></td>
            <td title="${exp.description || ''}">${exp.description ? (exp.description.substring(0, 20) + (exp.description.length > 20 ? '...' : '')) : '-'}</td>
            <td>
                <button class="btn-danger" style="padding:4px 8px; font-size:10px;" onclick="deleteExpense('${exp.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteExpense = async function(id) {
    if(confirm('Are you sure you want to delete this expense?')) {
        expensesHistory = expensesHistory.filter(e => e.id !== id);
        saveData();
        
        if(db) {
            try {
                await db.from('expenses').delete().eq('id', id);
            } catch(err) {
                console.error('Delete Expense Error:', err);
            }
        }
        
        renderExpenses();
        updateExpenseStats();
    }
}

let analyticsChart = null;

function updateExpenseStats() {
    // Generate analytics data for the last 7 days
    const last7Days = [];
    const salesData = [];
    const expensesData = [];
    const profitData = [];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const dateFull = getDDMMYYYY(d);
        
        last7Days.push(dateLabel);

        const daySales = salesHistory
            .filter(s => getDDMMYYYY(new Date(s.date)) === dateFull)
            .reduce((sum, s) => sum + (s.total || 0), 0);
        
        const dayExpenses = expensesHistory
            .filter(e => getDDMMYYYY(new Date(e.date)) === dateFull)
            .reduce((sum, e) => sum + (e.amount || 0), 0);

        salesData.push(daySales);
        expensesData.push(dayExpenses);
        profitData.push(daySales - dayExpenses);
    }

    const ctx = document.getElementById('expenses-analytics-chart');
    if (!ctx) return;

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days,
            datasets: [
                {
                    label: 'Sales',
                    data: salesData,
                    backgroundColor: '#22c55e',
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                },
                {
                    label: 'Expenses',
                    data: expensesData,
                    backgroundColor: '#ef4444',
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                },
                {
                    label: 'Profit',
                    data: profitData,
                    backgroundColor: '#818cf8',
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Custom legend used in HTML
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + String.fromCharCode(8377) + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
                }
            }
        }
    });
}

function formatDateLabel(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

window.clearInput = function(id) {
    const input = document.getElementById(id);
    if (input) {
        input.value = '';
        input.focus();
        // Trigger both input and change events to ensure dependency logic runs
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}


window.openResetModal = function() {
    // Reset modal to Step 1
    document.getElementById('password-reset-fields').classList.add('force-hidden');
    document.getElementById('reset-action-btn').innerText = 'Verify Date of Birth';
    document.getElementById('reset-dob').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
    openModal('reset-password-modal');
}

window.handlePasswordReset = function() {
    const dob = document.getElementById('reset-dob').value;
    const passwordFields = document.getElementById('password-reset-fields');
    const actionBtn = document.getElementById('reset-action-btn');
    const adminDoB = localStorage.getItem('anokhi_admin_dob') || '1989-12-15';

    if (!dob) {
        alert('Please enter Admin Date of Birth.');
        return;
    }

    if (dob !== adminDoB) {
        alert('Security Check Failed: Incorrect Admin Date of Birth.');
        return;
    }

    // If step 1 is done, show step 2
    if (passwordFields.classList.contains('force-hidden')) {
        passwordFields.classList.remove('force-hidden');
        actionBtn.innerText = 'Update Password';
        return;
    }

    // Step 2: Handle actual reset
    const newPwd = document.getElementById('new-password').value;
    const confirmPwd = document.getElementById('confirm-new-password').value;

    if (!newPwd || !confirmPwd) {
        alert('Please enter and confirm your new password.');
        return;
    }

    localStorage.setItem('anokhi_admin_pwd', newPwd);
    alert('Password updated successfully! You can now login with your new password.');
    closeModal('reset-password-modal');
    document.getElementById('login-password').focus();
}






window.filterInventoryByType = function(type) {
    inventoryTypeFilter = type;
    // Update button styles
    const btns = { all: document.getElementById('filter-all'), veg: document.getElementById('filter-veg'), nonveg: document.getElementById('filter-nonveg') };
    if (btns.all) { btns.all.style.background = type==='all' ? 'var(--accent-color)' : 'transparent'; btns.all.style.color = type==='all' ? 'white' : 'var(--accent-color)'; }
    if (btns.veg) { btns.veg.style.background = type==='veg' ? '#22c55e' : 'transparent'; btns.veg.style.color = type==='veg' ? 'white' : '#22c55e'; }
    if (btns.nonveg) { btns.nonveg.style.background = type==='nonveg' ? '#ef4444' : 'transparent'; btns.nonveg.style.color = type==='nonveg' ? 'white' : '#ef4444'; }
    renderInventory();
}

// POS Filter logic moved to main.js

window.showView = function(target) {
    // Show target view
    views.forEach(v => {
        v.classList.remove('active');
        if(v.id === target) {
            v.classList.add('active');
        }
    });

    // Update active nav in sidebar
    navItems.forEach(item => {
        item.classList.remove('active');
        if(item.getAttribute('data-target') === target) {
            item.classList.add('active');
        }
    });

    // Refresh view specific data safely
    if(target === 'dashboard' && typeof updateDashboard === 'function') updateDashboard();
    if(target === 'inventory' && typeof renderInventory === 'function') renderInventory();
    if(target === 'pos' && typeof renderPOSItems === 'function') renderPOSItems();
    if(target === 'history' && typeof renderHistory === 'function') renderHistory();
    if(target === 'expenses') {
        if (typeof renderExpenses === 'function') renderExpenses();
        if (typeof updateExpenseStats === 'function') updateExpenseStats();
    }
    if(target === 'settings' && typeof initSettingsView === 'function') initSettingsView();
}

window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

window.editSale = function(id) {
    const sale = salesHistory.find(s => s.id == id);
    if (!sale) return;
    
    if (cart.length > 0) {
        if (!confirm('Current cart items will be cleared. Do you want to edit this sale?')) return;
    }
    
    // Store editing state
    editingSaleId = sale.id;
    previousPaidAmount = sale.total - (sale.dues || 0);
    
    // Load sale data into cart
    cart = sale.items.map(saleItem => {
        const invItem = inventory.find(i => i.name.trim().toLowerCase() === saleItem.name.trim().toLowerCase());
        if (invItem) {
            return { ...saleItem, id: invItem.id };
        }
        return { ...saleItem };
    });

    const type = sale.orderType || 'COUNTER';
    currentSelectedTable = sale.tableId || null;
    
    // Update UI
    showView('pos');
    
    // Show previous paid in UI
    const prevPaidRow = document.getElementById('prev-paid-row');
    const prevPaidEl = document.getElementById('cart-prev-paid');
    if (prevPaidRow && prevPaidEl) {
        prevPaidRow.style.display = 'flex';
        prevPaidEl.innerText = formatCurrency(previousPaidAmount);
    }
    
    // Clear search so items are visible
    const searchInput = document.getElementById('pos-search');
    if (searchInput) searchInput.value = '';
    
    // Set order type
    const targetBtn = Array.from(document.querySelectorAll('.order-type-btn')).find(btn => 
        btn.innerText.toUpperCase().includes(type)
    );
    if (targetBtn) setOrderType(type, targetBtn);
    
    calculateTotal(); // Refresh total and dues
    setOrderType(type, targetBtn, true);

    renderCart();
    if (typeof renderPOSItems === 'function') renderPOSItems(); 
}

// Global Keyboard Shortcuts
$(document).on('_disabled_keydown', function (e) {
    // Close Receipt Modal with Enter or Escape
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal && receiptModal.classList.contains('active')) {
        if (e.key === 'Enter' || e.key === 'Escape') {
            closeModal('receiptModal');
            e.preventDefault();
        }
    }
});

// Cart toggle moved to main.js

// Tables curtain toggle moved to main.js

// System Settings & Data Management
window.adjustTableCount = function(delta) {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    let current = parseInt(input.value) || 0;
    current = Math.max(1, current + delta);
    input.value = current;
}

window.saveSettings = function() {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    const count = parseInt(input.value);
    
    // Update tables array
    if (count > window.tables.length) {
        for (let i = window.tables.length; i < count; i++) {
            window.tables.push({
                id: `T${i + 1}`,
                name: `Table ${i + 1}`,
                cart: [],
                advance: 0
            });
        }
    } else {
        window.tables = window.tables.slice(0, count);
        tables = window.tables; // Update local reference too
    }
    
    saveData();
    alert(`Configuration Saved! ${count} tables are now available.`);
    
    if (typeof renderTableGrid === 'function') renderTableGrid();
    if (typeof refreshUI === 'function') refreshUI();
}

window.importItems = function() {
    if (!confirm('This will add 10 Bihar Special items to your inventory. Continue?')) return;
    
    const biharSpecial = [
        { id: 'BS01', name: 'Litti Chokha', price: 120, category: 'Main Course', itemType: 'Veg', status: 'In Stock', quantity: 50 },
        { id: 'BS02', name: 'Sattu Paratha', price: 80, category: 'Main Course', itemType: 'Veg', status: 'In Stock', quantity: 50 },
        { id: 'BS03', name: 'Bihari Fish Curry', price: 250, category: 'Main Course', itemType: 'Non-Veg', status: 'In Stock', quantity: 30 },
        { id: 'BS04', name: 'Champaran Mutton', price: 450, category: 'Main Course', itemType: 'Non-Veg', status: 'In Stock', quantity: 20 },
        { id: 'BS05', name: 'Dal Pitha', price: 90, category: 'Snacks', itemType: 'Veg', status: 'In Stock', quantity: 40 },
        { id: 'BS06', name: 'Thekua', price: 150, category: 'Dessert', itemType: 'Veg', status: 'In Stock', quantity: 100 },
        { id: 'BS07', name: 'Malpua', price: 100, category: 'Dessert', itemType: 'Veg', status: 'In Stock', quantity: 50 },
        { id: 'BS08', name: 'Bihari Chicken Curry', price: 280, category: 'Main Course', itemType: 'Non-Veg', status: 'In Stock', quantity: 30 },
        { id: 'BS09', name: 'Khaja', price: 120, category: 'Dessert', itemType: 'Veg', status: 'In Stock', quantity: 60 },
        { id: 'BS10', name: 'Chana Ghugni', price: 70, category: 'Snacks', itemType: 'Veg', status: 'In Stock', quantity: 50 }
    ];
    
    const existingIds = new Set(inventory.map(i => String(i.id)));
    const newItems = biharSpecial.filter(i => !existingIds.has(String(i.id)));
    
    if (newItems.length === 0) {
        return alert('Bihar Special items already exist in your inventory.');
    }
    
    inventory.push(...newItems);
    saveData();
    
    alert(`Success! ${newItems.length} Bihar Special items added to inventory.`);
    
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderPOSItems === 'function') renderPOSItems();
    if (typeof refreshUI === 'function') refreshUI();
}



