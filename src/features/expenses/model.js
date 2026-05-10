
// --- Expense Data & Suggestions Logic ---
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
        const defaultSubs = expenseData.sub[mainValue] || [];
        const invItems = (window.inventory || []).filter(i => i.category === mainValue).map(i => i.name);
        items = [...new Set([...defaultSubs, ...invItems])];
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
        const defaultSubs = expenseData.sub[mainValue] || [];
        const invItems = (window.inventory || []).filter(i => i.category === mainValue).map(i => i.name);
        const allSub = [...new Set([...defaultSubs, ...invItems])];
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
        div.textContent = item;
        div.onmousedown = (e) => {
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

    const qty = parseFloat(document.getElementById('expense-qty').value) || 0;
    const sellPrice = parseFloat(document.getElementById('expense-sell-price').value) || 0;
    const cash = parseFloat(document.getElementById('expense-cash').value) || 0;
    const upi = parseFloat(document.getElementById('expense-upi').value) || 0;
    const udhar = parseFloat(document.getElementById('expense-udhar').value) || 0;

    if (cash === 0 && upi === 0 && udhar === 0) {
        return alert('Please enter an amount.');
    }

    const modes = [{ n: 'Cash', v: cash }, { n: 'UPI', v: upi }, { n: 'Udhar', v: udhar }];
    modes.forEach(m => {
        if (m.v > 0) {
            window.expensesHistory.unshift({
                id: Date.now().toString() + Math.random(),
                date: new Date().toISOString(),
                main_category: mainCat,
                sub_category: subCat,
                amount: m.v,
                payment_mode: m.n,
                description: qty > 0 ? `Qty: ${qty} | ${desc}` : desc,
                qty: qty
            });
        }
    });

    // Auto-update or Auto-add Inventory Stock if not Kitchen/Raw Material
    const isRawMaterial = mainCat.toLowerCase().includes('raw material') || mainCat.toLowerCase().includes('kitchen');
    const isBuiltInExpenseCat = ['Staff & Payroll', 'Operations & Maintenance', 'Other Expenses'].includes(mainCat);
    
    if (!isRawMaterial && window.inventory && (qty > 0 || sellPrice > 0)) {
        // Try to find the matching item in inventory by Sub Category name
        const invItem = window.inventory.find(i => i.name.trim().toLowerCase() === subCat.trim().toLowerCase());
        
        if (invItem) {
            if (qty > 0) invItem.quantity = (parseFloat(invItem.quantity) || 0) + qty;
            if (sellPrice > 0) invItem.price = sellPrice;
            
            // Also update category if it was previously uncategorized or if user is forcing a new category
            if (invItem.category !== mainCat && !isBuiltInExpenseCat) {
                invItem.category = mainCat;
            }
            localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
            if (typeof window.renderInventory === 'function') window.renderInventory();
            console.log(`Auto-updated inventory: ${invItem.name} +${qty} (Price: ${sellPrice})`);
        } else if (!isBuiltInExpenseCat && qty > 0) {
            // Auto-Add NEW item to Inventory
            const newItem = {
                 id: Date.now().toString() + Math.floor(Math.random() * 1000),
                 name: subCat.trim(),
                 category: mainCat.trim(),
                 type: 'Veg', // Default type
                 price: sellPrice, // Save the new selling price
                 quantity: qty,
                 low_stock_threshold: 5
            };
            window.inventory.unshift(newItem);
            localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
            if (typeof window.renderInventory === 'function') window.renderInventory();
            console.log(`Auto-added NEW item to inventory: ${subCat} +${qty} (Price: ${sellPrice})`);
        }
    }

    if (typeof window.saveData === 'function') window.saveData();
    e.target.reset();
    if (typeof window.renderExpenses === 'function') window.renderExpenses();
    if (typeof window.updateExpenseStats === 'function') window.updateExpenseStats();
    if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
    if (typeof window.updateDashboard === 'function') window.updateDashboard();
    
    alert('Expense saved!');
};

export function initExpensesLogic() {
    const form = document.getElementById('expense-form');
    if (form) {
        form.addEventListener('submit', window.handleExpenseSubmit);
    }


    window.renderExpenses = function() {
        const tbody = document.getElementById('expenses-tbody');
        if(!tbody) return;
        tbody.innerHTML = (window.expensesHistory || []).map((exp, index) => `
            <tr>
                <td style="color: var(--text-secondary); font-size: 11px;">${index + 1}</td>
                <td>${window.getDDMMYYYY ? window.getDDMMYYYY(new Date(exp.date)) : exp.date}</td>
                <td>${exp.main_category}</td>
                <td>${exp.sub_category}</td>
                <td>₹${exp.amount}</td>
                <td><span class="status-badge">${exp.payment_mode}</span></td>
                <td title="${exp.description || ''}">${exp.description || '-'}</td>
                <td><button class="btn-danger" onclick="deleteExpense('${exp.id}')"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    };

    window.deleteExpense = async function(id) {
        if(confirm('Delete this expense?')) {
            window.expensesHistory = window.expensesHistory.filter(e => e.id !== id);
            window.saveData();
            if (window.db) await window.db.from('expenses').delete().eq('id', id);
            window.renderExpenses();
            window.updateExpenseStats();
        }
    };

    window.updateExpenseStats = function() {
        // Simple logic for summary cards (if any)
        console.log('Stats updated');
    };

    // Initial render
    if (typeof window.renderExpenses === 'function') window.renderExpenses();
}
