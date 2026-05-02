export function initHistoryLogic() {
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

    sortedHistory.forEach((sale, index) => {
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
            <td style="color: var(--text-secondary); font-size: 11px;">${index + 1}</td>
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
                    <button class="btn-primary" style="padding: 6px 16px; font-size:12px; background: var(--accent-color); border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;" onclick="editSale('${sale.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>


                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add Load More button if there are potentially more records
    if (salesHistory.length >= 20) {
        const sentinelRow = document.createElement('tr');
        sentinelRow.id = 'load-more-sentinel';
        sentinelRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 13px;">
                <button id="load-more-btn" class="btn-primary" style="background: rgba(255,255,255,0.05); border: 1px solid var(--panel-border); width: 200px;" onclick="loadMoreSales()">
                    Scrolling for more...
                </div>
            </td>
        `;
        tbody.appendChild(sentinelRow);

        // Setup IntersectionObserver
        setTimeout(() => {
            if (typeof window.setupInfiniteScroll === 'function') {
                window.setupInfiniteScroll('load-more-sentinel', window.loadMoreSales);
            }
        }, 100);
    }
}

let isLoadingMore = false;
window.loadMoreSales = async function() {
    if (isLoadingMore || !db) return;
    isLoadingMore = true;
    
    const status = document.getElementById('load-more-status');
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
            window.salesHistory = [...window.salesHistory, ...data];
            // No need to re-render everything, just append to table
            if (typeof renderHistory === 'function') renderHistory(); 
        } else {
            // No more data
            if (status) status.innerHTML = 'All transactions loaded';
            setTimeout(() => {
                const row = document.getElementById('load-more-sentinel');
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
// Expense logic moved to src/features/expenses/model.js



}
