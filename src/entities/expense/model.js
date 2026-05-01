
// src/entities/expense/model.js
export let expenseState = [];

export const setExpenses = (data) => {
    expenseState = data;
};

export const calculateTotalExpenses = () => {
    return expenseState.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
};

// src/entities/expense/index.js
export * from './model.js';
