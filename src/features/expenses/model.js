export function initExpensesLogic() {
    window.updateExpenseSubCats = function() {
        const mainCatEl = document.getElementById('expense-main-cat');
        const subCatEl = document.getElementById('expense-sub-cat');
        const subCatList = document.getElementById('sub-cat-list');
        
        if (!mainCatEl || !subCatList) return;

        const mainCatValue = mainCatEl.value;
        
        // Map Display Names to internal keys
        const categoryMap = {
            'Staff & Payroll': 'staff',
            'Raw Material/Ingredients': 'material',
            'Operations & Maintenance': 'operation',
            'Other Expenses': 'other'
        };

        const key = categoryMap[mainCatValue];
        const subCats = {
            'staff': ['Staff Salary', 'Staff Advance', 'Incentives/Bonus', 'Staff Meals', 'Uniforms', 'Training', 'Staff Welfare'],
            'material': ['Groceries & Spices', 'Vegetables & Fruits', 'Meat, Fish & Poultry', 'Dairy & Eggs', 'Oil & Ghee', 'Flour/Rice/Dal', 'Beverages/Soft Drinks', 'Water Cans', 'Tea/Coffee/Milk', 'Bakery Items'],
            'operation': ['Rent', 'Electricity Bill', 'Water Bill', 'Gas/Fuel', 'Internet/Phone', 'Marketing/Ads', 'Repairs & Maintenance', 'Cleaning Supplies', 'Packaging Material', 'Software/POS Subscription', 'Waste Management', 'License/Legal', 'Stationery', 'Electricity Repair', 'Plumbing'],
            'other': ['Miscellaneous', 'Petty Cash', 'Transport/Delivery', 'Taxes', 'Others', 'Donations', 'Bank Charges']
        };

        // Clear existing list
        subCatList.innerHTML = '';

        if (key && subCats[key]) {
            subCats[key].forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                subCatList.appendChild(opt);
            });
            
            // If main category is a perfect match from our list, clear sub-cat to avoid mismatched data
            if (subCatEl && !subCats[key].includes(subCatEl.value)) {
                // Only clear if the current sub-cat doesn't belong to the new main category
                // This prevents clearing when just typing
            }
        }
    };

    // Add direct event listener as reinforcement
    setTimeout(() => {
        const mainCatEl = document.getElementById('expense-main-cat');
        if (mainCatEl) {
            mainCatEl.addEventListener('input', window.updateExpenseSubCats);
            console.log('Expense sub-category input listener attached');
        }
    }, 500);

    window.handleExpenseSubmit = async function(e) {
        e.preventDefault();
        const mainCatEl = document.getElementById('expense-main-cat');
        const mainCat = mainCatEl.options[mainCatEl.selectedIndex]?.text || mainCatEl.value;
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
                window.expensesHistory.unshift(newExpense);
                addedCount++;
            }
        });

        window.saveData();
        e.target.reset();
        window.renderExpenses();
        window.updateExpenseStats();
        if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
        alert('Expense(s) added successfully!');
    }

    window.renderExpenses = function() {
        const tbody = document.getElementById('expenses-tbody');
        if(!tbody) return;
        tbody.innerHTML = '';

        window.expensesHistory.forEach((exp, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="color: var(--text-secondary); font-size: 11px;">${index + 1}</td>
                <td>${window.formatDateLabel ? window.formatDateLabel(exp.date) : exp.date}</td>
                <td>${exp.main_category}</td>
                <td>${exp.sub_category}</td>
                <td>${window.formatCurrency ? window.formatCurrency(exp.amount) : exp.amount}</td>
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

        // Add Infinite Scroll Sentinel
        if (window.expensesHistory.length >= 20) {
            const sentinelRow = document.createElement('tr');
            sentinelRow.id = 'expenses-sentinel';
            sentinelRow.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 13px;">
                    <div id="expenses-load-status">
                        <i class="fa-solid fa-spinner fa-spin"></i> Loading more expenses...
                    </div>
                </td>
            `;
            tbody.appendChild(sentinelRow);

            setTimeout(() => {
                if (typeof window.setupInfiniteScroll === 'function') {
                    window.setupInfiniteScroll('expenses-sentinel', window.loadMoreExpenses);
                }
            }, 100);
        }
    }

    let isLoadingMoreExp = false;
    window.loadMoreExpenses = async function() {
        if (isLoadingMoreExp || !window.db) return;
        isLoadingMoreExp = true;

        const status = document.getElementById('expenses-load-status');
        if (status) status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching records...';

        try {
            const start = window.expensesHistory.length;
            const end = start + 19;
            const { data, error } = await window.db.from('expenses').select('*').order('date', { ascending: false }).range(start, end);
            
            if (error) throw error;

            if (data && data.length > 0) {
                window.expensesHistory = [...window.expensesHistory, ...data];
                window.renderExpenses();
            } else {
                if (status) status.innerHTML = 'All expenses loaded';
                setTimeout(() => {
                    const row = document.getElementById('expenses-sentinel');
                    if (row) row.remove();
                }, 3000);
            }
        } catch (err) {
            console.error('Load More Expenses Error:', err);
        } finally {
            isLoadingMoreExp = false;
        }
    }

    window.deleteExpense = async function(id) {
        const expenseToUndo = window.expensesHistory.find(e => e.id === id);
        if (!expenseToUndo) return;

        if(confirm('Are you sure you want to delete this expense?')) {
            const originalHistory = [...window.expensesHistory];
            window.expensesHistory = window.expensesHistory.filter(e => e.id !== id);
            window.saveData();
            
            if(window.db) {
                try {
                    await window.db.from('expenses').delete().eq('id', id);
                } catch(err) {
                    console.error('Delete Expense Error:', err);
                }
            }
            
            window.renderExpenses();
            window.updateExpenseStats();
            if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
            
            // Show toast with Undo
            if (typeof window.showToast === 'function') {
                window.showToast("Expense Deleted", "success", async () => {
                    window.expensesHistory = originalHistory;
                    if (window.db) {
                        await window.db.from('expenses').upsert([expenseToUndo]);
                    }
                    window.saveData();
                    window.renderExpenses();
                    window.updateExpenseStats();
                    if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
                });
            }
        }
    }

    let analyticsChart = null;

    window.updateExpenseStats = function() {
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
            const dateFull = window.getDDMMYYYY ? window.getDDMMYYYY(d) : dateLabel;
            
            last7Days.push(dateLabel);

            const daySales = (window.salesHistory || [])
                .filter(s => (window.getDDMMYYYY ? window.getDDMMYYYY(new Date(s.date)) : '') === dateFull)
                .reduce((sum, s) => sum + (s.total || 0), 0);
            
            const dayExpenses = (window.expensesHistory || [])
                .filter(e => (window.getDDMMYYYY ? window.getDDMMYYYY(new Date(e.date)) : '') === dateFull)
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
                    legend: { display: false },
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
}
