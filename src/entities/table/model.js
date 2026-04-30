import { storage } from '../../shared/lib/utils.js';
import { getSupabase } from '../../shared/api/supabase.js';

export let tables = storage.get('anokhi_tables', Array.from({length: 12}, (_, i) => ({
    id: `T${i+1}`,
    name: `Table ${i+1}`,
    cart: [],
    advance: 0
})));

export let currentSelectedTableId = null;

export const selectTable = (id) => {
    currentSelectedTableId = id;
};

export const syncTables = async () => {
    const db = getSupabase();
    if (!db) return tables;

    try {
        const { data } = await db.from('tables').select('*');
        if (data) {
            tables = tables.map(t => {
                const dbTable = data.find(dt => dt.id === t.id);
                return dbTable ? { ...t, ...dbTable } : t;
            });
            storage.set('anokhi_tables', tables);
        }
    } catch (err) {
        console.error('Tables Sync Error:', err);
    }
    return tables;
};
