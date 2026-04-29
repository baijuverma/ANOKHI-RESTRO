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

// Data Structures (Initialized with local cache, will be updated from Supabase)
let inventory = JSON.parse(localStorage.getItem('anokhi_inventory')) || [];
let salesHistory = JSON.parse(localStorage.getItem('anokhi_sales')) || [];
let expensesHistory = JSON.parse(localStorage.getItem('anokhi_expenses')) || [];
let cart = [];
let selectedOrderType = 'DINE_IN';
let currentSelectedTable = null;
let tables = JSON.parse(localStorage.getItem('anokhi_tables')) || Array.from({length: 12}, (_, i) => ({
    id: `T${i+1}`,
    name: `Table ${i+1}`,
    cart: [],
    advance: 0,
    advanceMode: 'CASH'
}));

// Initial Data Sync from Supabase
async function syncFromSupabase() {
    if (!db) { console.warn('Supabase unavailable, skipping sync.'); return; }
    try {
        const { data: invData } = await db.from('inventory').select('*');
        if (invData) {
            inventory = invData;
            localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
        }

        const { data: salesData } = await db.from('sales_history').select('*').order('date', { ascending: false });
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
        }

        const { data: expData } = await db.from('expenses').select('*').order('date', { ascending: false });
        if (expData) {
            expensesHistory = expData;
            localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
        }

        // Re-render views
        renderInventory();
        renderPOSItems();
        renderHistory();
        renderTableGrid();
        renderExpenses();
        updateDashboard();
        updateExpenseStats();
    } catch (err) {
        console.error('Sync Error:', err);
    }
}

// DOM Elements
const views = document.querySelectorAll('.view-section');
const navItems = document.querySelectorAll('.nav-item');

// Initialize App
window.checkLogin = function() {
    const pwd = document.getElementById('login-password').value;
    const adminPassword = localStorage.getItem('anokhi_admin_pwd') || '8540';
    if (pwd === adminPassword) {
        document.getElementById('login-screen').style.display = 'none';
        // Password correct, proceed
    } else {
        alert('Incorrect Password!');
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

    // Close any active modal on Escape or Enter key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                // Don't close on Enter if user is typing in an input/textarea inside the modal
                if (e.key === 'Enter' && ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
                closeModal(activeModal.id);
            }
        }
    });


    // Navigation Logic
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Show target view
            views.forEach(v => {
                v.classList.remove('active');
                if(v.id === target) {
                    v.classList.add('active');
                }
            });

            // Refresh view specific data
            if(target === 'dashboard') updateDashboard();
            if(target === 'inventory') renderInventory();
            if(target === 'pos') renderPOSItems();
            if(target === 'history') renderHistory();
            if(target === 'expenses') {
                renderExpenses();
                updateExpenseStats();
            }
            if(target === 'settings') initSettingsView();
        });
    });

    // Form Submissions
    document.getElementById('item-form').addEventListener('submit', handleItemSubmit);
    document.getElementById('restock-form').addEventListener('submit', handleRestockSubmit);
    document.getElementById('pos-search').addEventListener('input', (e) => renderPOSItems(e.target.value));

    // Initial Renders (Show local cache first)
    updateDashboard();
    renderInventory();
    renderPOSItems();
    renderHistory();
    renderTableGrid();
    renderExpenses();
    updateExpenseStats();

    // Sync from Supabase in background
    syncFromSupabase();

    // Default to Dine-In on Load
    const dineInBtn = document.querySelector('.order-type-btn[onclick*="DINE_IN"]');
    if (dineInBtn) setOrderType('DINE_IN', dineInBtn);

    // Global Keyboard Search Listener ├óΓé¼ΓÇ¥ routes ALL keystrokes to the search bar
    document.addEventListener('keydown', (e) => {
        const searchInput = document.getElementById('pos-search');
        const posView = document.getElementById('pos');

        // Only active in POS view
        if (!searchInput || !posView || !posView.classList.contains('active')) return;

        // Don't intercept if user is inside another real input/textarea/select
        const active = document.activeElement;
        const isOtherInput = active &&
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) &&
            active !== searchInput;
        if (isOtherInput) return;

        // Ignore system shortcuts
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        if (e.key.length === 1) {
            // Route any printable character to the search bar
            if (active !== searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.value += e.key;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // If already focused in searchInput, browser handles it naturally
        } else if (e.key === 'Backspace' && active !== searchInput) {
            // Backspace when search bar not focused ├óΓé¼ΓÇ¥ focus it and let user delete
            e.preventDefault();
            searchInput.focus();
            if (searchInput.value.length > 0) {
                searchInput.value = searchInput.value.slice(0, -1);
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (active === searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.blur();
            } else if (cart.length > 0) {
                // Reduce last cart item qty by 1; remove if 0
                const lastItem = cart[cart.length - 1];
                lastItem.cartQty -= 1;
                if (lastItem.cartQty <= 0) {
                    cart = cart.filter(c => c.id !== lastItem.id);
                    if (cart.length === 0) {
                        renderCart();
                        renderPOSItems(searchInput.value);
                        setTimeout(() => {
                            if (confirm('Kya aap bill cancel karna chahte hain?')) {
                                newBill();
                            }
                        }, 50);
                        return;
                    }
                }
                renderCart();
                renderPOSItems(searchInput.value);
            } else if (selectedOrderType === 'DINE_IN' && currentSelectedTable) {
                currentSelectedTable = null;
                cart = [];
                document.getElementById('current-table-name').innerText = 'No Table Selected';
                document.getElementById('advance-paid-info').style.display = 'none';
                document.getElementById('dine-in-table-info').style.display = 'none';
                renderCart();
                renderTableGrid();
            } else {
                newBill();
            }
        } else if (e.key === 'Enter') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                // If it's a form modal and we are typing in an input, let the form submit
                // Otherwise, close the modal as requested
                if (active !== searchInput && active.tagName !== 'INPUT' && active.tagName !== 'SELECT' && active.tagName !== 'TEXTAREA') {
                    closeModal(activeModal.id);
                } else if (!activeModal.querySelector('form')) {
                    // If modal has no form (like receipt), close it anyway
                    closeModal(activeModal.id);
                }
            } else if (cart.length > 0) {
                processSale();
            }
        } else if (e.key === 'F4') {
            e.preventDefault();
            if (selectedOrderType === 'DINE_IN') openAdvanceModal();
        } else if (e.key === 'F8') {
            e.preventDefault();
            if (selectedOrderType === 'DINE_IN') holdOrder();
        }
    });
});

// Utility: Save to LocalStorage
// Utility: Save to LocalStorage and Sync to Supabase
async function saveData() {
    localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
    localStorage.setItem('anokhi_sales', JSON.stringify(salesHistory));
    localStorage.setItem('anokhi_tables', JSON.stringify(tables));

    // Async push to Supabase
    if (!db) return;
    try {
        // Upsert inventory
        if (inventory.length > 0) {
            await db.from('inventory').upsert(inventory);
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

        // For sales history, we usually only add new ones, but upsert is safer if we allow edits
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
    return '\u20B9' + parseFloat(amount).toFixed(2);
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
    openModal('addItemModal');
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
                <td>${item.name}</td>
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
                <td>${data.name}</td>
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
    
    const recentSales = [...salesHistory].reverse().slice(0, 5);
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
        const newItem = {
            id: Date.now().toString(),
            name, category, itemType, price, quantity, lowStockThreshold
        };
        inventory.push(newItem);
    }

    saveData();
    closeModal('addItemModal');
    renderInventory();
    updateDashboard();
}

function renderInventory() {
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';

    if(inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No items found. Add some items to your inventory.</td></tr>';
        return;
    }

    inventory.forEach(item => {
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
            <td><strong>${item.name}</strong></td>
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
        renderInventory();
        updateDashboard();
    }
}

window.editItem = function(id) {
    const item = inventory.find(i => i.id === id);
    if(item) {
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-category').value = item.category;
        const typeRadio = document.getElementById(item.itemType === 'Non-Veg' ? 'type-nonveg' : 'type-veg');
        if (typeRadio) typeRadio.checked = true;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-quantity').value = item.quantity;
        document.getElementById('item-low-stock').value = item.lowStockThreshold || 5;
        document.getElementById('modal-title').innerText = 'Edit Item';
        openModal('addItemModal');
    }
}

window.deleteItem = async function(id) {
    if(confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(i => i.id !== id);
        saveData();
        renderInventory();
        updateDashboard();
        
        // Explicit delete from Supabase
        await db.from('inventory').delete().eq('id', id);
    }
}

// POS Logic
function renderPOSItems(search = '') {
    const grid = document.getElementById('pos-item-grid');
    grid.innerHTML = '';

    const filtered = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) && i.quantity > 0);

    if(filtered.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center;">No available items found.</p>';
        return;
    }

    filtered.forEach(item => {
        const cartItem = cart.find(c => c.id === item.id);
        const inCart = !!cartItem;
        
        const div = document.createElement('div');
        div.className = `pos-item-card ${inCart ? 'in-cart' : ''}`;
        if (!inCart) div.onclick = () => addToCart(item);
        
        div.innerHTML = `
            ${inCart ? `
                <div class="pos-item-overlay">
                    <button class="overlay-btn" onclick="event.stopPropagation(); updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <span class="overlay-qty">${cartItem.cartQty}</span>
                    <button class="overlay-btn" onclick="event.stopPropagation(); updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
            ` : ''}
            <div>
                <span class="category">${item.category}</span>
                <h4>${item.name}</h4>
            </div>
            <div>
                <div class="price">${formatCurrency(item.price)}</div>
                <div class="stock"><i class="fa-solid fa-layer-group" style="font-size: 10px;"></i> ${item.quantity} in stock</div>
            </div>
        `;
        grid.appendChild(div);
    });
}

window.setOrderType = function(type, btn) {
    selectedOrderType = type;
    
    // Update UI
    document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tableInfo = document.getElementById('dine-in-table-info');
    const dineInControls = document.getElementById('dine-in-controls');
    const advanceInfo = document.getElementById('advance-paid-info');
    const tablesContainer = document.getElementById('pos-tables-container');

    if (type === 'DINE_IN') {
        tableInfo.style.display = currentSelectedTable ? 'flex' : 'none';
        dineInControls.style.display = 'grid';
        tablesContainer.style.display = 'block';
        if (currentSelectedTable) {
            const table = tables.find(t => t.id === currentSelectedTable);
            if (table && table.advance > 0) advanceInfo.style.display = 'block';
        }
    } else {
        tableInfo.style.display = 'none';
        dineInControls.style.display = 'none';
        tablesContainer.style.display = 'none';
        advanceInfo.style.display = 'none';
        currentSelectedTable = null;
        cart = [];
        renderCart();
    }
}

window.initSettingsView = function() {
    document.getElementById('setting-table-count').value = tables.length;
}

window.adjustTableCount = function(delta) {
    const input = document.getElementById('setting-table-count');
    let count = parseInt(input.value) + delta;
    if (count < 1) count = 1;
    if (count > 50) count = 50; // Max limit
    input.value = count;
}

window.saveSettings = function() {
    const newCount = parseInt(document.getElementById('setting-table-count').value);
    const oldCount = tables.length;

    if (newCount > oldCount) {
        // Add more tables
        for (let i = oldCount; i < newCount; i++) {
            tables.push({
                id: `T${i+1}`,
                name: `Table ${i+1}`,
                cart: [],
                advance: 0,
                advanceMode: 'CASH'
            });
        }
    } else if (newCount < oldCount) {
        // Check for occupied tables in the range to be removed
        const occupied = tables.slice(newCount).some(t => t.cart.length > 0 || t.advance > 0);
        if (occupied) {
            if (!confirm('Some tables you are removing are currently occupied. Their data will be lost. Continue?')) {
                return;
            }
        }
        tables = tables.slice(0, newCount);
    }

    saveData();
    renderTableGrid();
    alert('Settings saved successfully!');
}

window.importBiharMenu = function() {
    const biharMenu = [
        // Main Course - Veg
        { name: 'Litti Chokha (Desi Ghee)', category: 'Main Course', price: 120, quantity: 50, lowStockThreshold: 10 },
        { name: 'Sattu Paratha (2 Pcs)', category: 'Main Course', price: 80, quantity: 40, lowStockThreshold: 10 },
        { name: 'Dal Pitha (Steam/Fry)', category: 'Main Course', price: 100, quantity: 30, lowStockThreshold: 5 },
        { name: 'Bihari Veg Thali', category: 'Main Course', price: 150, quantity: 30, lowStockThreshold: 5 },
        { name: 'Paneer Butter Masala', category: 'Main Course', price: 220, quantity: 20, lowStockThreshold: 5 },
        { name: 'Kadai Paneer', category: 'Main Course', price: 240, quantity: 15, lowStockThreshold: 5 },
        { name: 'Mix Veg', category: 'Main Course', price: 160, quantity: 20, lowStockThreshold: 5 },
        { name: 'Alu Dum (Bihari Style)', category: 'Main Course', price: 120, quantity: 25, lowStockThreshold: 5 },
        { name: 'Dal Tadka (Yellow)', category: 'Main Course', price: 110, quantity: 40, lowStockThreshold: 10 },
        { name: 'Dal Makhani', category: 'Main Course', price: 180, quantity: 15, lowStockThreshold: 5 },
        
        // Main Course - Non-Veg
        { name: 'Champaran Meat (Handi)', category: 'Main Course', price: 450, quantity: 20, lowStockThreshold: 5 },
        { name: 'Bihari Chicken Curry', category: 'Main Course', price: 320, quantity: 25, lowStockThreshold: 5 },
        { name: 'Fish Curry (Sarson Wali)', category: 'Main Course', price: 280, quantity: 15, lowStockThreshold: 5 },
        { name: 'Mutton Taash (Purnia Style)', category: 'Main Course', price: 380, quantity: 10, lowStockThreshold: 3 },
        { name: 'Chicken Dehati', category: 'Main Course', price: 350, quantity: 20, lowStockThreshold: 5 },
        { name: 'Egg Curry (2 Eggs)', category: 'Main Course', price: 120, quantity: 30, lowStockThreshold: 5 },
        
        // Rice & Breads
        { name: 'Jeera Rice', category: 'Main Course', price: 100, quantity: 50, lowStockThreshold: 10 },
        { name: 'Veg Pulao', category: 'Main Course', price: 160, quantity: 30, lowStockThreshold: 5 },
        { name: 'Chicken Biryani', category: 'Main Course', price: 280, quantity: 20, lowStockThreshold: 5 },
        { name: 'Tawa Roti', category: 'Main Course', price: 10, quantity: 200, lowStockThreshold: 50 },
        { name: 'Butter Naan', category: 'Main Course', price: 40, quantity: 100, lowStockThreshold: 20 },
        { name: 'Garlic Naan', category: 'Main Course', price: 50, quantity: 80, lowStockThreshold: 15 },
        { name: 'Lachha Paratha', category: 'Main Course', price: 45, quantity: 80, lowStockThreshold: 15 },
        
        // Starters & Snacks
        { name: 'Bihari Boti Kebab', category: 'Starter', price: 260, quantity: 20, lowStockThreshold: 5 },
        { name: 'Chicken Lollipop (6 Pcs)', category: 'Starter', price: 280, quantity: 15, lowStockThreshold: 5 },
        { name: 'Veg Chop (4 Pcs)', category: 'Starter', price: 80, quantity: 40, lowStockThreshold: 10 },
        { name: 'Paneer Tikka', category: 'Starter', price: 220, quantity: 15, lowStockThreshold: 5 },
        { name: 'Onion Pakoda (Plate)', category: 'Starter', price: 60, quantity: 50, lowStockThreshold: 10 },
        { name: 'Ghugni Choora', category: 'Starter', price: 70, quantity: 40, lowStockThreshold: 10 },
        { name: 'Chicken 65', category: 'Starter', price: 240, quantity: 20, lowStockThreshold: 5 },
        { name: 'Crispy Corn', category: 'Starter', price: 180, quantity: 15, lowStockThreshold: 5 },
        
        // Chinese (Common in Bihar Restros)
        { name: 'Veg Chowmein', category: 'Starter', price: 120, quantity: 30, lowStockThreshold: 5 },
        { name: 'Chilli Chicken (Dry)', category: 'Starter', price: 260, quantity: 20, lowStockThreshold: 5 },
        { name: 'Veg Manchurian', category: 'Starter', price: 180, quantity: 20, lowStockThreshold: 5 },
        { name: 'Chicken Fried Rice', category: 'Main Course', price: 200, quantity: 25, lowStockThreshold: 5 },
        
        // Rolls
        { name: 'Egg Roll', category: 'Starter', price: 50, quantity: 50, lowStockThreshold: 10 },
        { name: 'Chicken Roll', category: 'Starter', price: 90, quantity: 40, lowStockThreshold: 10 },
        { name: 'Paneer Roll', category: 'Starter', price: 80, quantity: 30, lowStockThreshold: 5 },
        
        // Desserts
        { name: 'Malpua (2 Pcs)', category: 'Dessert', price: 60, quantity: 30, lowStockThreshold: 5 },
        { name: 'Bel Grami (250g)', category: 'Dessert', price: 120, quantity: 20, lowStockThreshold: 5 },
        { name: 'Thekua (Pack of 5)', category: 'Dessert', price: 40, quantity: 100, lowStockThreshold: 20 },
        { name: 'Gulab Jamun (2 Pcs)', category: 'Dessert', price: 50, quantity: 50, lowStockThreshold: 10 },
        { name: 'Gajar ka Halwa (Plate)', category: 'Dessert', price: 80, quantity: 25, lowStockThreshold: 5 },
        { name: 'Khaja (250g)', category: 'Dessert', price: 100, quantity: 20, lowStockThreshold: 5 },
        { name: 'Balushahi (250g)', category: 'Dessert', price: 120, quantity: 15, lowStockThreshold: 5 },
        
        // Beverages
        { name: 'Sattu Sarbat', category: 'Beverage', price: 40, quantity: 50, lowStockThreshold: 10 },
        { name: 'Jaljeera Soda', category: 'Beverage', price: 30, quantity: 50, lowStockThreshold: 10 },
        { name: 'Bel ka Sharbat', category: 'Beverage', price: 50, quantity: 30, lowStockThreshold: 10 },
        { name: 'Masala Chai', category: 'Beverage', price: 20, quantity: 200, lowStockThreshold: 50 },
        { name: 'Sweet Lassi', category: 'Beverage', price: 60, quantity: 40, lowStockThreshold: 10 },
        { name: 'Cold Coffee', category: 'Beverage', price: 90, quantity: 20, lowStockThreshold: 5 }
    ];

    if(confirm(`Aap Bihar Restaurant ke 50+ popular menu items import karna chahte hain?`)) {
        let addedCount = 0;
        biharMenu.forEach(item => {
            const exists = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
            if(!exists) {
                inventory.push({...item, id: Date.now() + Math.random().toString(36).substr(2, 9)});
                addedCount++;
            }
        });

        if(addedCount > 0) {
            saveData();
            renderInventory();
            updateDashboard();
            alert(`${addedCount} new items successfully add ho gaye hain!`);
        } else {
            alert('Saare items pehle se hi inventory mein hain.');
        }
    }
}

window.openTableGrid = function() {
    renderTableGrid();
    openModal('tableGridModal');
}

function renderTableGrid() {
    const container = document.getElementById('table-grid-container');
    container.innerHTML = '';

    tables.forEach(table => {
        const div = document.createElement('div');
        const isOccupied = table.cart.length > 0 || table.advance > 0;
        const isSelected = table.id === currentSelectedTable;
        div.className = `table-card ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`;
        div.onclick = () => selectTable(table.id);

        let total = 0;
        if (isOccupied) {
            total = table.cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
        }

        div.innerHTML = `
            <i class="fa-solid fa-chair"></i>
            <h3>${table.name}</h3>
            ${isOccupied ? `<div class="table-total">├óΓÇÜ┬╣${total}</div>` : '<div class="table-total" style="color:var(--text-secondary)">Available</div>'}
            ${table.advance > 0 ? `<div class="table-advance">Adv: ├óΓÇÜ┬╣${table.advance}</div>` : ''}
        `;
        container.appendChild(div);
    });
}

window.selectTable = function(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    currentSelectedTable = tableId;
    cart = [...table.cart];
    
    document.getElementById('current-table-name').innerText = table.name;
    document.getElementById('advance-amount-display').innerText = formatCurrency(table.advance);
    document.getElementById('advance-paid-info').style.display = table.advance > 0 ? 'block' : 'none';
    document.getElementById('dine-in-table-info').style.display = 'flex';

    closeModal('tableGridModal');
    renderCart();
    renderTableGrid();
}

window.holdOrder = function() {
    if (!currentSelectedTable) {
        alert('Please select a table first!');
        openTableGrid();
        return;
    }

    const tableIndex = tables.findIndex(t => t.id === currentSelectedTable);
    if (tableIndex > -1) {
        tables[tableIndex].cart = [...cart];
        saveData();
        
        // Reset POS for next order without showing alert
        currentSelectedTable = null;
        cart = [];
        document.getElementById('current-table-name').innerText = 'No Table Selected';
        document.getElementById('advance-paid-info').style.display = 'none';
        renderCart();
        renderTableGrid();
    }
}

window.openAdvanceModal = function() {
    if (!currentSelectedTable) {
        alert('Please select a table first!');
        openTableGrid();
        return;
    }
    const table = tables.find(t => t.id === currentSelectedTable);
    document.getElementById('advance-table-name').innerText = `Adding Advance for ${table.name}`;
    document.getElementById('advance-amount-input').value = '';
    openModal('advanceModal');
}

window.saveAdvancePayment = function() {
    const amount = parseFloat(document.getElementById('advance-amount-input').value) || 0;
    const mode = document.getElementById('advance-payment-mode').value;

    if (amount <= 0) return alert('Please enter a valid amount.');

    const tableIndex = tables.findIndex(t => t.id === currentSelectedTable);
    if (tableIndex > -1) {
        tables[tableIndex].advance += amount;
        tables[tableIndex].advanceMode = mode;
        tables[tableIndex].cart = [...cart]; // Save current cart too
        saveData();
        
        document.getElementById('advance-amount-display').innerText = formatCurrency(tables[tableIndex].advance);
        document.getElementById('advance-paid-info').style.display = 'block';
        
        alert(`Advance of ├óΓÇÜ┬╣${amount} recorded for ${tables[tableIndex].name}`);
        closeModal('advanceModal');
        renderTableGrid();
    }
}

function addToCart(item) {
    const existing = cart.find(c => c.id === item.id);
    if(existing) {
        if(existing.cartQty < item.quantity) {
            existing.cartQty++;
        } else {
            alert('Not enough stock!');
        }
    } else {
        cart.push({...item, cartQty: 1});
    }
    renderCart();
}

window.updateCartQty = function(id, delta) {
    const itemIndex = cart.findIndex(c => c.id === id);
    if(itemIndex > -1) {
        const item = cart[itemIndex];
        const invItem = inventory.find(i => i.id === id);
        
        item.cartQty += delta;
        if(item.cartQty <= 0) {
            cart.splice(itemIndex, 1);
        } else if (item.cartQty > invItem.quantity) {
            item.cartQty = invItem.quantity;
            alert('Not enough stock!');
        }
    }
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = '';
    
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.cartQty;
        subtotal += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatCurrency(item.price)} x ${item.cartQty}</p>
            </div>
            <div class="cart-controls">
                <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                <span>${item.cartQty}</span>
                <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
        cartContainer.appendChild(div);
    });

    document.getElementById('cart-subtotal').innerText = formatCurrency(subtotal);
    calculateTotal();
    
    // Also refresh POS items grid to show/update +/- overlays
    const searchVal = document.getElementById('pos-search') ? document.getElementById('pos-search').value : '';
    renderPOSItems(searchVal);
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
}

window.calculateTotal = function() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
    let discountInput = document.getElementById('cart-discount');
    let selectedTypeObj = document.querySelector('input[name="discount-type"]:checked');
    let discountType = selectedTypeObj ? selectedTypeObj.value : 'amount';
    let discountVal = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    
    let discountAmount = 0;
    
    if (discountType === 'percent') {
        if (discountVal > 100) {
            discountVal = 100;
            if(discountInput) discountInput.value = discountVal;
        }
        discountAmount = subtotal * (discountVal / 100);
    } else {
        if (discountVal > subtotal) {
            discountVal = subtotal;
            if(discountInput) discountInput.value = discountVal;
        }
        discountAmount = discountVal;
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
    
    if (refundAmount > 0) {
        if(refundInfo) refundInfo.style.display = 'block';
        document.getElementById('refund-amount-display').innerText = formatCurrency(refundAmount);
        if(totalLabel) totalLabel.innerText = 'Payable';
    } else {
        if(refundInfo) refundInfo.style.display = 'none';
        if(totalLabel) totalLabel.innerText = 'Total';
    }

    let roundOff = finalTotal - (subtotal - discountAmount - advancePaid);
    
    const roundOffEl = document.getElementById('cart-roundoff');
    if(roundOffEl) {
        roundOffEl.innerText = (roundOff >= 0 ? '+' : '') + formatCurrency(roundOff).replace('Γé╣-', '-Γé╣');
    }

    document.getElementById('cart-total').innerText = formatCurrency(finalTotal);
    return { subtotal, discount: discountAmount, advance: advancePaid, roundOff, total: finalTotal };
}

window.clearCart = function() {
    cart = [];
    const discountInput = document.getElementById('cart-discount');
    if(discountInput) discountInput.value = '0';
    renderCart();
}

window.toggleSplitPayment = function() {
    const pMode = document.querySelector('input[name="payment-mode"]:checked').value;
    const splitFields = document.getElementById('split-payment-fields');
    if (pMode === 'BOTH') {
        splitFields.style.display = 'block';
    } else {
        splitFields.style.display = 'none';
    }
}

window.processSale = function() {
    if(cart.length === 0) return alert('Cart is empty!');

    if (selectedOrderType === 'DINE_IN' && !currentSelectedTable) {
        return alert('Validation Error: Please select a table before completing a Dine-In sale.');
    }

    if (!confirm('Are you sure you want to complete this sale?')) {
        return;
    }

    const totals = calculateTotal();
    const total = totals.total;
    const discount = totals.discount;
    const roundOff = totals.roundOff;
    const saleId = Math.floor(100000 + Math.random() * 900000).toString();

    const paymentModeObj = document.querySelector('input[name="payment-mode"]:checked');
    const paymentMode = paymentModeObj ? paymentModeObj.value : 'CASH';

    let splitAmounts = null;
    if (paymentMode === 'BOTH') {
        const splitCash = parseFloat(document.getElementById('split-cash-amount').value) || 0;
        const splitUpi = parseFloat(document.getElementById('split-upi-amount').value) || 0;
        
        if (splitCash + splitUpi !== total) {
            return alert(`Validation Error: Cash (├óΓÇÜ┬╣${splitCash}) + UPI (├óΓÇÜ┬╣${splitUpi}) must exactly equal the Total Bill (├óΓÇÜ┬╣${total}).`);
        }
        splitAmounts = { cash: splitCash, upi: splitUpi };
    }

    // Deduct Inventory
    cart.forEach(cartItem => {
        const invItem = inventory.find(i => i.id === cartItem.id);
        if(invItem) {
            invItem.quantity -= cartItem.cartQty;
        }
    });

    // Record Sale
    const sale = {
        id: saleId,
        date: new Date().toISOString(),
        items: [...cart],
        total: total,
        discount: discount,
        roundOff: roundOff,
        paymentMode: paymentMode,
        splitAmounts: splitAmounts,
        orderType: selectedOrderType,
        tableName: selectedOrderType === 'DINE_IN' && currentSelectedTable ? tables.find(t => t.id === currentSelectedTable).name : null,
        advancePaid: totals.advance
    };
    
    // Clear held table if applicable
    if (selectedOrderType === 'DINE_IN' && currentSelectedTable) {
        const tableIndex = tables.findIndex(t => t.id === currentSelectedTable);
        if (tableIndex > -1) {
            tables[tableIndex].cart = [];
            tables[tableIndex].advance = 0;
        }
    }

    salesHistory.push(sale);
    saveData();

    // Show Receipt Modal
    showReceipt(sale);

    // Reset UI
    currentSelectedTable = null;
    document.getElementById('current-table-name').innerText = 'No Table Selected';
    document.getElementById('advance-paid-info').style.display = 'none';
    clearCart();
    renderInventory();
    renderPOSItems();
    updateDashboard();
    renderTableGrid();
}

function showReceipt(sale) {
    const details = document.getElementById('receipt-details');
    let itemsHtml = sale.items.map(i => `
        <div class="receipt-item">
            <span>${i.name} (x${i.cartQty})</span>
            <span>${formatCurrency(i.price * i.cartQty)}</span>
        </div>
    `).join('');

    details.innerHTML = `
        <p style="text-align:center; color:var(--text-secondary); margin-bottom: 8px;">Order #${sale.id}</p>
        <div style="text-align:center; margin-bottom: 16px;">
            <span class="status-badge" style="background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 14px; padding: 4px 16px;">
                ${sale.orderType === 'DINE_IN' ? '<i class="fa-solid fa-utensils"></i> DINE-IN' : 
                  sale.orderType === 'TAKEAWAY' ? '<i class="fa-solid fa-bag-shopping"></i> TAKEAWAY' : 
                  '<i class="fa-solid fa-bolt"></i> COUNTER QUICK'}
            </span>
            ${sale.tableName ? `<div style="margin-top: 5px; font-weight: 700; color: var(--accent-color);">${sale.tableName}</div>` : ''}
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px;">
            ${itemsHtml}
            ${sale.discount > 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--warning-color);">
                <span>Discount</span>
                <span>-${formatCurrency(sale.discount)}</span>
            </div>` : ''}
            ${sale.advancePaid > 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 14px; color: var(--warning-color);">
                <span>Advance Already Paid</span>
                <span>-${formatCurrency(sale.advancePaid)}</span>
            </div>` : ''}
            ${sale.roundOff && sale.roundOff !== 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 14px; color: var(--text-secondary);">
                <span>Round Off</span>
                <span>${(sale.roundOff >= 0 ? '+' : '') + formatCurrency(sale.roundOff).replace('Γé╣-', '-Γé╣')}</span>
            </div>` : ''}
            <div style="display:flex; justify-content:space-between; margin-top: 16px; font-weight:bold; font-size: 18px;">
                <span>Total Payable (${sale.paymentMode === 'BOTH' ? 'SPLIT' : sale.paymentMode || 'CASH'})</span>
                <span style="color:var(--success-color);">${formatCurrency(sale.total)}</span>
            </div>
            ${sale.paymentMode === 'BOTH' && sale.splitAmounts ? `
            <div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--text-secondary); border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 8px;">
                <span>Cash Paid: <span style="color:var(--text-primary);">${formatCurrency(sale.splitAmounts.cash)}</span></span>
                <span>UPI Paid: <span style="color:var(--text-primary);">${formatCurrency(sale.splitAmounts.upi)}</span></span>
            </div>
            ` : ''}
        </div>
    `;

    openModal('receiptModal');
}

let currentCalendarDate = null;

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
        } else if (pMode === 'BOTH') {
            calendarTotals[dateStr].upi += sale.splitAmounts.upi;
            calendarTotals[dateStr].cash += sale.splitAmounts.cash;
        } else {
            calendarTotals[dateStr].cash += sale.total;
        }
    });

    renderCalendarChart(calendarTotals);

    const sortedHistory = [...salesHistory].reverse();

    sortedHistory.forEach(sale => {
        const itemsStr = sale.items.map(i => `${i.name} (x${i.cartQty})`).join(', ');
        
        const tr = document.createElement('tr');
        const pMode = sale.paymentMode || 'CASH';
        let pModeBadge = '';
        if (pMode === 'UPI') {
            pModeBadge = '<span class="status-badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">UPI</span>';
        } else if (pMode === 'BOTH') {
            pModeBadge = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">SPLIT</span>';
        } else {
            pModeBadge = '<span class="status-badge status-instock">CASH</span>';
        }

        const typeBadge = `
            <span style="font-size: 11px; display: block; color: var(--text-secondary); margin-top: 4px;">
                ${sale.orderType === 'DINE_IN' ? 'Dine-In' : sale.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Counter'}
            </span>
        `;

        tr.innerHTML = `
            <td>
                <strong>#${sale.id}</strong>
                ${typeBadge}
            </td>
            <td>${formatDateTime(sale.date)}</td>
            <td><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsStr}">${itemsStr}</div></td>
            <td>${pModeBadge}</td>
            <td style="color:var(--success-color); font-weight:bold;">${formatCurrency(sale.total)}</td>
            <td>
                <button class="btn-primary" style="padding: 6px 12px; font-size:12px; margin-right: 5px;" onclick="viewReceipt('${sale.id}')">View</button>
                <button class="btn-danger" style="padding: 6px 12px; font-size:12px;" onclick="deleteSale('${sale.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
    const mainCat = document.getElementById('expense-main-cat').value;
    const subCatList = document.getElementById('sub-cat-list');
    subCatList.innerHTML = '';

    const subCats = {
        'Staff & Operation': ['Salary', 'Advance', 'Rent', 'Bill'],
        'Material': ['Groceries', 'Vegetable', 'Gas', 'Packaging']
    };

    if (mainCat && subCats[mainCat]) {
        subCats[mainCat].forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            subCatList.appendChild(opt);
        });
    }
}

window.handleExpenseSubmit = async function(e) {
    e.preventDefault();
    const mainCat = document.getElementById('expense-main-cat').value;
    const subCat = document.getElementById('expense-sub-cat').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const mode = document.getElementById('expense-payment-mode').value;
    const desc = document.getElementById('expense-desc').value;

    const newExpense = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        main_category: mainCat,
        sub_category: subCat,
        amount: amount,
        payment_mode: mode,
        description: desc
    };

    expensesHistory.unshift(newExpense);
    localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));

    if (db) {
        try {
            await db.from('expenses').insert(newExpense);
        } catch(err) {
            console.error('Supabase Expense Error:', err);
        }
    }

    e.target.reset();
    renderExpenses();
    updateExpenseStats();
    alert('Expense added successfully!');
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
        localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
        
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

function updateExpenseStats() {
    const staffTotal = expensesHistory
        .filter(e => e.main_category === 'Staff & Operation')
        .reduce((sum, e) => sum + e.amount, 0);
        
    const materialTotal = expensesHistory
        .filter(e => e.main_category === 'Material')
        .reduce((sum, e) => sum + e.amount, 0);

    const staffEl = document.getElementById('total-staff-expenses');
    const matEl = document.getElementById('total-material-expenses');
    if(staffEl) staffEl.innerText = formatCurrency(staffTotal);
    if(matEl) matEl.innerText = formatCurrency(materialTotal);
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
        // Trigger change event if needed (like for main cat updating sub cats)
        input.dispatchEvent(new Event('change'));
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




