import { getLocalData } from './utils.js';

// Supabase Configuration
const SUPABASE_URL = 'https://fhshckrdkasopfneujmw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qFlDlQChYsm7WobmTOmc6w_Wkb3XSBl';

export let db = null;
try {
    const _supa = window.supabase || window.Supabase;
    if (_supa && _supa.createClient) {
        db = _supa.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch(e) {
    console.warn('Supabase not loaded, running in offline mode:', e);
}

// Global State
export let inventory = getLocalData('anokhi_inventory', []);
export let salesHistory = getLocalData('anokhi_sales', []);
export let expensesHistory = getLocalData('anokhi_expenses', []);
export let cart = [];
export let selectedOrderType = 'DINE_IN';
export let currentSelectedTable = null;
export let inventoryTypeFilter = 'all';
export let posTypeFilter = 'all';
export let tables = getLocalData('anokhi_tables', Array.from({length: 12}, (_, i) => ({
    id: `T${i+1}`,
    name: `Table ${i+1}`,
    cart: [],
    advance: 0,
    advanceMode: 'CASH'
})));

export let editingSaleId = null;
export let previousPaidAmount = 0;

// Setters to update state (Atomic Principle: Encapsulated State)
export const setState = {
    setInventory: (data) => { inventory = data; },
    setSalesHistory: (data) => { salesHistory = data; },
    setExpensesHistory: (data) => { expensesHistory = data; },
    setCart: (data) => { cart = data; },
    setOrderType: (type) => { selectedOrderType = type; },
    setTable: (id) => { currentSelectedTable = id; },
    setPosFilter: (filter) => { posTypeFilter = filter; },
    setEditing: (id, amount) => { editingSaleId = id; previousPaidAmount = amount; }
};
