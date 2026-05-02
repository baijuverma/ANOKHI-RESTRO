export function initExpensesLogic() {
    window.updateExpenseSubCats = function() {
        const mainCatEl = document.getElementById('expense-main-cat');
        const subCatSelect = document.getElementById('expense-sub-cat');
        
        if (!mainCatEl || !subCatSelect) return;

        const mainCat = mainCatEl.value;
        const subCats = {
            'staff': ['Staff Salary', 'Staff Advance', 'Incentives/Bonus', 'Staff Meals', 'Uniforms', 'Training'],
            'material': ['Groceries & Spices', 'Vegetables & Fruits', 'Meat, Fish & Poultry', 'Dairy & Eggs', 'Oil & Ghee', 'Flour/Rice/Dal', 'Beverages/Soft Drinks', 'Water Cans'],
            'operation': ['Rent', 'Electricity Bill', 'Water Bill', 'Gas/Fuel', 'Internet/Phone', 'Marketing/Ads', 'Repairs & Maintenance', 'Cleaning Supplies', 'Packaging Material', 'Software/POS Subscription', 'Waste Management', 'License/Legal'],
            'other': ['Miscellaneous', 'Petty Cash', 'Transport/Delivery', 'Taxes', 'Others']
        };

        // Clear existing options
        subCatSelect.innerHTML = '';

        if (mainCat && subCats[mainCat]) {
            subCatSelect.disabled = false;
            subCatSelect.style.opacity = '1';
            subCatSelect.style.cursor = 'pointer';

            // Default Option
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = '-- Sub Category Chuniye --';
            placeholder.disabled = true;
            placeholder.selected = true;
            subCatSelect.appendChild(placeholder);

            // Populate Sub-Categories
            subCats[mainCat].forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                subCatSelect.appendChild(opt);
            });
        } else {
            subCatSelect.disabled = true;
            subCatSelect.style.opacity = '0.5';
            subCatSelect.style.cursor = 'not-allowed';
            
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Pehle main category chuniye...';
            placeholder.disabled = true;
            placeholder.selected = true;
            subCatSelect.appendChild(placeholder);
        }
    };

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
        if(confirm('Are you sure you want to delete this expense?')) {
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
