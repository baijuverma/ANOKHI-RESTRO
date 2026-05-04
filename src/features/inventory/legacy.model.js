export function initInventoryLogic() {
window.openAddItemModal = function() {
    document.getElementById('item-form').reset();
    document.getElementById('item-id').value = '';
    document.getElementById('item-low-stock').value = '5';
    document.getElementById('modal-title').innerText = 'Add New Item';
    
    // Set button text
    const submitBtn = document.getElementById('submit-item-btn');
    if (submitBtn) submitBtn.innerText = 'Save Item';

    // Hide delete button for new items
    const delBtn = document.getElementById('delete-item-modal-btn');
    if (delBtn) delBtn.classList.add('force-hidden');
    
    // Reset veg/nonveg to Veg
    const vegRadio = document.getElementById('type-veg');
    if (vegRadio) vegRadio.checked = true;
    // Populate item name datalist from existing inventory
    populateItemNameDatalist();
    openModal('addItemModal');
}

window.handleModalDelete = function() {
    const id = document.getElementById('item-id').value;
    if (id && typeof window.deleteItem === 'function') {
        window.deleteItem(id);
        closeModal('addItemModal');
    }
}

function populateItemNameDatalist() {
    const dl = document.getElementById('item-name-list');
    if (!dl || !window.inventory) return;
    dl.innerHTML = window.inventory.map(i => `<option value="${i.name}"></option>`).join('');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

let stockListPagination = null;
window.showStockList = function(type, isLoadMore = false) {
    let list = [];
    let title = '';
    
    if (type === 'total') {
        list = window.inventory;
        title = 'Total Items Available';
    } else if (type === 'low') {
        list = window.inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0);
        title = 'Low Stock Items';
    } else if (type === 'out') {
        list = window.inventory.filter(i => i.quantity === 0);
        title = 'Out of Stock Items';
    }
    
    if (!isLoadMore) {
        document.getElementById('stock-list-title').innerText = title;
        stockListPagination = new LocalPagination(list, 30);
    }

    const tbody = document.getElementById('stock-list-tbody');
    if (!isLoadMore) tbody.innerHTML = '';
    else {
        const existingSentinel = document.getElementById('stock-list-sentinel');
        if (existingSentinel) existingSentinel.remove();
    }
    
    const visibleItems = stockListPagination.getVisibleItems();
    // Only render the NEW items if loading more, or all if first time
    const itemsToRender = isLoadMore ? visibleItems.slice(-stockListPagination.pageSize) : visibleItems;

    if (visibleItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No items found in this category.</td></tr>';
    } else {
        itemsToRender.forEach(item => {
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

    if (stockListPagination.hasMore()) {
        const sentinelRow = document.createElement('tr');
        sentinelRow.id = 'stock-list-sentinel';
        sentinelRow.innerHTML = `<td colspan="3" style="text-align:center; padding:10px; color:var(--text-secondary); font-size:11px;"><i class="fa-solid fa-spinner fa-spin"></i> More...</td>`;
        tbody.appendChild(sentinelRow);
        
        setTimeout(() => {
            setupInfiniteScroll('stock-list-sentinel', () => {
                if (stockListPagination.loadMore()) {
                    window.showStockList(type, true);
                }
            });
        }, 100);
    }
    
    if (!isLoadMore) openModal('stockListModal');
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

// Dashboard Logic (Now handled by widgets/dashboard-stats)

// Inventory Logic
function handleItemSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const name = document.getElementById('item-name').value ? document.getElementById('item-name').value.trim() : '';
    const category = document.getElementById('item-category').value;
    const itemType = document.querySelector('input[name="item-type"]:checked')?.value || 'Veg';
    const price = parseFloat(document.getElementById('item-price').value) || 0;
    const quantity = parseInt(document.getElementById('item-quantity').value) || 0;
    const lowStockThreshold = parseInt(document.getElementById('item-low-stock').value) || 5;

    if (!window.inventory) window.inventory = [];

    if (id) {
        // Update mode
        const index = window.inventory.findIndex(i => String(i.id) === String(id));
        if(index > -1) {
            // Check if name changed to another existing item's name
            const otherDuplicate = window.inventory.find(i => 
                String(i.id) !== String(id) && 
                i.name.trim().toLowerCase() === name.toLowerCase()
            );
            
            if (otherDuplicate) {
                alert(`Cannot rename: An item named "${name}" already exists in "${otherDuplicate.category}".`);
                return;
            }

            window.inventory[index] = { 
                ...window.inventory[index], 
                name, category, itemType, price, quantity, lowStockThreshold 
            };
        }
    } else {
        // Add mode
        if (!name) {
            alert('Item name cannot be empty.');
            return;
        }

        const duplicateItem = window.inventory.find(i => i.name.trim().toLowerCase() === name.toLowerCase());
        if (duplicateItem) {
            alert(`Duplicate Entry Rejected: An item named "${name}" already exists in the "${duplicateItem.category}" category.`);
            // After alert is dismissed, highlight the item
            if (typeof window.highlightInventoryItem === 'function') {
                window.highlightInventoryItem(duplicateItem.id);
            }
            return;
        }

        const newItem = {
            id: Date.now().toString(),
            name, category, itemType, price, quantity, lowStockThreshold
        };
        window.inventory.push(newItem);
    }

    if (typeof window.saveData === 'function') window.saveData();
    
    if (!id) {
        // ADD mode: Keep modal open, reset form but retain category, show success message
        const currentCat = document.getElementById('item-category').value;
        const currentLowStock = document.getElementById('item-low-stock').value;
        document.getElementById('item-form').reset();
        document.getElementById('item-id').value = '';
        document.getElementById('item-category').value = currentCat;
        document.getElementById('item-low-stock').value = currentLowStock;
        document.getElementById('item-name').focus();
        if (typeof window.showToast === 'function') window.showToast("Item added successfully!", "success");
    } else {
        // UPDATE mode: Close modal and show success
        closeModal('addItemModal');
        if (typeof window.showToast === 'function') window.showToast("Item updated successfully!", "success");
    }
    
    if (typeof window.renderInventory === 'function') window.renderInventory();
    if (typeof window.updateDashboard === 'function') window.updateDashboard();
}

// Inventory Table Logic (Now handled by widgets/inventory-table)

window.openRestockModal = function(id) {
    const item = (window.inventory || []).find(i => String(i.id) === String(id));
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

    const index = (window.inventory || []).findIndex(i => String(i.id) === String(id));
    if(index > -1 && qtyToAdd > 0) {
        inventory[index].quantity += qtyToAdd;
        saveData();
        closeModal('restockModal');
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof updateDashboard === 'function') updateDashboard();
    }
}

// Bind event listeners to forms immediately
window.handleItemSubmit = handleItemSubmit;
window.handleRestockSubmit = handleRestockSubmit;


window.editItem = function(id) {
    const item = (window.inventory || []).find(i => String(i.id) === String(id));
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
        
        // Set button text to Update
        const submitBtn = document.getElementById('submit-item-btn');
        if (submitBtn) submitBtn.innerText = 'Update Item';

        // Show delete button during edit
        const delBtn = document.getElementById('delete-item-modal-btn');
        if (delBtn) delBtn.classList.remove('force-hidden');

        populateItemNameDatalist();
        openModal('addItemModal');
    }
}

window.deleteItem = async function(id) {
    if(confirm('Are you sure you want to delete this item?')) {
        window.inventory = (window.inventory || []).filter(i => String(i.id) !== String(id));
        if (typeof window.saveData === 'function') window.saveData();
        if (typeof window.renderInventory === 'function') window.renderInventory();
        if (typeof window.updateDashboard === 'function') window.updateDashboard();
        
        // Explicit delete from Supabase
        if (window.db) await window.db.from('inventory').delete().eq('id', id);
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


// Data Import Logic (Now handled by features/settings/model)




/* Utility: Toast Notification */



    /* Bulk Actions Logic */
    window.toggleSelectAllInventory = function(mainCheckbox) {
        const checkboxes = document.querySelectorAll('.inventory-checkbox');
        checkboxes.forEach(cb => cb.checked = mainCheckbox.checked);
        window.updateInventoryDeleteBtnVisibility();
    }

    window.updateInventoryDeleteBtnVisibility = function() {
        const checkboxes = document.querySelectorAll('.inventory-checkbox:checked');
        const delBtn = document.getElementById('delete-selected-btn');
        if (delBtn) {
            if (checkboxes.length > 0) delBtn.classList.remove('force-hidden');
            else delBtn.classList.add('force-hidden');
        }
        
        // Also update the Select All checkbox state
        const allCheckboxes = document.querySelectorAll('.inventory-checkbox');
        const mainCheckbox = document.getElementById('inventory-select-all');
        if (mainCheckbox) {
            mainCheckbox.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
        }
    }

    window.deleteSelectedInventory = async function() {
        const checked = document.querySelectorAll('.inventory-checkbox:checked');
        const ids = Array.from(checked).map(cb => cb.getAttribute('data-id'));
        
        if (ids.length === 0) return;

        window.requestAdminVerification(`Deleting ${ids.length} items.`, async () => {
            if (confirm(`Are you sure you want to delete these ${ids.length} items? This cannot be undone.`)) {
                // Filter local inventory
                window.inventory = (window.inventory || []).filter(item => !ids.includes(String(item.id)));
                
                // Save to localStorage/State
                if (typeof window.saveData === 'function') window.saveData();
                
                // Sync with Supabase if available
                if (window.db) {
                    try {
                        const { error } = await window.db.from('inventory').delete().in('id', ids);
                        if (error) throw error;
                    } catch (err) {
                        console.error("Supabase bulk delete failed:", err);
                    }
                }

                if (typeof window.showToast === 'function') window.showToast(`${ids.length} items deleted successfully`, "success");
                
                // Refresh UI
                if (typeof window.renderInventory === 'function') window.renderInventory();
                if (typeof window.updateDashboard === 'function') window.updateDashboard();
                
                // Hide delete button and uncheck select all
                const mainCheckbox = document.getElementById('inventory-select-all');
                if (mainCheckbox) mainCheckbox.checked = false;
                window.updateInventoryDeleteBtnVisibility();
            }
        });
    }
}
