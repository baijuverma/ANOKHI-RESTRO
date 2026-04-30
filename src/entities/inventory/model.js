import { storage } from '../../shared/lib/utils.js';
import { getSupabase } from '../../shared/api/supabase.js';

// Unified state: Use window.inventory if it exists (legacy sync), otherwise load from storage
export let inventory = window.inventory || storage.get('anokhi_inventory', []);
if (!window.inventory) window.inventory = inventory;

export const syncInventory = async () => {
    const db = getSupabase();
    if (!db) return inventory;

    try {
        const { data } = await db.from('inventory').select('*');
        if (data) {
            inventory = data.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                itemType: i.item_type || 'Veg',
                price: i.price,
                quantity: i.quantity,
                lowStockThreshold: i.low_stock_threshold || 5
            }));
            window.inventory = inventory; // Sync to legacy global
            storage.set('anokhi_inventory', inventory);
        }
    } catch (err) {
        console.error('Inventory Sync Error:', err);
    }
    return inventory;
};

export const reorderInventory = (itemId) => {
    const idx = inventory.findIndex(i => String(i.id) === String(itemId));
    if (idx > -1) {
        const item = inventory.splice(idx, 1)[0];
        inventory.unshift(item);
    }
};
