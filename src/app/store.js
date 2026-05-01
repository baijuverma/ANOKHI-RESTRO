// ============================================================
// src/app/store.js
// Global State Initialization (Single Source of Truth)
// All window.* state lives here — initialized once on boot
// ============================================================

function getLocalData(key, defaultVal) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
        console.warn(`Error parsing localStorage key "${key}":`, e);
        return defaultVal;
    }
}

// Expose globally so legacy modules can use it
window.getLocalData = getLocalData;

// --- Supabase DB Instance ---
export let db = null;
try {
    const _supa = window.supabase || window.Supabase;
    if (_supa && _supa.createClient) {
        db = _supa.createClient(
            'https://fhshckrdkasopfneujmw.supabase.co',
            'sb_publishable_qFlDlQChYsm7WobmTOmc6w_Wkb3XSBl'
        );
    }
} catch (e) {
    console.warn('Supabase not loaded, running in offline mode:', e);
}
window.db = db;

// --- Core Data State ---
window.inventory        = getLocalData('anokhi_inventory', []);
window.salesHistory     = getLocalData('anokhi_sales', []);
window.activeOrders     = getLocalData('anokhi_active_orders', []);
window.expensesHistory  = getLocalData('anokhi_expenses', []);
window.cart             = window.cart || [];

// --- Order / Table State ---
window.selectedOrderType    = 'DINE_IN';
window.currentSelectedTable = localStorage.getItem('anokhi_selected_table') || null;

// --- Tables ---
window.tables = getLocalData('anokhi_tables', Array.from({ length: 12 }, (_, i) => ({
    id: `T${i + 1}`,
    name: `Table ${i + 1}`,
    cart: [],
    advance: 0,
    advanceMode: 'CASH'
})));

// --- Edit State ---
window.editingSaleId     = null;
window.previousPaidAmount = 0;

// --- Filter State ---
window.inventoryTypeFilter = 'all'; // 'all' | 'veg' | 'nonveg'
window.posTypeFilter       = 'all'; // 'all' | 'veg' | 'nonveg'
