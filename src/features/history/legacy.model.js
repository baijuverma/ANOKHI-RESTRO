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

    const modal = document.getElementById('inventory-list-modal');
    const titleEl = document.getElementById('inventory-list-title');
    const tbody = document.getElementById('inventory-list-tbody');
    
    if (!modal || !tbody) return;

    titleEl.innerText = title;
    tbody.innerHTML = list.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.category || 'General'}</td>
            <td><span class="stock-badge ${item.quantity === 0 ? 'out' : (item.quantity <= (item.lowStockThreshold || 5) ? 'low' : 'ok')}">${item.quantity} ${item.unit || ''}</span></td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="text-align:center">No items found</td></tr>';

    window.openModal('inventory-list-modal');
}

// Calendar View Logic
function updateCalendarView(sales) {
    const wrapper = document.getElementById('sales-calendar-wrapper');
    if (!wrapper) return;

    const date = window.currentCalendarDate || new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Header
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calendar-month-year').innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = `<div class="calendar-grid">`;
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach(wd => html += `<div class="calendar-weekday">${wd}</div>`);

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${String(day).padStart(2,'0')}-${String(month+1).padStart(2,'0')}-${year}`;
        const daySales = sales.filter(s => {
            const sd = new Date(s.date);
            return sd.getDate() === day && sd.getMonth() === month && sd.getFullYear() === year;
        });

        const total = daySales.reduce((sum, s) => sum + (s.total || 0), 0);
        const orders = daySales.length;
        
        // Cash/UPI split for calendar hover or detail
        let cashAmt = daySales.reduce((sum, s) => {
            const pMode = s.payment_mode || s.paymentMode || 'CASH';
            const split = s.split_amounts || s.splitAmounts;
            if (pMode === 'CASH') return sum + (s.total || 0);
            if (pMode === 'BOTH' && split) return sum + (parseFloat(split.cash) || 0);
            return sum;
        }, 0);
        let upiAmt = total - cashAmt;

        let extraClass = total > 0 ? 'has-sales' : '';
        let displayTotal = total > 0 ? formatCurrency(total) : '-';
        let displayOrders = orders > 0 ? `${orders} order(s)` : '';
        let breakdownHtml = total > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1);">
                <span style="color:var(--success-color);" title="Cash Sale">Cash: ${cashAmt.toFixed(0)}</span>
                <span style="color:#818cf8;" title="UPI Sale">UPI: ${upiAmt.toFixed(0)}</span>
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
    
    renderHistoryCards();
    if (typeof window.renderHistory === 'function') {
        window.renderHistory();
    }
}

// History Logic
window.renderHistoryCards = renderHistoryCards;
function renderHistoryCards() {
    const sHistory = window.salesHistory || [];
    const eHistory = window.expensesHistory || [];

    // Calculate Monthly Summary for the cards in Header
    const targetMonth = window.currentCalendarDate ? window.currentCalendarDate.getMonth() : new Date().getMonth();
    const targetYear = window.currentCalendarDate ? window.currentCalendarDate.getFullYear() : new Date().getFullYear();

    const monthlySales = sHistory.filter(s => {
        const d = new Date(s.date || s.timestamp);
        return !isNaN(d.getTime()) && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const monthlyExpenses = eHistory.filter(e => {
        const d = new Date(e.date || e.timestamp);
        return !isNaN(d.getTime()) && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    let mTotal = 0, mCash = 0, mUpi = 0;
    monthlySales.forEach(s => {
        mTotal += (s.total || 0);
        const pMode = s.payment_mode || s.paymentMode || 'CASH';
        const split = s.split_amounts || s.splitAmounts;
        
        if (pMode === "UPI") mUpi += (s.total || 0);
        else if (pMode === "BOTH" && split) {
            mUpi += (parseFloat(split.upi) || 0);
            mCash += (parseFloat(split.cash) || 0);
        } else mCash += (s.total || 0);
    });

    const mExpTotal = monthlyExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const mNetProfit = mTotal - mExpTotal;

    // Update UI Cards
    const mSaleEl = document.getElementById("monthly-sale-total");
    const mCashEl = document.getElementById("monthly-cash");
    const mUpiEl = document.getElementById("monthly-upi");
    
    if (mSaleEl) mSaleEl.innerText = window.formatCurrency ? window.formatCurrency(mTotal) : `₹${mTotal.toFixed(2)}`;
    if (mCashEl) mCashEl.innerText = window.formatCurrency ? window.formatCurrency(mCash) : `₹${mCash.toFixed(2)}`;
    if (mUpiEl) mUpiEl.innerText = window.formatCurrency ? window.formatCurrency(mUpi) : `₹${mUpi.toFixed(2)}`;
    
    const mExpEl = document.getElementById("monthly-expense-total");
    if (mExpEl) mExpEl.innerText = window.formatCurrency ? window.formatCurrency(mExpTotal) : `₹${mExpTotal.toFixed(2)}`;
    
    // Calculate Total Dues from all time
    const totalDuesHistory = sHistory.reduce((sum, s) => sum + (parseFloat(s.dues) || 0), 0);
    const totalDuesHistoryEl = document.getElementById("history-total-dues");
    if (totalDuesHistoryEl) totalDuesHistoryEl.innerText = window.formatCurrency ? window.formatCurrency(totalDuesHistory) : `₹${totalDuesHistory.toFixed(2)}`;

    const mProfitEl = document.getElementById("monthly-profit-total");
    if (mProfitEl) {
        mProfitEl.innerText = window.formatCurrency ? window.formatCurrency(mNetProfit) : `₹${mNetProfit.toFixed(2)}`;
        mProfitEl.style.color = mNetProfit >= 0 ? "#22c55e" : "#ef4444";
        const mProfitCard = document.getElementById("monthly-profit-card");
        if (mProfitCard) mProfitCard.style.borderLeft = `4px solid ${mNetProfit >= 0 ? "#22c55e" : "#ef4444"}`;
    }
}

let isLoadingMore = false;
window.loadMoreSales = async function() {
    if (isLoadingMore || !db) return;
    isLoadingMore = true;
    
    const status = document.getElementById('load-more-status');
    const btn = document.getElementById('load-more-btn');
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
