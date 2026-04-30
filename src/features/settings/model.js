import { tables } from '../../entities/table/model.js';
import { inventory } from '../../entities/inventory/model.js';
import { storage } from '../../shared/lib/utils.js';
import { getSupabase } from '../../shared/api/supabase.js';

export const adjustTableCount = (delta) => {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    let current = parseInt(input.value) || 0;
    current = Math.max(1, current + delta);
    input.value = current;
};

export const saveTableSettings = async () => {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    const count = parseInt(input.value);
    
    // Update tables array
    if (count > tables.length) {
        for (let i = tables.length; i < count; i++) {
            tables.push({
                id: `T${i + 1}`,
                name: `Table ${i + 1}`,
                cart: [],
                advance: 0
            });
        }
    } else if (count < tables.length) {
        tables.splice(count);
    }
    
    // Update global and storage
    window.tables = tables;
    storage.set('anokhi_tables', tables);
    
    // Sync to Supabase
    const db = getSupabase();
    if (db) {
        try {
            await db.from('tables').upsert(tables.map(t => ({
                id: t.id,
                name: t.name,
                cart: t.cart,
                advance: t.advance
            })));
        } catch (err) {
            console.error('Supabase Sync Error:', err);
        }
    }

    alert(`Configuration Saved! ${count} tables are now available.`);
    
    // Refresh UI
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();
    if (typeof window.refreshUI === 'function') window.refreshUI();
};

export const importDefaultMenu = async () => {
    if (!confirm('This will add 10 Bihar Special items to your inventory. Continue?')) return;
    
    const biharSpecial = [
        { id: 'BS01', name: 'Litti Chokha', price: 120, category: 'Main Course', itemType: 'Veg', quantity: 50 },
        { id: 'BS02', name: 'Sattu Paratha', price: 80, category: 'Main Course', itemType: 'Veg', quantity: 50 },
        { id: 'BS03', name: 'Bihari Fish Curry', price: 250, category: 'Main Course', itemType: 'Non-Veg', quantity: 30 },
        { id: 'BS04', name: 'Champaran Mutton', price: 450, category: 'Main Course', itemType: 'Non-Veg', quantity: 20 },
        { id: 'BS05', name: 'Dal Pitha', price: 90, category: 'Snacks', itemType: 'Veg', quantity: 40 },
        { id: 'BS06', name: 'Thekua', price: 150, category: 'Dessert', itemType: 'Veg', quantity: 100 },
        { id: 'BS07', name: 'Malpua', price: 100, category: 'Dessert', itemType: 'Veg', quantity: 50 },
        { id: 'BS08', name: 'Bihari Chicken Curry', price: 280, category: 'Main Course', itemType: 'Non-Veg', quantity: 30 },
        { id: 'BS09', name: 'Khaja', price: 120, category: 'Dessert', itemType: 'Veg', quantity: 60 },
        { id: 'BS10', name: 'Chana Ghugni', price: 70, category: 'Snacks', itemType: 'Veg', quantity: 50 }
    ];
    
    const existingNames = new Set(inventory.map(i => i.name.toLowerCase()));
    const newItems = biharSpecial.filter(i => !existingNames.has(i.name.toLowerCase()));
    
    if (newItems.length === 0) {
        return alert('Bihar Special items already exist in your inventory.');
    }
    
    inventory.push(...newItems);
    window.inventory = inventory;
    storage.set('anokhi_inventory', inventory);

    // Sync to Supabase
    const db = getSupabase();
    if (db) {
        try {
            await db.from('inventory').upsert(newItems.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                item_type: i.itemType,
                price: i.price,
                quantity: i.quantity
            })));
        } catch (err) {
            console.error('Supabase Sync Error:', err);
        }
    }
    
    alert(`Success! ${newItems.length} Bihar Special items added to inventory.`);
    
    if (typeof window.renderInventory === 'function') window.renderInventory();
    if (typeof window.renderPOSItems === 'function') window.renderPOSItems();
    if (typeof window.refreshUI === 'function') window.refreshUI();
};
