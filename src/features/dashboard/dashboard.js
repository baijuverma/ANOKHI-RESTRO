
import { formatCurrency } from '../../shared/utils/index.js';

export const updateDashboardStats = (sales, expenses) => {
    const totalSale = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalOrders = sales.length;

    document.getElementById('stat-total-sales').innerText = formatCurrency(totalSale);
    document.getElementById('stat-total-expenses').innerText = formatCurrency(totalExp);
    document.getElementById('stat-total-orders').innerText = totalOrders;
};

export const initDashboardChart = (data) => {
    // Logic for Chart.js initialization
    console.log("Dashboard Chart Initialized with data:", data);
};
