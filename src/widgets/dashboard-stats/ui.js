/**
 * Widget: DashboardStats (FSD)
 * Renders summary cards (Sale, Expense, Profit) on the main dashboard.
 */

export const renderDashboardStats = (stats) => {
    const containers = {
        totalSale: document.getElementById('total-sale-amount'),
        totalExpense: document.getElementById('total-expense-amount'),
        netProfit: document.getElementById('net-profit-amount'),
        totalOrders: document.getElementById('total-orders-count')
    };

    if (containers.totalSale) containers.totalSale.textContent = `₹${stats.totalSale || 0}`;
    if (containers.totalExpense) containers.totalExpense.textContent = `₹${stats.totalExpense || 0}`;
    if (containers.netProfit) containers.netProfit.textContent = `₹${(stats.totalSale || 0) - (stats.totalExpense || 0)}`;
    if (containers.totalOrders) containers.totalOrders.textContent = stats.totalOrders || 0;
};
