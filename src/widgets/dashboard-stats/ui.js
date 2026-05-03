/**
 * Widget: DashboardStats (FSD)
 * Renders summary cards (Sale, Expense, Profit) on the main dashboard.
 */

export const renderDashboardStats = (stats) => {
    // Card Elements
    const elTodayRevenue = document.getElementById('today-revenue-card');
    const elTodayCash = document.getElementById('today-cash-card');
    const elTodayUpi = document.getElementById('today-upi-card');
    const elTodayProfit = document.getElementById('today-profit-card');
    const elTodayExpense = document.getElementById('today-expense-card');
    const elProfitWrapper = document.getElementById('profit-card-wrapper');

    // Utility to format
    const format = (val) => window.formatCurrency ? window.formatCurrency(val || 0) : `₹${val || 0}`;

    // Update Today Sales
    if (elTodayRevenue) elTodayRevenue.textContent = format(stats.todayRevenue);
    if (elTodayCash) elTodayCash.textContent = format(stats.todayCash);
    if (elTodayUpi) elTodayUpi.textContent = format(stats.todayUpi);

    // Update Today Expense
    if (elTodayExpense) elTodayExpense.textContent = format(stats.totalExpenseToday);

    // Update Today Profit
    if (elTodayProfit) {
        const profit = parseFloat(stats.profitToday || 0);
        elTodayProfit.textContent = format(profit);
        
        // Dynamic coloring
        const color = profit >= 0 ? '#22c55e' : '#ef4444';
        const bgColor = profit >= 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)';
        
        elTodayProfit.style.color = color;
        if (elProfitWrapper) {
            elProfitWrapper.style.borderColor = color;
            elProfitWrapper.style.background = bgColor;
            const h3 = elProfitWrapper.querySelector('h3');
            if (h3) h3.style.color = color;
        }
    }
};
