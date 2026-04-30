import { tables } from '../../entities/table/model.js';
import { inventory } from '../../entities/inventory/model.js';
import { storage } from '../../shared/lib/utils.js';

export const adjustTableCount = (delta) => {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    let current = parseInt(input.value) || 0;
    current = Math.max(1, current + delta);
    input.value = current;
};

export const saveTableSettings = () => {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    const count = parseInt(input.value);
    
    // Update tables array
    let currentTables = [...tables];
    if (count > currentTables.length) {
        for (let i = currentTables.length; i < count; i++) {
            currentTables.push({
                id: `T${i + 1}`,
                name: `Table ${i + 1}`,
                cart: [],
                advance: 0
            });
        }
    } else {
        currentTables = currentTables.slice(0, count);
    }
    
    // Save to local and global (legacy)
    storage.set('anokhi_tables', currentTables);
    window.tables = currentTables; 
    
    // Trigger Global Sync if available
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
    
    alert(`Configuration Saved! ${count} tables are now available.`);
    
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();
    if (typeof window.refreshUI === 'function') window.refreshUI();
};

export const importDefaultMenu = () => {
    if (!confirm('This will add 10 Bihar Special items to your inventory. Continue?')) return;
    
    const biharSpecial = [
        { id: 'BS01', name: 'Litti Chokha', price: 120, category: 'Main Course', itemType: 'Veg', status: 'In Stock', quantity: 50 },
        { id: 'BS02', name: 'Sattu Paratha', price: 80, category: 'Main Course', itemType: 'Veg', status: 'In Stock', quantity: 50 },
        { id: 'BS03', name: 'Bihari Fish Curry', price: 250, category: 'Main Course', itemType: 'Non-Veg', status: 'In Stock', quantity: 30 },
        { id: 'BS04', name: 'Champaran Mutton', price: 450, category: 'Main Course', itemType: 'Non-Veg', status: 'In Stock', quantity: 20 },
        { id: 'BS05', name: 'Dal Pitha', price: 90, category: 'Snacks', itemType: 'Veg', status: 'In Stock', quantity: 40 },
        { id: 'BS06', name: 'Thekua', price: 150, category: 'Dessert', itemType: 'Veg', status: 'In Stock', quantity: 100 },
        { id: 'BS07', name: 'Malpua', price: 100, category: 'Dessert', itemType: 'Veg', status: 'In Stock', quantity: 50 },
        { id: 'BS08', name: 'Bihari Chicken Curry', price: 280, category: 'Main Course', itemType: 'Non-Veg', status: 'In Stock', quantity: 30 },
        { id: 'BS09', name: 'Khaja', price: 120, category: 'Dessert', itemType: 'Veg', status: 'In Stock', quantity: 60 },
        { id: 'BS10', name: 'Chana Ghugni', price: 70, category: 'Snacks', itemType: 'Veg', status: 'In Stock', quantity: 50 }
    ];
    
    // Merge with existing inventory
    const existingIds = new Set(inventory.map(i => String(i.id)));
    const newItems = biharSpecial.filter(i => !existingIds.has(String(i.id)));
    
    if (newItems.length === 0) {
        return alert('Bihar Special items already exist in your inventory.');
    }
    
    inventory.push(...newItems);
    storage.set('anokhi_inventory', inventory);
    window.inventory = inventory; // Legacy support
    
    // Trigger Global Sync
    if (typeof window.saveData === 'function') {
        window.saveData();
    }
    
    alert(`Success! ${newItems.length} Bihar Special items added to inventory.`);
    
    if (typeof window.renderInventory === 'function') window.renderInventory();
    if (typeof window.renderPOSItems === 'function') window.renderPOSItems();
    if (typeof window.refreshUI === 'function') window.refreshUI();
};
