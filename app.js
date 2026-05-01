// Supabase Configuration
const SUPABASE_URL = 'https://fhshckrdkasopfneujmw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qFlDlQChYsm7WobmTOmc6w_Wkb3XSBl';
let db = null;
try {
    const _supa = window.supabase || window.Supabase;
    if (_supa && _supa.createClient) {
        db = _supa.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch(e) {
    console.warn('Supabase not loaded, running in offline mode:', e);
}

// Utility: Truncate Name to 10 chars (8 text + 2 dots)
    } catch (e) {
        console.warn(`Error parsing localStorage key "${key}":`, e);
        return defaultVal;
    }
}

// Data Structures (Initialized with local cache, will be updated from Supabase)
window.inventory = getLocalData('anokhi_inventory', []);
window.salesHistory = getLocalData('anokhi_sales', []);
window.activeOrders = getLocalData('anokhi_active_orders', []);
window.expensesHistory = getLocalData('anokhi_expenses', []);
window.cart = window.cart || []; 
window.selectedOrderType = 'DINE_IN';
window.currentSelectedTable = localStorage.getItem('anokhi_selected_table') || null;
let inventoryTypeFilter = 'all'; // 'all' | 'veg' | 'nonveg'
let posTypeFilter = 'all'; // 'all' | 'veg' | 'nonveg'
window.tables = getLocalData('anokhi_tables', Array.from({length: 12}, (_, i) => ({
    id: `T${i+1}`,
    name: `Table ${i+1}`,
    cart: [],
    advance: 0,
    advanceMode: 'CASH'
})));

let editingSaleId = null;
let previousPaidAmount = 0;

// Initial Data Sync from Supabase
document.addEventListener('DOMContentLoaded', () => {
    // Always show login screen on load
    const loginScreen = document.getElementById('login-screen');
    if(loginScreen) {
        loginScreen.style.display = 'flex';
        const pwdInput = document.getElementById('login-password');
        if (pwdInput) {
            pwdInput.value = '';
            setTimeout(() => pwdInput.focus(), 100);
        }
    }

    // Global Keyboard Shortcuts & Search Redirection
    document.addEventListener('keydown', (e) => {
        const searchInput = document.getElementById('pos-search');
        const posView = document.getElementById('pos');
        const loginScreen = document.getElementById('login-screen');
        const activeModal = document.querySelector('.modal.active');
        const active = document.activeElement;

        // 1. Skip if system locked/login screen visible
        if (loginScreen && loginScreen.style.display !== 'none' && !loginScreen.classList.contains('hide')) return;

        // 2. Handle Modals (Highest Priority)
        if (activeModal) {
            if (e.key === 'Escape') {
                if (typeof closeModal === 'function') closeModal(activeModal.id);
                return;
            }
            if (e.key === 'Enter') {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
                if (typeof closeModal === 'function') closeModal(activeModal.id);
                return;
            }
            return; 
        }

        // 3. Ignore if user is inside another real input/textarea/select
        const isOtherInput = active && 
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) && 
            active !== searchInput;
        
        if (isOtherInput) {
            if (e.key === 'Enter' && (typeof cart !== 'undefined' && cart.length > 0) && (active.id === 'pay-cash-amount' || active.id === 'pay-upi-amount')) {
                if (typeof processSale === 'function') processSale();
            }
            return;
        }

        // 4. Ignore system shortcuts
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // 5. ESC Logic
        if (e.key === 'Escape') {
            if (active === searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.blur();
                return;
            }
            if (typeof newBill === 'function') newBill();
        }

        // 6. ENTER Logic
        if (e.key === 'Enter') {
            if (typeof cart !== 'undefined' && cart.length > 0) {
                if (typeof processSale === 'function') processSale();
            }
        }

        // 7. Type to Search Logic
        if (!searchInput) return;

        if (e.key.length === 1) {
            // Switch to POS if not active
            if (posView && !posView.classList.contains('active')) {
                if (typeof showView === 'function') showView('pos');
            }
            
            if (active !== searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.value += e.key;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (e.key === 'Backspace' && active !== searchInput) {
            if (posView && posView.classList.contains('active')) {
                e.preventDefault();
                searchInput.focus();
                if (searchInput.value.length > 0) {
                    searchInput.value = searchInput.value.slice(0, -1);
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        } else if (e.key === 'F4') {
            e.preventDefault();
            if (typeof openAdvanceModal === 'function') openAdvanceModal();
        } else if (e.key === 'F8') {
            e.preventDefault();
            if (typeof holdOrder === 'function') holdOrder();
        }
    });

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (typeof showView === 'function') showView(target);
        });
    });

    // Form Submissions
    const itemForm = document.getElementById('item-form');
    if (itemForm) itemForm.addEventListener('submit', handleItemSubmit);
    
    const restockForm = document.getElementById('restock-form');
    if (restockForm) restockForm.addEventListener('submit', handleRestockSubmit);
    
    const posSearchInput = document.getElementById('pos-search');
    if (posSearchInput) posSearchInput.addEventListener('input', (e) => {
        if (typeof renderPOSItems === 'function') renderPOSItems(e.target.value);
    });

    // Initial Renders (Show local cache first)
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderPOSItems === 'function') renderPOSItems();
    if (typeof renderHistory === 'function') renderHistory();
    if (typeof renderTableGrid === 'function') renderTableGrid();
    if (typeof renderExpenses === 'function') renderExpenses();
    if (typeof updateExpenseStats === 'function') updateExpenseStats();

    // Sync from Supabase in background