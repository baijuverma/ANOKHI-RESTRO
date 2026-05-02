
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
        items = expenseData.main;
    } else {
        const mainValue = document.getElementById('expense-main-cat').value;
        items = expenseData.sub[mainValue] || [];
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
        items = expenseData.main.filter(i => i.toLowerCase().includes(query));
    } else {
        const mainValue = document.getElementById('expense-main-cat').value;
        items = (expenseData.sub[mainValue] || []).filter(i => i.toLowerCase().includes(query));
    }

    renderSuggestions(items, input, panel);
    panel.classList.remove('hidden');
    panel.style.display = 'block';
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

export function initExpensesLogic() {
    window.handleExpenseSubmit = async function(e) {
        e.preventDefault();
        const mainCat = document.getElementById('expense-main-cat').value;
        const subCat = document.getElementById('expense-sub-cat').value;
        const desc = document.getElementById('expense-desc').value;

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
                    description: desc
                });
            }
        });

        window.saveData();
        e.target.reset();
        window.renderExpenses();
        window.updateExpenseStats();
        if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
        alert('Expense saved!');
    };

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
    window.renderExpenses();
}
