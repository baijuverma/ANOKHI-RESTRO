
// src/entities/inventory/model.js

export let inventory = window.inventory || [];

export const setInventory = (items) => {
    inventory = items;
    window.inventory = inventory;
};

export const syncInventory = () => {
    inventory = window.inventory;
};

export const getProductById = (id) => {
    return inventory.find(p => String(p.id) === String(id));
};

export const reorderInventory = (id) => {
    const idx = inventory.findIndex(i => String(i.id) === String(id));
    if (idx > -1) {
        const item = inventory.splice(idx, 1)[0];
        inventory.unshift(item);
        window.inventory = inventory;
    }
};

