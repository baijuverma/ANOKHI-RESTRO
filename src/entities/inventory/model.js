
// src/entities/inventory/model.js
export let inventoryState = [];

export const setInventory = (items) => {
    inventoryState = items;
};

export const getProductById = (id) => {
    return inventoryState.find(p => String(p.id) === String(id));
};

// src/entities/inventory/index.js
export * from './model.js';
