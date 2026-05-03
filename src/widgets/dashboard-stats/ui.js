/**
 * Widget: DashboardStats (FSD)
 * Renders summary cards (Sale, Expense, Profit) on the main dashboard.
 */

export const renderDashboardStats = (stats) => {
    // Today Stats
    const elTodayRevenue = document.getElementById('today-revenue-card');
    const elTodayCash = document.getElementById('today-cash-card');
    const elTodayUpi = document.getElementById('today-upi-card');

    // Month Stats
    const elMonthRevenue = document.getElementById('month-revenue-card');
    const elMonthCash = document.getElementById('month-cash-card');
    const elMonthUpi = document.getElementById('month-upi-card');
    const elMonthExpense = document.getElementById('month-expense-card');

    // Utility to format
    const format = (val) => window.formatCurrency ? window.formatCurrency(val || 0) : `₹${val || 0}`;

    // Update Today
    if (elTodayRevenue) elTodayRevenue.textContent = format(stats.todayRevenue);
    if (elTodayCash) elTodayCash.textContent = format(stats.todayCash);
    if (elTodayUpi) elTodayUpi.textContent = format(stats.todayUpi);

    // Update Month
    if (elMonthRevenue) elMonthRevenue.textContent = format(stats.monthRevenue);
    if (elMonthCash) elMonthCash.textContent = format(stats.monthCash);
    if (elMonthUpi) elMonthUpi.textContent = format(stats.monthUpi);
    if (elMonthExpense) elMonthExpense.textContent = format(stats.monthExpense);
};
