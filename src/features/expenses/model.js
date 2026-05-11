// --- Expense Data & Suggestions Logic ---
window.editingExpenseId = null;
window.editingExpenseOldData = null; // To track difference for inventory
// Blacklist for deleted sub-categories
if (!window.deletedExpenseSubs) {
    window.deletedExpenseSubs = JSON.parse(localStorage.getItem('deleted_expense_subs') || '[]');
}
if (!window.deletedExpenseMains) {
    window.deletedExpenseMains = JSON.parse(localStorage.getItem('deleted_expense_mains') || '[]');
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
        items = [...new Set([...expenseData.main, ...invCategories])].filter(item => !window.deletedExpenseMains.includes(item));
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
        const allMain = [...new Set([...expenseData.main, ...invCategories])].filter(item => !window.deletedExpenseMains.includes(item));
        items = allMain.filter(i => i.toLowerCase().includes(query));
    } else {
        const mainValue = document.getElementById('expense-main-cat').value;
        if (inputId === 'expense-main-cat') {
            const isRaw = mainValue.toLowerCase().includes('raw material') || mainValue.toLowerCase().includes('kitchen');
            if (typeof window.setExpenseUnit === 'function') {
                window.setExpenseUnit(isRaw ? 'KG' : 'QTY');
            }
        }
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
        
        // Auto-fill 18% discount for ICE CREAM, or clear it for others
        const discInput = document.getElementById('expense-disc-value');
        if (input.value.trim().toUpperCase() === 'ICE CREAM') {
            if (discInput && discInput.value === '') {
                if (typeof window.setExpenseDiscType === 'function') {
                    window.setExpenseDiscType('%');
                }
                discInput.value = '18';
                if (typeof window.calcExpenseNet === 'function') {
                    window.calcExpenseNet();
                }
            }
        } else if (discInput && discInput.value) {
            discInput.value = '';
            if (typeof window.calcExpenseNet === 'function') {
                window.calcExpenseNet();
            }
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
    if (typeof window.checkExpenseFormDirty === 'function') window.checkExpenseFormDirty();
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

window.getExpenseSuggestionOrder = function(type) {
    const data = localStorage.getItem(`expense_order_${type}`);
    return data ? JSON.parse(data) : [];
};

window.saveExpenseSuggestionOrder = function(type, orderArr) {
    localStorage.setItem(`expense_order_${type}`, JSON.stringify(orderArr));
};

window.moveExpenseSuggestion = function(inputId, panelId, currentItems, index, direction) {
    const orderType = inputId === 'expense-sub-cat' ? `sub_${document.getElementById('expense-main-cat').value}` : 'main';
    let currentOrder = window.getExpenseSuggestionOrder(orderType);
    
    // If currentOrder doesn't have all items, initialize it with current visual order
    if (currentOrder.length === 0 || currentOrder.length !== currentItems.length) {
        currentOrder = [...currentItems];
    }
    
    // Safety bounds
    if (index + direction < 0 || index + direction >= currentOrder.length) return;
    
    // Swap
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[index + direction];
    currentOrder[index + direction] = temp;
    
    window.saveExpenseSuggestionOrder(orderType, currentOrder);
    
    // Re-render
    const input = document.getElementById(inputId);
    const panel = document.getElementById(panelId);
    if (input && panel) {
        renderSuggestions(currentOrder, input, panel);
    }
};

function renderSuggestions(items, input, panel) {
    panel.innerHTML = '';
    
    // Sort items based on saved order
    const orderType = input.id === 'expense-sub-cat' ? `sub_${document.getElementById('expense-main-cat').value}` : 'main';
    const currentOrder = window.getExpenseSuggestionOrder(orderType);
    if (currentOrder.length > 0) {
        items.sort((a, b) => {
            const idxA = currentOrder.indexOf(a);
            const idxB = currentOrder.indexOf(b);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
        });
    }

    if (items.length === 0) {
        const div = document.createElement('div');
        div.className = 'suggestion-item empty';
        div.textContent = input.id === 'expense-sub-cat' && !document.getElementById('expense-main-cat').value 
            ? 'Pehle main category chuniye' 
            : 'No matches found';
        panel.appendChild(div);
        return;
    }

    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '8px 12px';

        const textSpan = document.createElement('span');
        textSpan.textContent = item;
        textSpan.style.flex = '1';

        const actionDiv = document.createElement('div');
        actionDiv.style.display = 'flex';
        actionDiv.style.gap = '8px';
        actionDiv.style.alignItems = 'center';

        // Order Buttons Container
        const orderDiv = document.createElement('div');
        orderDiv.style.display = 'flex';
        orderDiv.style.flexDirection = 'column';
        orderDiv.style.gap = '2px';
        orderDiv.style.marginRight = '8px';

        // Up Arrow
        const upBtn = document.createElement('i');
        upBtn.className = 'fa-solid fa-chevron-up order-btn';
        upBtn.style.fontSize = '10px';
        upBtn.style.cursor = 'pointer';
        upBtn.style.color = index > 0 ? '#6b7280' : '#d1d5db';
        upBtn.title = 'Move Up';
        if (index > 0) {
            upBtn.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.moveExpenseSuggestion(input.id, panel.id, items, index, -1);
            };
        }

        // Down Arrow
        const downBtn = document.createElement('i');
        downBtn.className = 'fa-solid fa-chevron-down order-btn';
        downBtn.style.fontSize = '10px';
        downBtn.style.cursor = 'pointer';
        downBtn.style.color = index < items.length - 1 ? '#6b7280' : '#d1d5db';
        downBtn.title = 'Move Down';
        if (index < items.length - 1) {
            downBtn.onmousedown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.moveExpenseSuggestion(input.id, panel.id, items, index, 1);
            };
        }

        orderDiv.appendChild(upBtn);
        orderDiv.appendChild(downBtn);
        
        // Put the orderDiv at the beginning of the item row
        const leftSideDiv = document.createElement('div');
        leftSideDiv.style.display = 'flex';
        leftSideDiv.style.alignItems = 'center';
        leftSideDiv.appendChild(orderDiv);
        leftSideDiv.appendChild(textSpan);
        
        div.appendChild(leftSideDiv);

        // Add delete button for suggestions
        const delBtn = document.createElement('i');
        delBtn.className = 'fa-solid fa-xmark delete-suggestion-btn';
        delBtn.style.padding = '4px 8px';
        delBtn.style.fontSize = '12px';
        delBtn.style.color = '#ef4444';
        delBtn.style.cursor = 'pointer';
        delBtn.title = 'Delete from suggestions';
        delBtn.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Kya aap sach me "${item}" ko list se delete karna chahte hai? \n\n(YES = OK dabaye, NO = Cancel dabaye)`)) {
                window.deleteExpenseSuggestion(item, input.id);
            }
        };
        actionDiv.appendChild(delBtn);
        
        div.appendChild(actionDiv);

        div.onmousedown = (e) => {
            if (e.target.classList.contains('delete-suggestion-btn') || e.target.classList.contains('order-btn')) return;
            e.preventDefault();
            input.value = item;
            panel.classList.add('hidden');
            panel.style.display = 'none';
            
            if (input.id === 'expense-main-cat') {
                const subInput = document.getElementById('expense-sub-cat');
                if (subInput) {
                    subInput.value = '';
                    subInput.focus(); // Auto focus next field
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
                if (typeof window.setExpenseUnit === 'function') {
                    window.setExpenseUnit(isRaw ? 'KG' : 'QTY');
                }
                
                const qtyContainer = document.getElementById('expense-qty-container');
                if (qtyContainer) {
                    qtyContainer.style.display = isBuiltIn ? 'none' : 'block';
                }

                // Auto-fill 18% discount for ICE CREAM, or clear for others
                const discInput = document.getElementById('expense-disc-value');
                if (item.trim().toUpperCase() === 'ICE CREAM') {
                    if (discInput) {
                        if (typeof window.setExpenseDiscType === 'function') {
                            window.setExpenseDiscType('%');
                        }
                        discInput.value = '18';
                        if (typeof window.calcExpenseNet === 'function') {
                            window.calcExpenseNet();
                        }
                    }
                } else if (discInput && discInput.value) {
                    discInput.value = '';
                    if (typeof window.calcExpenseNet === 'function') {
                        window.calcExpenseNet();
                    }
                }
            } else if (input.id === 'expense-sub-cat') {
                const invItem = (window.inventory || []).find(i => i.name.trim().toLowerCase() === item.trim().toLowerCase());
                const priceInput = document.getElementById('expense-sell-price');
                if (priceInput) {
                    priceInput.value = (invItem && invItem.price) ? invItem.price : '';
                }

                // Auto focus next field
                setTimeout(() => {
                    const qtyContainer = document.getElementById('expense-qty-container');
                    const qtyInput = document.getElementById('expense-qty');
                    const cashInput = document.getElementById('expense-cash');
                    
                    if (qtyInput && qtyContainer && qtyContainer.style.display !== 'none') {
                        qtyInput.focus();
                    } else if (cashInput) {
                        cashInput.focus();
                    }
                }, 10);
            }
        };
        panel.appendChild(div);
    });
}

window.deleteExpenseSuggestion = function(item, inputId) {
    if (inputId === 'expense-main-cat') {
        if (!window.deletedExpenseMains.includes(item)) {
            window.deletedExpenseMains.push(item);
            localStorage.setItem('deleted_expense_mains', JSON.stringify(window.deletedExpenseMains));
            
            // Re-render the current suggestions
            const mainInput = document.getElementById('expense-main-cat');
            if (mainInput) {
                window.handleSearchableInput('expense-main-cat', 'main-suggestions');
            }
        }
    } else {
        if (!window.deletedExpenseSubs.includes(item)) {
            window.deletedExpenseSubs.push(item);
            localStorage.setItem('deleted_expense_subs', JSON.stringify(window.deletedExpenseSubs));
            
            // Re-render the current suggestions
            const subInput = document.getElementById('expense-sub-cat');
            if (subInput) {
                window.handleSearchableInput('expense-sub-cat', 'sub-suggestions');
            }
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
    const unitInput = document.getElementById('expense-unit');

    const qtyContainer = document.getElementById('expense-qty-container');
    const isQtyVisible = qtyContainer && qtyContainer.style.display !== 'none';
    const qty = parseFloat(document.getElementById('expense-qty').value) || 0;
    const unit = unitInput ? unitInput.value : 'QTY';
    
    if (isQtyVisible && qty <= 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please enter a valid quantity.', 'error', null, 2000);
        } else {
            alert('Please enter a valid quantity.');
        }
        setTimeout(() => document.getElementById('expense-qty').focus(), 10);
        return;
    }

    const gross = parseFloat(document.getElementById('expense-gross')?.value) || 0;
    const discValue = parseFloat(document.getElementById('expense-disc-value')?.value) || 0;
    const discType = document.getElementById('expense-disc-type')?.value || '%';
    const discPercent = discType === '%' ? discValue : 0;
    const discFixed = discType === '₹' ? discValue : 0;
    const net = parseFloat(document.getElementById('expense-net')?.value) || 0;
    const sellPrice = parseFloat(document.getElementById('expense-sell-price').value) || 0;
    const cash = parseFloat(document.getElementById('expense-cash').value) || 0;
    const upi = parseFloat(document.getElementById('expense-upi').value) || 0;
    const udhar = parseFloat(document.getElementById('expense-udhar').value) || 0;

    const totalPaid = cash + upi + udhar;
    if (net > 0 && Math.abs(net - totalPaid) > 0.01) {
        if (typeof window.showToast === 'function') {
            window.showToast('Payment split total must equal Net Amount.', 'error', null, 2500);
        } else {
            alert('Payment split total must equal Net Amount.');
        }
        setTimeout(() => document.getElementById('expense-cash').focus(), 10);
        return;
    } else if (cash === 0 && upi === 0 && udhar === 0) {
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
            exp.gross_amount = gross;
            exp.discount_percent = discPercent;
            exp.discount_fixed = discFixed;
            exp.net_amount = net;
            exp.cash = cash;
            exp.upi = upi;
            exp.udhar = udhar;
            exp.description = desc;
            exp.qty = qty;
            exp.unit = unit;
            exp.selling_price = sellPrice;
            
            // Restore button text
            const submitBtn = document.getElementById('expense-submit-btn');
            if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Log New Expense';
            
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
            gross_amount: gross,
            discount_percent: discPercent,
            discount_fixed: discFixed,
            net_amount: net,
            cash: cash,
            upi: upi,
            udhar: udhar,
            description: desc,
            qty: qty,
            unit: unit,
            selling_price: sellPrice
        };
        window.expensesHistory.unshift(expenseRecord);
        if (typeof window.showToast === 'function') {
            window.showToast('Expense saved successfully!', 'success', null, 1000);
        }
    }

    // Handle Inventory Stock Sync (Only for non-Raw/Kitchen/Built-in categories)
    const isRawMaterial = mainCat.toLowerCase().includes('raw material') || mainCat.toLowerCase().includes('kitchen');
    const isBuiltInExpenseCat = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(mainCat);

    if (window.inventory && !isRawMaterial && !isBuiltInExpenseCat) {
        const invItem = window.inventory.find(i => i.name.trim().toLowerCase() === subCat.trim().toLowerCase());
        
        if (window.editingExpenseId && window.editingExpenseOldData) {
            // UPDATE LOGIC: Calculate Difference
            const oldQty = parseFloat(window.editingExpenseOldData.qty) || 0;
            const oldSubCat = (window.editingExpenseOldData.subCat || '').trim().toLowerCase();
            const currentSubCat = subCat.trim().toLowerCase();

            if (currentSubCat === oldSubCat) {
                // Case A: Same item, just check QTY difference
                const deltaQty = qty - oldQty;
                if (deltaQty !== 0 && invItem) {
                    invItem.quantity = (parseFloat(invItem.quantity) || 0) + deltaQty;
                    console.log(`Inventory Adjusted: ${invItem.name} ${deltaQty > 0 ? '+' : ''}${deltaQty}`);
                }
            } else {
                // Case B: Item name changed! Revert old item stock, add new item stock
                const oldInvItem = window.inventory.find(i => i.name.trim().toLowerCase() === oldSubCat);
                if (oldInvItem && oldQty > 0) {
                    oldInvItem.quantity = Math.max(0, (parseFloat(oldInvItem.quantity) || 0) - oldQty);
                    console.log(`Reverted Old Item: ${oldInvItem.name} -${oldQty}`);
                }
                if (invItem) {
                    invItem.quantity = (parseFloat(invItem.quantity) || 0) + qty;
                    console.log(`Updated New Item: ${invItem.name} +${qty}`);
                } else if (qty > 0) {
                    // Auto-Add NEW item to Inventory if it doesn't exist
                    const newInvItem = {
                        id: Date.now().toString() + Math.floor(Math.random() * 1000),
                        name: subCat.trim(),
                        category: mainCat.trim(),
                        type: 'Veg',
                        price: sellPrice || 0,
                        quantity: qty,
                        low_stock_threshold: 5
                    };
                    window.inventory.unshift(newInvItem);
                    console.log(`Auto-added NEW item to inventory: ${subCat} +${qty}`);
                }
            }
            // Update Price and Category if provided
            if (invItem) {
                if (sellPrice > 0) invItem.price = sellPrice;
                invItem.category = mainCat;
            }
            window.editingExpenseOldData = null; // Reset after sync
        } else {
            // NEW RECORD LOGIC
            if (invItem) {
                if (qty > 0) invItem.quantity = (parseFloat(invItem.quantity) || 0) + qty;
                if (sellPrice > 0) invItem.price = sellPrice;
                invItem.category = mainCat;
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
        }
        
        localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
        if (typeof window.renderInventory === 'function') window.renderInventory();
    }

    if (typeof window.saveData === 'function') window.saveData(); // Non-blocking so UI updates instantly
    
    // Cleanup editing state
    window.editingExpenseId = null;
    window.editingExpenseOldData = null;

    e.target.reset();
    
    ['expense-main-cat', 'expense-sub-cat', 'expense-qty', 'expense-cash', 'expense-upi', 'expense-udhar', 'expense-desc', 'expense-sell-price', 'expense-gross', 'expense-disc-value', 'expense-net'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const cancelBtn = document.getElementById('expense-cancel-btn');
    if (cancelBtn) {
        cancelBtn.classList.add('hidden');
        cancelBtn.style.display = 'none';
    }
    
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
        
        // Add listeners for Cancel button visibility
        const fields = ['expense-main-cat', 'expense-sub-cat', 'expense-qty', 'expense-cash', 'expense-upi', 'expense-udhar', 'expense-desc'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', window.checkExpenseFormDirty);
                el.addEventListener('change', window.checkExpenseFormDirty);
            }
        });
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

        const grossEl = document.getElementById('expense-gross');
        if (grossEl) grossEl.value = exp.gross_amount || '';
        
        const discValEl = document.getElementById('expense-disc-value');
        if (discValEl) {
            if (exp.discount_percent > 0) {
                discValEl.value = exp.discount_percent;
                if (typeof window.setExpenseDiscType === 'function') window.setExpenseDiscType('%');
            } else if (exp.discount_fixed > 0) {
                discValEl.value = exp.discount_fixed;
                if (typeof window.setExpenseDiscType === 'function') window.setExpenseDiscType('₹');
            } else {
                discValEl.value = '';
            }
        }
        
        const netEl = document.getElementById('expense-net');
        if (netEl) netEl.value = exp.net_amount || (exp.amount || '');
        
        if (exp.unit && typeof window.setExpenseUnit === 'function') {
            window.setExpenseUnit(exp.unit);
        }
        
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
        const submitBtn = document.getElementById('expense-submit-btn');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Update Expense';

        // Show cancel button
        const cancelBtn = document.getElementById('expense-cancel-btn');
        if (cancelBtn) {
            cancelBtn.classList.remove('hidden');
            cancelBtn.style.display = 'flex';
        }

        // Close menu
        const menu = document.getElementById(`action-menu-${id}`);
        if (menu) menu.classList.add('hidden');
    };

    window.cancelExpenseEdit = function() {
        const form = document.getElementById('expense-form');
        if (form) form.reset();
        
        window.editingExpenseId = null;
        window.editingExpenseOldData = null;
        
        const submitBtn = document.getElementById('expense-submit-btn');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Log New Expense';
        
        const cancelBtn = document.getElementById('expense-cancel-btn');
        if (cancelBtn) {
            cancelBtn.classList.add('hidden');
            cancelBtn.style.display = 'none';
        }

        ['expense-main-cat', 'expense-sub-cat', 'expense-qty', 'expense-cash', 'expense-upi', 'expense-udhar', 'expense-desc', 'expense-sell-price', 'expense-gross', 'expense-disc-value', 'expense-net'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    };

    window.checkExpenseFormDirty = function() {
        const ids = ['expense-main-cat', 'expense-sub-cat', 'expense-qty', 'expense-cash', 'expense-upi', 'expense-udhar', 'expense-desc'];
        let isDirty = !!window.editingExpenseId;
        
        if (!isDirty) {
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el && el.value.trim() !== '') {
                    isDirty = true;
                    break;
                }
            }
        }
        
        const cancelBtn = document.getElementById('expense-cancel-btn');
        if (cancelBtn) {
            if (isDirty) {
                cancelBtn.classList.remove('hidden');
                cancelBtn.style.display = 'flex';
            } else {
                cancelBtn.classList.add('hidden');
                cancelBtn.style.display = 'none';
            }
        }
    };

    // Close action menus when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
            menu.classList.add('hidden');
        });
    });

    window.updateExpenseStats = function() {
        console.log('Expenses logic initialized');
    };

    window.setExpenseUnit = function(unit) {
        const hiddenInput = document.getElementById('expense-unit');
        const slider = document.getElementById('unit-slider');
        const labelKg = document.getElementById('unit-kg-label');
        const labelQty = document.getElementById('unit-qty-label');
        
        if (!hiddenInput || !slider || !labelKg || !labelQty) return;
        
        hiddenInput.value = unit;
        if (unit === 'KG') {
            slider.style.left = '2px';
            labelKg.style.color = '#ffffff';
            labelQty.style.color = '#9ca3af';
        } else {
            slider.style.left = '34px';
            labelKg.style.color = '#9ca3af';
            labelQty.style.color = '#ffffff';
        }
    };

    window.toggleExpenseUnit = function() {
        const hiddenInput = document.getElementById('expense-unit');
        if (!hiddenInput) return;
        if (hiddenInput.value === 'QTY') {
            window.setExpenseUnit('KG');
        } else {
            window.setExpenseUnit('QTY');
        }
    };

    window.setExpenseDiscType = function(type) {
        const hiddenInput = document.getElementById('expense-disc-type');
        const slider = document.getElementById('disc-slider');
        const labelP = document.getElementById('disc-percent-label');
        const labelF = document.getElementById('disc-fixed-label');
        
        if (!hiddenInput || !slider || !labelP || !labelF) return;
        
        hiddenInput.value = type;
        if (type === '%') {
            slider.style.left = '2px';
            labelP.style.color = '#ffffff';
            labelF.style.color = '#9ca3af';
        } else {
            slider.style.left = '36px';
            labelP.style.color = '#9ca3af';
            labelF.style.color = '#ffffff';
        }
        window.calcExpenseNet('discount');
    };

    window.toggleExpenseDiscType = function() {
        const hiddenInput = document.getElementById('expense-disc-type');
        if (!hiddenInput) return;
        if (hiddenInput.value === '%') {
            window.setExpenseDiscType('₹');
        } else {
            window.setExpenseDiscType('%');
        }
    };

    // Initial render
    window.calcExpenseNet = function(changedField) {
        const grossEl = document.getElementById('expense-gross');
        const discValEl = document.getElementById('expense-disc-value');
        const discType = document.getElementById('expense-disc-type')?.value || '%';
        const netEl = document.getElementById('expense-net');
        
        if (!grossEl || !netEl) return;

        let gross = parseFloat(grossEl.value) || 0;
        let discVal = parseFloat(discValEl?.value) || 0;
        
        let discP = discType === '%' ? discVal : 0;
        let discF = discType === '₹' ? discVal : 0;

        if (discP > 100) {
            discP = 100;
            if (discValEl) discValEl.value = 100;
        }

        let totalDisc = (gross * (discP / 100)) + discF;
        if (totalDisc > gross) totalDisc = gross;

        let net = gross - totalDisc;
        netEl.value = net > 0 ? net.toFixed(2) : '';
        
        if (typeof window.calcExpensePaymentSplit === 'function') {
            window.calcExpensePaymentSplit('net');
        }
    };

    window.calcExpensePaymentSplit = function(changedField) {
        const netEl = document.getElementById('expense-net');
        if (!netEl) return;
        
        let net = parseFloat(netEl.value) || 0;
        
        const cashEl = document.getElementById('expense-cash');
        const upiEl = document.getElementById('expense-upi');
        const udharEl = document.getElementById('expense-udhar');
        const warningEl = document.getElementById('payment-limit-warning');
        
        if (!cashEl || !upiEl || !udharEl) return;
        
        let currentCash = parseFloat(cashEl.value) || 0;
        let currentUpi = parseFloat(upiEl.value) || 0;
        let currentUdhar = parseFloat(udharEl.value) || 0;

        if (changedField === 'net') {
            if (currentUpi === 0 && currentUdhar === 0) {
                cashEl.value = net > 0 ? net.toFixed(2) : '';
                currentCash = net;
            }
        }

        // Auto zero cash if UPI is exactly net
        if (changedField === 'upi' && currentUpi === net && net > 0) {
            cashEl.value = '';
            currentCash = 0;
        }

        if (changedField === 'cash' || changedField === 'upi' || changedField === 'net') {
            let remaining = net - (currentCash + currentUpi);
            if (remaining > 0) {
                udharEl.value = remaining.toFixed(2);
                currentUdhar = remaining;
            } else {
                udharEl.value = '';
                currentUdhar = 0;
            }
        }

        // Limit Check
        let totalPaid = currentCash + currentUpi + currentUdhar;
        if (net > 0 && (totalPaid - net) > 0.01) {
            cashEl.style.setProperty('border-color', '#ef4444', 'important');
            upiEl.style.setProperty('border-color', '#ef4444', 'important');
            udharEl.style.setProperty('border-color', '#ef4444', 'important');
            if (warningEl) warningEl.style.display = 'block';
        } else {
            cashEl.style.removeProperty('border-color');
            upiEl.style.removeProperty('border-color');
            udharEl.style.removeProperty('border-color');
            if (warningEl) warningEl.style.display = 'none';
        }
    };

    if (typeof window.renderExpenses === 'function') window.renderExpenses();
}
