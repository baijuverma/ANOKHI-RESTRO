
import { updateDashboardStats } from '../features/dashboard/dashboard.js';
import { calculateTotalRevenue } from '../entities/sale/index.js';
import { calculateTotalExpenses } from '../entities/expense/index.js';

export const initDashboardWidget = (sales, expenses) => {
    // Coordinate between Sales Entity, Expense Entity and Dashboard Feature
    const revenue = calculateTotalRevenue();
    const totalExp = calculateTotalExpenses();
    
    updateDashboardStats(sales, expenses);
    console.log("Dashboard Widget: Stats Synced with Entities.");
};
