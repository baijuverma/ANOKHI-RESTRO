// ============================================================
// src/app/boot.js
// Application Bootstrap — runs after DOM is injected by main.js
// ============================================================

export function initBoot() {
    console.log('initBoot() called — DOM ready:', !!document.getElementById('login-screen'));

    // 1. Always show login screen on load
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
        loginScreen.style.display = 'flex';
        const pwdInput = document.getElementById('login-password');
        if (pwdInput) {
            pwdInput.value = '';
            setTimeout(() => pwdInput.focus(), 150);
        }
    } else {
        console.error('BOOT ERROR: #login-screen not found! HTML may not be injected yet.');
    }

    // 2. Global Keyboard Shortcuts & Search Redirection
    document.addEventListener('keydown', (e) => {
        const searchInput = document.getElementById('pos-search');
        const posView     = document.getElementById('pos');
        const login       = document.getElementById('login-screen');
        const activeModal = document.querySelector('.modal.active');
        const active      = document.activeElement;

        // Skip if login screen visible
        if (login && login.style.display !== 'none' && !login.classList.contains('hide')) return;

        // Handle open modals
        if (activeModal) {
            if (e.key === 'Escape') { if (typeof closeModal === 'function') closeModal(activeModal.id); return; }
            if (e.key === 'Enter')  {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
                if (typeof closeModal === 'function') closeModal(activeModal.id);
                return;
            }
            return;
        }

        // Ignore if user is in another input
        const isOtherInput = active &&
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) &&
            active !== searchInput;

        if (isOtherInput) {
            if (e.key === 'Enter' && window.cart?.length > 0 &&
                (active.id === 'pay-cash-amount' || active.id === 'pay-upi-amount')) {
                if (typeof processSale === 'function') processSale();
            }
            return;
        }

        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // ESC
        if (e.key === 'Escape') {
            if (active === searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.blur();
                return;
            }
            if (typeof newBill === 'function') newBill();
        }

        // ENTER → Process Sale
        if (e.key === 'Enter') {
            if (window.cart?.length > 0) {
                if (typeof processSale === 'function') processSale();
            }
        }

        // Type to Search
        if (!searchInput) return;
        if (e.key.length === 1) {
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

    // 3. Sidebar Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (typeof showView === 'function') showView(target);
        });
    });

    // 4. Form Submissions
    const itemForm = document.getElementById('item-form');
    if (itemForm) itemForm.addEventListener('submit', handleItemSubmit);

    const restockForm = document.getElementById('restock-form');
    if (restockForm) restockForm.addEventListener('submit', handleRestockSubmit);

    const posSearchInput = document.getElementById('pos-search');
    if (posSearchInput) posSearchInput.addEventListener('input', (e) => {
        if (typeof renderPOSItems === 'function') renderPOSItems(e.target.value);
    });

    // 5. Initial Renders (from localStorage cache)
    if (typeof updateDashboard  === 'function') updateDashboard();
    if (typeof renderInventory  === 'function') renderInventory();
    if (typeof renderPOSItems   === 'function') renderPOSItems();
    if (typeof renderHistory    === 'function') renderHistory();
    if (typeof renderTableGrid  === 'function') renderTableGrid();
    if (typeof renderExpenses   === 'function') renderExpenses();
    if (typeof updateExpenseStats === 'function') updateExpenseStats();

    // 6. Sync from Supabase in background
    if (typeof syncFromSupabase === 'function') {
        syncFromSupabase().then(() => {
            if (typeof updateDashboard  === 'function') updateDashboard();
            if (typeof renderInventory  === 'function') renderInventory();
            if (typeof renderHistory    === 'function') renderHistory();
            if (typeof renderExpenses   === 'function') renderExpenses();
            if (typeof updateExpenseStats === 'function') updateExpenseStats();
            if (typeof renderTableGrid  === 'function') renderTableGrid();
        }).catch(err => console.warn('Background sync failed:', err));
    }

    console.log('initBoot() completed successfully.');
}
