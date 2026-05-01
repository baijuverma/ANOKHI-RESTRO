export function initInventoryLogic() {
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




/* Utility: Toast Notification */



}
