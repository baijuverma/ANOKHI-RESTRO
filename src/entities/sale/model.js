
// src/entities/sale/model.js
export let salesState = [];

export const setSales = (data) => {
    salesState = data;
};

export const getSaleById = (id) => {
    return salesState.find(s => String(s.id) === String(id));
};

export const calculateTotalRevenue = () => {
    return salesState.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
};

// src/entities/sale/index.js
export * from './model.js';
