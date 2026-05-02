// ============================================================
// src/app/boot.js
// Application Bootstrap — runs after DOM is injected by main.js
// ============================================================

export function initBoot() {
    const runBoot = () => {
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

            // 1. ESCAPE: Close modals, suggestions, or clear search
            if (e.key === 'Escape') {
                // Hide suggestion panels
                document.querySelectorAll('.suggestions-panel').forEach(p => {
                    p.classList.add('hidden');
                    p.style.display = 'none';
                });

                if (activeModal) {
                    if (typeof closeModal === 'function') closeModal(activeModal.id);
                    return;
                }
                
                if (active === searchInput) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    searchInput.blur();
                    return;
                }
                
                if (typeof newBill === 'function') newBill();
                return;
            }

            // 2. ENTER → Process Sale (if not in a modal)
            if (e.key === 'Enter' && !activeModal) {
                // If in payment inputs, process sale
                if (active && (active.id === 'pay-cash-amount' || active.id === 'pay-upi-amount')) {
                    if (typeof processSale === 'function') processSale();
                    return;
                }
                
                // If in search input and cart has items, process sale?
                // Actually, usually Enter in search just keeps focus. 
                // But if cart has items and search is focused, maybe process?
                // Let's keep it safe.
                if (active === searchInput && window.cart?.length > 0) {
                     // if (typeof processSale === 'function') processSale();
                }
            }

            // 3. IGNORE: System keys, Modals, Other Inputs
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            
            const isOtherInput = active &&
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) &&
                active !== searchInput &&
                !active.classList.contains('searchable-dropdown-input'); // Allow if it's our own search

            if (isOtherInput) return;

            // 4. TYPE TO SEARCH: Redirect to POS and Focus Search
            if (e.key.length === 1 && !activeModal) {
                // Redirect if not on POS
                if (posView && !posView.classList.contains('active')) {
                    if (typeof showView === 'function') showView('pos');
                }

                // Focus and Append
                if (searchInput && active !== searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                    
                    // Clear search if it was just redirected? No, keep it.
                    const startValue = searchInput.value;
                    searchInput.value = startValue + e.key;
                    
                    // Trigger real-time filtering
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } 
            
            // 5. BACKSPACE REDIRECTION: If on POS but not focused, focus search
            else if (e.key === 'Backspace' && active !== searchInput && !activeModal) {
                if (posView && posView.classList.contains('active')) {
                    e.preventDefault();
                    searchInput.focus();
                    if (searchInput.value.length > 0) {
                        searchInput.value = searchInput.value.slice(0, -1);
                        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            } 
            
            // 6. FUNCTION KEYS
            else if (e.key === 'F4') {
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
        if (itemForm && typeof handleItemSubmit === 'function') {
            itemForm.addEventListener('submit', handleItemSubmit);
        }

        const restockForm = document.getElementById('restock-form');
        if (restockForm && typeof handleRestockSubmit === 'function') {
            restockForm.addEventListener('submit', handleRestockSubmit);
        }

        const posSearchInput = document.getElementById('pos-search');
        if (posSearchInput) posSearchInput.addEventListener('input', (e) => {
            if (typeof renderPOSItems === 'function') renderPOSItems(e.target.value);
        });

        // 5. Initial Renders (from localStorage cache)
        if (typeof window.refreshUI === 'function') {
            window.refreshUI();
        } else {
            if (typeof updateDashboard  === 'function') updateDashboard();
            if (typeof renderInventory  === 'function') renderInventory();
            if (typeof renderPOSItems   === 'function') renderPOSItems();
            if (typeof renderHistory    === 'function') renderHistory();
            if (typeof renderTableGrid  === 'function') renderTableGrid();
            if (typeof renderExpenses   === 'function') renderExpenses();
            if (typeof updateExpenseStats === 'function') updateExpenseStats();
        }

        // 6. Sync from Supabase in background
        if (typeof syncFromSupabase === 'function') {
            syncFromSupabase().then(() => {
                if (typeof window.refreshUI === 'function') window.refreshUI();
            }).catch(err => console.warn('Background sync failed:', err));
        }

        console.log('initBoot() completed successfully.');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runBoot);
    } else {
        runBoot();
    }
}
