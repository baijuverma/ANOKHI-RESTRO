
// --- History & Dashboard Logic ---
// Top-level exports and window assignments

window.renderHistoryCards = function() {
    const sHistory = window.salesHistory || [];
    const eHistory = window.expensesHistory || [];

    // Use current calendar date or fallback to current month
    const targetDate = window.currentCalendarDate || new Date();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    const monthlySales = sHistory.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const monthlyExpenses = eHistory.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    let mTotal = 0, mCash = 0, mUpi = 0;
    monthlySales.forEach(s => {
        const total = parseFloat(s.total || 0);
        mTotal += total;
        
        const pMode = (s.payment_mode || s.paymentMode || 'CASH').toUpperCase();
        const split = s.split_amounts || s.splitAmounts;

        if (pMode === "UPI") {
            mUpi += total;
        } else if (pMode === "BOTH" && split) {
            mUpi += parseFloat(split.upi || 0);
            mCash += parseFloat(split.cash || 0);
        } else {
            mCash += total;
        }
    });

    const mExpTotal = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const mNetProfit = mTotal - mExpTotal;

    const safeUpdateText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = window.formatCurrency ? window.formatCurrency(val) : `₹${val.toFixed(2)}`;
    };

    safeUpdateText("monthly-sale-total", mTotal);
    safeUpdateText("monthly-cash", mCash);
    safeUpdateText("monthly-upi", mUpi);
    safeUpdateText("monthly-expense-total", mExpTotal);
    safeUpdateText("monthly-profit-total", mNetProfit);

    const mProfitEl = document.getElementById("monthly-profit-total");
    if (mProfitEl) {
        mProfitEl.style.color = mNetProfit >= 0 ? "#22c55e" : "#ef4444";
        const mProfitCard = document.getElementById("monthly-profit-card");
        if (mProfitCard) mProfitCard.style.borderLeft = `4px solid ${mNetProfit >= 0 ? "#22c55e" : "#ef4444"}`;
    }

    const totalDues = sHistory.reduce((sum, s) => sum + parseFloat(s.dues || s.due_amount || 0), 0);
    safeUpdateText("history-total-dues", totalDues);
};

window.toggleDuesFilter = function() {
    window.showOnlyDues = !window.showOnlyDues;
    const statusText = document.getElementById('dues-filter-status');
    const card = document.getElementById('dues-filter-card');
    
    if (window.showOnlyDues) {
        if(statusText) {
            statusText.innerText = 'Filter: DUES ONLY (Click to Clear)';
            statusText.style.background = '#ef4444';
            statusText.style.color = 'white';
        }
        if(card) card.style.background = 'rgba(239, 68, 68, 0.15)';
        
        // Sync column highlight
        if (window.historyPaymentFilter !== 'DUES' && typeof window.togglePaymentFilter === 'function') {
            window.togglePaymentFilter('DUES', 'history');
            window.renderHistoryCards();
            return;
        }
    } else {
        if(statusText) {
            statusText.innerText = 'Click to Filter Dues';
            statusText.style.background = 'rgba(239, 68, 68, 0.1)';
            statusText.style.color = 'var(--text-secondary)';
        }
        if(card) card.style.background = 'rgba(239, 68, 68, 0.05)';
        
        // Clear column highlight
        if (window.historyPaymentFilter === 'DUES' && typeof window.togglePaymentFilter === 'function') {
            window.togglePaymentFilter('DUES', 'history');
            window.renderHistoryCards();
            return;
        }
    }
    
    window.renderHistoryCards();
    if (typeof window.renderHistory === 'function') window.renderHistory();
};

window.updateCalendarView = function() {
    const m = parseInt(document.getElementById('calendar-month-select').value);
    const y = parseInt(document.getElementById('calendar-year-select').value);
    window.currentCalendarDate = new Date(y, m, 1);
    if (typeof window.renderHistory === 'function') window.renderHistory();
};

export function initHistoryLogic() {
    // Initial call to cards
    window.renderHistoryCards();
}

// Global functions for modals (stock, etc.) - keep them global
window.showStockList = function(type) {
    const inv = window.inventory || [];
    let list = [];
    let title = '';
    
    if (type === 'total') {
        list = inv;
        title = 'Total Items Available';
    } else if (type === 'low') {
        list = inv.filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0);
        title = 'Low Stock Items';
    } else if (type === 'out') {
        list = inv.filter(i => i.quantity === 0);
        title = 'Out of Stock Items';
    }
    
    const titleEl = document.getElementById('stock-list-title');
    if (titleEl) titleEl.innerText = title;
    
    const tbody = document.getElementById('stock-list-tbody');
    if (tbody) {
        tbody.innerHTML = list.length === 0 
            ? '<tr><td colspan="3" style="text-align:center;">No items found.</td></tr>'
            : list.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td style="font-weight: bold; color: ${item.quantity === 0 ? 'var(--danger-color)' : (item.quantity <= (item.lowStockThreshold || 5) ? 'var(--warning-color)' : 'var(--success-color)')}">${item.quantity}</td>
                </tr>
            `).join('');
    }
    if (typeof window.openModal === 'function') window.openModal('stockListModal');
};

window.viewReceipt = function(id) {
    const sale = (window.salesHistory || []).find(s => String(s.id) === String(id));
    if (sale && typeof window.showReceipt === 'function') window.showReceipt(sale);
};

window.deleteSale = async function(saleId) {
    window.requestAdminVerification("Deleting this sale will restore item stock.", async () => {
        const sale = (window.salesHistory || []).find(s => String(s.id) === String(saleId));
        if (sale) {
            // Restore Stock
            sale.items.forEach(cartItem => {
                const invItem = (window.inventory || []).find(i => String(i.id) === String(cartItem.id));
                if (invItem) invItem.quantity += cartItem.cartQty;
            });

            window.salesHistory = window.salesHistory.filter(s => String(s.id) !== String(saleId));
            window.saveData();
            
            if (window.db) await window.db.from('sales_history').delete().eq('id', saleId);

            if (typeof window.renderHistory === 'function') window.renderHistory();
            if (typeof window.renderInventory === 'function') window.renderInventory();
            if (typeof window.showToast === 'function') window.showToast("Sale deleted and stock restored", "success");
        }
    });
};

window.downloadGrossReport = function() {
    let sales = [...(window.salesHistory || [])];
    const startDateStr = document.getElementById('history-start-date')?.value;
    const endDateStr = document.getElementById('history-end-date')?.value;

    // Filter by date range and payment filter
    if (startDateStr || endDateStr || window.historyPaymentFilter || window.showOnlyDues) {
        sales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0,0,0,0);
            if (startDateStr) {
                const s = new Date(startDateStr);
                s.setHours(0,0,0,0);
                if (saleDate < s) return false;
            }
            if (endDateStr) {
                const e = new Date(endDateStr);
                e.setHours(23,59,59,999);
                if (saleDate > e) return false;
            }
            
            // Apply showOnlyDues filter
            const sDuesAmount = parseFloat(sale.dues || 0);
            if (window.showOnlyDues && sDuesAmount <= 0.01) return false;
            
            // Apply payment filter for PDF report
            if (window.historyPaymentFilter) {
                const totalPaid = parseFloat(sale.total || 0) - parseFloat(sale.dues || 0);
                const split = sale.split_amounts || sale.splitAmounts;
                const pMode = (sale.payment_mode || sale.paymentMode || 'CASH').toUpperCase();
                let sCash = 0, sUpi = 0;
                if (pMode === 'UPI') {
                    sUpi = totalPaid;
                } else if ((pMode === 'BOTH' || pMode === 'SPLIT') && split) {
                    sCash = parseFloat(split.cash || 0);
                    sUpi = parseFloat(split.upi || 0);
                } else {
                    sCash = totalPaid;
                }
                const sDues = parseFloat(sale.dues || 0);

                if (window.historyPaymentFilter === 'CASH' && sCash <= 0) return false;
                if (window.historyPaymentFilter === 'UPI' && sUpi <= 0) return false;
                if (window.historyPaymentFilter === 'DUES' && sDues <= 0) return false;
            }

            return true;
        });
    }

    if (sales.length === 0) {
        alert("No transactions found in this period.");
        return;
    }

    const formatToDDMMYYYY = (dateStr) => {
        if (!dateStr) return "";
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dateStr;
    };

    const formattedStart = formatToDDMMYYYY(startDateStr);
    const formattedEnd = formatToDDMMYYYY(endDateStr);
    
    const dateRangeStr = (formattedStart || "") + (formattedEnd ? " to " + formattedEnd : "");
    const title = `Gross Item Sales Report (${dateRangeStr || "All Time"})`;
    
    if (typeof window.generateGrossReport === 'function') {
        window.generateGrossReport(title, sales);
        if (typeof window.showToast === 'function') {
            window.showToast("Gross Report PDF generated successfully", "success");
        }
    } else {
        console.error("PDF generation service not available");
        alert("PDF service not loaded. Please refresh the page.");
    }
};
