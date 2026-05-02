/**
 * Widget: DashboardStats (FSD)
 * Renders summary cards (Sale, Expense, Profit) on the main dashboard.
 */

export const renderDashboardStats = (stats) => {
    // Dashboard Cards (Today)
    const elRevenue = document.getElementById('total-revenue');
    const elCash = document.getElementById('today-cash');
    const elUpi = document.getElementById('today-upi');
    const elProfit = document.getElementById('total-profit');
    const elItems = document.getElementById('total-items');
    const elLowStock = document.getElementById('low-stock');
    const elOutStock = document.getElementById('out-of-stock');

    // Update Today Revenue & Breakdown
    if (elRevenue) elRevenue.textContent = window.formatCurrency ? window.formatCurrency(stats.totalRevenue || 0) : `₹${stats.totalRevenue || 0}`;
    if (elCash) elCash.textContent = window.formatCurrency ? window.formatCurrency(stats.todayCash || 0) : `₹${stats.todayCash || 0}`;
    if (elUpi) elUpi.textContent = window.formatCurrency ? window.formatCurrency(stats.todayUpi || 0) : `₹${stats.todayUpi || 0}`;

    // Update Today Profit
    if (elProfit) {
        const profit = parseFloat(stats.profit || 0);
        elProfit.textContent = window.formatCurrency ? window.formatCurrency(profit) : `₹${profit}`;
        elProfit.style.color = profit >= 0 ? '#22c55e' : '#ef4444';
        
        const profitCard = document.getElementById('profit-card');
        if (profitCard) {
            profitCard.style.borderLeft = `4px solid ${profit >= 0 ? '#22c55e' : '#ef4444'}`;
            profitCard.style.background = profit >= 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)';
        }
    }

    // Update Stock Stats
    if (elItems) elItems.textContent = stats.totalItems || 0;
    if (elLowStock) elLowStock.textContent = stats.lowStock || 0;
    if (elOutStock) elOutStock.textContent = stats.outOfStock || 0;
};
