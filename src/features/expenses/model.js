// --- Expense Data & Suggestions Logic ---
window.editingExpenseId = null;
window.editingExpenseOldData = null; // To track difference for inventory
// Blacklist for deleted sub-categories
if (!window.deletedExpenseSubs) {
    window.deletedExpenseSubs = JSON.parse(localStorage.getItem('deleted_expense_subs') || '[]');
}

// Moved to top-level to ensure global availability
const expenseData = {
    main: ['Staff & Payroll', 'Raw Material/Ingredients', 'Operations & Maintenance', 'Other Expenses'],
    sub: {
        'Staff & Payroll': ['Staff Salary', 'Staff Advance', 'Incentives/Bonus', 'Staff Meals', 'Uniforms', 'Training', 'Staff Welfare'],
        'Raw Material/Ingredients': ['Groceries & Spices', 'Vegetables & Fruits', 'Meat, Fish & Poultry', 'Dairy & Eggs', 'Oil & Ghee', 'Flour/Rice/Dal', 'Beverages/Soft Drinks', 'Water Cans', 'Tea/Coffee/Milk', 'Bakery Items'],
        'Operations & Maintenance': ['Rent', 'Electricity Bill', 'Water Bill', 'Gas/Fuel', 'Internet/Phone', 'Marketing/Ads', 'Repairs & Maintenance', 'Cleaning Supplies', 'Packaging Material', 'Software/POS Subscription', 'Waste Management', 'License/Legal', 'Stationery', 'Electricity Repair', 'Plumbing'],
        'Other Expenses': ['Miscellaneous', 'Petty Cash', 'Transport/Delivery', 'Taxes', 'Others', 'Donations', 'Bank Charges']
    }
};

window.showSuggestions = function(inputId, panelId) {
    const input = document.getElementById(inputId);
    const panel = document.getElementById(panelId);
    if (!input || !panel) return;

    let items = [];
    if (inputId === 'expense-main-cat') {
        const invCategories = [...new Set((window.inventory || []).map(i => i.category).filter(Boolean))];
        items = [...new Set([...expenseData.main, ...invCategories])];
    } else {
        const mainValue = document.getElementById('expense-main-cat').value;
        if ((mainValue || '').trim().toUpperCase() === 'KITCHEN') {
            // Only show previous custom entries from expenses history for KITCHEN
            const historySubs = (window.expensesHistory || [])
                .filter(e => (e.main_category || '').trim().toUpperCase() === 'KITCHEN')
                .map(e => e.sub_category || e.subCategory)
                .filter(Boolean);
            items = [...new Set(historySubs)].filter(item => !window.deletedExpenseSubs.includes(item));
        } else {
            const defaultSubs = expenseData.sub[mainValue] || [];
            const invItems = (window.inventory || []).filter(i => i.category === mainValue).map(i => i.name);
            items = [...new Set([...defaultSubs, ...invItems])].filter(item => !window.deletedExpenseSubs.includes(item));
        }
    }

    renderSuggestions(items, input, panel);
    panel.classList.remove('hidden');
    panel.style.display = 'block';
};

window.handleSearchableInput = function(inputId, panelId) {
    const input = document.getElementById(inputId);
    const panel = document.getElementById(panelId);
    const query = (input.value || '').toLowerCase();

    let items = [];
    if (inputId === 'expense-main-cat') {
        const invCategories = [...new Set((window.inventory || []).map(i => i.category).filter(Boolean))];
        const allMain = [...new Set([...expenseData.main, ...invCategories])];
        items = allMain.filter(i => i.toLowerCase().includes(query));
    } else {
        const mainValue = document.getElementById('expense-main-cat').value;
        let allSub = [];
        if ((mainValue || '').trim().toUpperCase() === 'KITCHEN') {
            const historySubs = (window.expensesHistory || [])
                .filter(e => (e.main_category || '').trim().toUpperCase() === 'KITCHEN')
                .map(e => e.sub_category || e.subCategory)
                .filter(Boolean);
            allSub = [...new Set(historySubs)].filter(item => !window.deletedExpenseSubs.includes(item));
        } else {
            const defaultSubs = expenseData.sub[mainValue] || [];
            const invItems = (window.inventory || []).filter(i => i.category === mainValue).map(i => i.name);
            allSub = [...new Set([...defaultSubs, ...invItems])].filter(item => !window.deletedExpenseSubs.includes(item));
        }
        items = allSub.filter(i => i.toLowerCase().includes(query));
    }

    renderSuggestions(items, input, panel);
    panel.classList.remove('hidden');
    panel.style.display = 'block';

    if (inputId === 'expense-main-cat') {
        const isRaw = input.value.toLowerCase().includes('raw material') || input.value.toLowerCase().includes('kitchen');
        const isBuiltIn = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(input.value);
        const priceContainer = document.getElementById('expense-sell-price-container');
        if (priceContainer) {
            priceContainer.style.display = (isRaw || isBuiltIn) ? 'none' : 'block';
        }
    } else if (inputId === 'expense-sub-cat') {
        const invItem = (window.inventory || []).find(i => i.name.trim().toLowerCase() === query.trim());
        const priceInput = document.getElementById('expense-sell-price');
        if (priceInput) {
            priceInput.value = (invItem && invItem.price) ? invItem.price : '';
        }
    }
};

window.clearSearchableInput = function(inputId, panelId) {
    const input = document.getElementById(inputId);
    const panel = document.getElementById(panelId);
    if (input) {
        input.value = '';
        if (inputId === 'expense-main-cat') {
            const subInput = document.getElementById('expense-sub-cat');
            if (subInput) subInput.value = '';
        }
    }
    if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none';
    }
};

window.toggleSuggestions = function(inputId, panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    if (panel.classList.contains('hidden') || panel.style.display === 'none') {
        window.showSuggestions(inputId, panelId);
    } else {
        panel.classList.add('hidden');
        panel.style.display = 'none';
    }
};

function renderSuggestions(items, input, panel) {
    panel.innerHTML = '';
    if (items.length === 0) {
        const div = document.createElement('div');
        div.className = 'suggestion-item empty';
        div.textContent = input.id === 'expense-sub-cat' && !document.getElementById('expense-main-cat').value 
            ? 'Pehle main category chuniye' 
            : 'No matches found';
        panel.appendChild(div);
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        const textSpan = document.createElement('span');
        textSpan.textContent = item;
        div.appendChild(textSpan);

        // Add delete button for sub-category suggestions
        if (input.id === 'expense-sub-cat') {
            const delBtn = document.createElement('i');
            delBtn.className = 'fa-solid fa-xmark delete-suggestion-btn';
            delBtn.style.padding = '4px 8px';
            delBtn.style.fontSize = '12px';
            delBtn.title = 'Delete from suggestions';
            delBtn.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(`Delete "${item}" from suggestions permanentally?`)) {
                    window.deleteExpenseSuggestion(item);
                }
            };
            div.appendChild(delBtn);
        }

        div.onmousedown = (e) => {
            if (e.target.classList.contains('delete-suggestion-btn')) return;
            e.preventDefault();
            input.value = item;
            panel.classList.add('hidden');
            panel.style.display = 'none';
            
            if (input.id === 'expense-main-cat') {
                const subInput = document.getElementById('expense-sub-cat');
                if (subInput) {
                    subInput.value = '';
                    window.showSuggestions('expense-sub-cat', 'sub-suggestions');
                }
                const priceInput = document.getElementById('expense-sell-price');
                if (priceInput) priceInput.value = '';

                const isRaw = item.toLowerCase().includes('raw material') || item.toLowerCase().includes('kitchen');
                const isBuiltIn = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(item);
                const priceContainer = document.getElementById('expense-sell-price-container');
                if (priceContainer) {
                    priceContainer.style.display = (isRaw || isBuiltIn) ? 'none' : 'block';
                }
                const qtyContainer = document.getElementById('expense-qty-container');
                if (qtyContainer) {
                    qtyContainer.style.display = isBuiltIn ? 'none' : 'block';
                }
            } else if (input.id === 'expense-sub-cat') {
                const invItem = (window.inventory || []).find(i => i.name.trim().toLowerCase() === item.trim().toLowerCase());
                const priceInput = document.getElementById('expense-sell-price');
                if (priceInput) {
                    priceInput.value = (invItem && invItem.price) ? invItem.price : '';
                }
            }
        };
        panel.appendChild(div);
    });
}

window.deleteExpenseSuggestion = function(item) {
    if (!window.deletedExpenseSubs.includes(item)) {
        window.deletedExpenseSubs.push(item);
        localStorage.setItem('deleted_expense_subs', JSON.stringify(window.deletedExpenseSubs));
        
        // Re-render the current suggestions
        const subInput = document.getElementById('expense-sub-cat');
        if (subInput) {
            window.handleSearchableInput('expense-sub-cat', 'sub-suggestions');
        }
    }
};

// Global click listener for hiding panels
document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('.searchable-dropdown')) {
        document.querySelectorAll('.suggestions-panel').forEach(p => {
            p.classList.add('hidden');
            p.style.display = 'none';
        });
    }
});

window.handleExpenseSubmit = async function(e) {
    e.preventDefault();
    const mainCat = document.getElementById('expense-main-cat').value;
    const subCat = document.getElementById('expense-sub-cat').value;
    const desc = document.getElementById('expense-desc').value;

    const qtyContainer = document.getElementById('expense-qty-container');
    const isQtyVisible = qtyContainer && qtyContainer.style.display !== 'none';
    const qty = parseFloat(document.getElementById('expense-qty').value) || 0;
    
    if (isQtyVisible && qty <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please enter a valid quantity.', 'error', null, 2000);
        } else {
            alert('Please enter a valid quantity.');
        }
        setTimeout(() => document.getElementById('expense-qty').focus(), 10);
        return;
    }

    const sellPrice = parseFloat(document.getElementById('expense-sell-price').value) || 0;
    const cash = parseFloat(document.getElementById('expense-cash').value) || 0;
    const upi = parseFloat(document.getElementById('expense-upi').value) || 0;
    const udhar = parseFloat(document.getElementById('expense-udhar').value) || 0;

    if (cash === 0 && upi === 0 && udhar === 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please enter an amount.', 'error', null, 2000);
        } else {
            alert('Please enter an amount.');
        }
        setTimeout(() => document.getElementById('expense-cash').focus(), 10);
        return;
    }

    if (window.editingExpenseId) {
        // UPDATE EXISTING RECORD
        const idx = (window.expensesHistory || []).findIndex(e => e.id === window.editingExpenseId);
        if (idx > -1) {
            const exp = window.expensesHistory[idx];
            exp.main_category = mainCat;
            exp.sub_category = subCat;
            exp.amount = cash + upi + udhar;
            exp.cash = cash;
            exp.upi = upi;
            exp.udhar = udhar;
            exp.description = qty > 0 ? `Qty: ${qty} | ${desc}` : desc;
            exp.qty = qty;
            exp.selling_price = sellPrice;
            
            window.editingExpenseId = null;
            window.editingExpenseOldData = null;

            // Restore button text
            const submitBtn = document.querySelector('#expense-form button[type="submit"]');
            if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Expense';
            
            if (typeof window.showToast === 'function') {
                window.showToast('Expense updated successfully!', 'success', null, 1000);
            }
        }
    } else {
        // CREATE NEW RECORD
        const expenseId = Date.now().toString() + Math.random();
        const expenseRecord = {
            id: expenseId,
            date: new Date().toISOString(),
            main_category: mainCat,
            sub_category: subCat,
            amount: cash + upi + udhar,
            cash: cash,
            upi: upi,
            udhar: udhar,
            description: qty > 0 ? `Qty: ${qty} | ${desc}` : desc,
            qty: qty,
            selling_price: sellPrice
        };
        window.expensesHistory.unshift(expenseRecord);
        if (typeof window.showToast === 'function') {
            window.showToast('Expense saved successfully!', 'success', null, 1000);
        }
    }

    // Handle Inventory Stock Sync
    const isRawMaterial = mainCat.toLowerCase().includes('raw material') || mainCat.toLowerCase().includes('kitchen');
    const isBuiltInExpenseCat = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(mainCat);

    if (window.inventory && !isRawMaterial) {
        // 1. REVERT OLD DATA (if updating)
        if (window.editingExpenseOldData) {
            const oldQty = parseFloat(window.editingExpenseOldData.qty) || 0;
            const oldSubCat = (window.editingExpenseOldData.subCat || '').trim().toLowerCase();
            const oldMainCat = window.editingExpenseOldData.mainCat || '';
            const oldIsRaw = oldMainCat.toLowerCase().includes('raw material') || oldMainCat.toLowerCase().includes('kitchen');
            const oldIsBuiltIn = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(oldMainCat);

            if (oldQty > 0 && !oldIsRaw && !oldIsBuiltIn) {
                const oldInvItem = window.inventory.find(i => i.name.trim().toLowerCase() === oldSubCat);
                if (oldInvItem) {
                    oldInvItem.quantity = Math.max(0, (parseFloat(oldInvItem.quantity) || 0) - oldQty);
                    console.log(`Reverted old inventory: ${oldInvItem.name} -${oldQty}`);
                }
            }
            window.editingExpenseOldData = null; // Clear after revert
        }

        // 2. APPLY NEW DATA
        if ((qty > 0 || sellPrice > 0) && !isBuiltInExpenseCat) {
            const invItem = window.inventory.find(i => i.name.trim().toLowerCase() === subCat.trim().toLowerCase());
            
            if (invItem) {
                if (qty > 0) invItem.quantity = (parseFloat(invItem.quantity) || 0) + qty;
                if (sellPrice > 0) invItem.price = sellPrice;
                if (invItem.category !== mainCat) invItem.category = mainCat;
                console.log(`Updated inventory: ${invItem.name} +${qty} (Price: ${sellPrice})`);
            } else if (qty > 0) {
                // Auto-Add NEW item to Inventory
                const newItem = {
                    id: Date.now().toString() + Math.floor(Math.random() * 1000),
                    name: subCat.trim(),
                    category: mainCat.trim(),
                    type: 'Veg',
                    price: sellPrice,
                    quantity: qty,
                    low_stock_threshold: 5
                };
                window.inventory.unshift(newItem);
                console.log(`Auto-added NEW item to inventory: ${subCat} +${qty}`);
            }
            
            localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
            if (typeof window.renderInventory === 'function') window.renderInventory();
        }
    }

    if (typeof window.saveData === 'function') window.saveData(); // Non-blocking so UI updates instantly
    e.target.reset();
    
    // Explicitly clear inputs for safety after edit mode
    ['expense-main-cat', 'expense-sub-cat', 'expense-qty', 'expense-cash', 'expense-upi', 'expense-udhar', 'expense-desc', 'expense-sell-price'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    if (typeof window.renderExpenses === 'function') {
        window.renderExpenses();
    }
    if (typeof window.updateExpenseStats === 'function') window.updateExpenseStats();
    if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
    if (typeof window.updateDashboard === 'function') window.updateDashboard();
};

export function initExpensesLogic() {
    const form = document.getElementById('expense-form');
    if (form) {
        form.addEventListener('submit', window.handleExpenseSubmit);
    }



    window.deleteExpense = async function(id) {
        if (typeof window.requestAdminVerification !== 'function') {
             // Fallback if auth module not loaded
             if(!confirm('Delete this expense?')) return;
             executeDelete(id);
             return;
        }

        window.requestAdminVerification("Are you sure you want to delete this expense history? Admin password is required.", () => {
             executeDelete(id);
        });
    };

    async function executeDelete(id) {
        const exp = (window.expensesHistory || []).find(e => e.id === id);
        if (exp) {
            // Revert inventory stock if applicable
            const mainCat = exp.main_category || '';
            const subCat = exp.sub_category || '';
            const qty = parseFloat(exp.qty) || 0;
            
            const isRawMaterial = mainCat.toLowerCase().includes('raw material') || mainCat.toLowerCase().includes('kitchen');
            const isBuiltInExpenseCat = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(mainCat);
            
            if (!isRawMaterial && !isBuiltInExpenseCat && qty > 0 && window.inventory) {
                const invItem = window.inventory.find(i => i.name.trim().toLowerCase() === subCat.trim().toLowerCase());
                if (invItem) {
                    invItem.quantity = Math.max(0, (parseFloat(invItem.quantity) || 0) - qty);
                    localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
                    if (typeof window.renderInventory === 'function') window.renderInventory();
                }
            }
        }

        window.expensesHistory = window.expensesHistory.filter(e => e.id !== id);
        window.saveData();
        if (window.db) await window.db.from('expenses').delete().eq('id', id);
        window.renderExpenses();
        window.updateExpenseStats();
        if (typeof window.showToast === 'function') window.showToast('Expense deleted successfully.', 'success');
    }

    window.toggleExpenseActionMenu = function(id, event) {
        if (event) event.stopPropagation();
        
        // Close all other menus first
        document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
            if (menu.id !== `action-menu-${id}`) {
                menu.classList.add('hidden');
            }
        });

        const menu = document.getElementById(`action-menu-${id}`);
        if (menu) {
            menu.classList.toggle('hidden');
        }
    };

    window.toggleSelectAllExpenses = function(headerCheckbox) {
        const checkboxes = document.querySelectorAll('.expense-row-checkbox');
        checkboxes.forEach(cb => cb.checked = headerCheckbox.checked);
        window.syncExpenseHeaderCheckbox();
    };

    window.syncExpenseHeaderCheckbox = function() {
        const checkboxes = document.querySelectorAll('.expense-row-checkbox');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const headerCheckbox = document.getElementById('expenses-select-all');
        const deleteBtn = document.getElementById('delete-selected-expenses-btn');

        if (headerCheckbox) {
            headerCheckbox.checked = checkedCount > 0 && checkedCount === checkboxes.length;
            headerCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }

        if (deleteBtn) {
            if (checkedCount > 0) {
                deleteBtn.classList.remove('force-hidden');
            } else {
                deleteBtn.classList.add('force-hidden');
            }
        }
    };

    window.deleteSelectedExpenses = async function() {
        const checkboxes = document.querySelectorAll('.expense-row-checkbox:checked');
        const idsToDelete = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));

        if (idsToDelete.length === 0) return;

        if (typeof window.requestAdminVerification !== 'function') {
            if (!confirm(`Delete ${idsToDelete.length} selected expenses?`)) return;
            executeBulkDelete(idsToDelete);
            return;
        }

        window.requestAdminVerification(`Delete ${idsToDelete.length} selected expenses? Admin password is required.`, () => {
            executeBulkDelete(idsToDelete);
        });
    };

    async function executeBulkDelete(idsToDelete) {
        // Revert inventory stock for each
        idsToDelete.forEach(id => {
            const exp = (window.expensesHistory || []).find(e => e.id === id);
            if (exp) {
                const mainCat = exp.main_category || '';
                const subCat = exp.sub_category || '';
                const qty = parseFloat(exp.qty) || 0;
                
                const isRawMaterial = mainCat.toLowerCase().includes('raw material') || mainCat.toLowerCase().includes('kitchen');
                const isBuiltInExpenseCat = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(mainCat);
                
                if (!isRawMaterial && !isBuiltInExpenseCat && qty > 0 && window.inventory) {
                    const invItem = window.inventory.find(i => i.name.trim().toLowerCase() === subCat.trim().toLowerCase());
                    if (invItem) {
                        invItem.quantity = Math.max(0, (parseFloat(invItem.quantity) || 0) - qty);
                    }
                }
            }
        });

        localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
        window.expensesHistory = window.expensesHistory.filter(e => !idsToDelete.includes(e.id));
        
        window.saveData();
        if (window.db) {
            await window.db.from('expenses').delete().in('id', idsToDelete);
        }
        
        if (typeof window.renderInventory === 'function') window.renderInventory();
        window.renderExpenses();
        window.updateExpenseStats();
        
        if (typeof window.showToast === 'function') {
            window.showToast(`${idsToDelete.length} expenses deleted.`, 'success');
        }
    }

    window.editExpense = function(id) {
        const exp = (window.expensesHistory || []).find(e => e.id === id);
        if (!exp) return;

        window.editingExpenseId = id;
        window.editingExpenseOldData = {
            qty: exp.qty,
            subCat: exp.sub_category,
            mainCat: exp.main_category
        };
        document.getElementById('expense-main-cat').value = exp.main_category || '';
        document.getElementById('expense-sub-cat').value = exp.sub_category || '';
        document.getElementById('expense-qty').value = exp.qty || '';
        document.getElementById('expense-cash').value = exp.cash || '';
        document.getElementById('expense-upi').value = exp.upi || '';
        document.getElementById('expense-udhar').value = exp.udhar || '';
        document.getElementById('expense-sell-price').value = exp.selling_price || exp.sell_price || '';
        
        // Description clean up
        let desc = exp.description || '';
        if (desc.startsWith('Qty:')) {
            const parts = desc.split('|');
            if (parts.length > 1) desc = parts.slice(1).join('|').trim();
        }
        document.getElementById('expense-desc').value = desc;

        // Scroll to form
        document.getElementById('expense-form-container').scrollIntoView({ behavior: 'smooth' });
        
        if (typeof window.showToast === 'function') {
            window.showToast('Editing: Updates will preserve original date.', 'info', null, 2500);
        }

        // Change button text to indicate update mode
        const submitBtn = document.querySelector('#expense-form button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Update Expense';

        // Close menu
        const menu = document.getElementById(`action-menu-${id}`);
        if (menu) menu.classList.add('hidden');
    };

    // Close action menus when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    });

    window.updateExpenseStats = function() {
        // Simple logic for summary cards (if any)
        console.log('Stats updated');
    };

    // Initial render
    if (typeof window.renderExpenses === 'function') window.renderExpenses();
}
