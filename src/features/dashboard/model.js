// Feature: Dashboard — Data aggregation and stats calculation
export function initDashboardLogic() {
    // Dashboard update logic is in shared/lib/core/legacy.model.js (updateDashboard)
    // This module adds any dashboard-specific helpers

    window.getDashboardStats = function() {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : '';

        const todaySales = (window.salesHistory || []).filter(s =>
            window.getDDMMYYYY && window.getDDMMYYYY(new Date(s.date)) === todayStr
        );
        const todayExpenses = (window.expensesHistory || []).filter(e =>
            window.getDDMMYYYY && window.getDDMMYYYY(new Date(e.date)) === todayStr
        );

        const totalRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalExpense = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        return {
            totalRevenue,
            totalExpense,
            profit: totalRevenue - totalExpense,
            orderCount: todaySales.length,
            totalItems: (window.inventory || []).length,
            lowStock: (window.inventory || []).filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0).length,
            outOfStock: (window.inventory || []).filter(i => i.quantity === 0).length
        };
    };
}
