export const initKeyboardShortcuts = () => {
    window.addEventListener('keydown', (e) => {
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
                if (typeof window.closeModal === 'function') window.closeModal(activeModal.id);
                return;
            }
            if (e.key === 'Enter') {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
                if (typeof window.closeModal === 'function') window.closeModal(activeModal.id);
                return;
            }
            return;
        }

        // 3. Ignore if user is inside another real input/textarea/select
        const isOtherInput = active && 
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) && 
            active !== searchInput;
        
        if (isOtherInput) {
            if (e.key === 'Enter' && (window.cart || []).length > 0 && (active.id === 'pay-cash-amount' || active.id === 'pay-upi-amount')) {
                if (typeof window.processSale === 'function') window.processSale();
            }
            return;
        }

        // 4. Ignore system shortcuts
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // 5. ESC Logic (Reduce Quantity)
        if (e.key === 'Escape') {
            if (active === searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                searchInput.blur();
                return;
            }

            e.preventDefault();
            
            let targetCart = [];
            const orderType = window.selectedOrderType || 'DINE_IN';
            
            if (orderType === 'DINE_IN') {
                const tableId = window.currentSelectedTable;
                if (!tableId) return;
                const table = (window.tables || []).find(t => String(t.id) === String(tableId));
                if (table && table.cart) targetCart = table.cart;
            } else {
                targetCart = window.cart || [];
            }

            if (targetCart && targetCart.length > 0) {
                const lastItem = targetCart[targetCart.length - 1];
                if (lastItem.cartQty !== undefined) lastItem.cartQty -= 1;
                if (lastItem.quantity !== undefined) lastItem.quantity -= 1;

                const finalQty = (lastItem.cartQty !== undefined) ? lastItem.cartQty : lastItem.quantity;
                
                if (finalQty <= 0) {
                    const newCart = targetCart.filter(i => i.id !== lastItem.id);
                    if (orderType === 'DINE_IN') {
                        const table = (window.tables || []).find(t => String(t.id) === String(window.currentSelectedTable));
                        if (table) table.cart = newCart;
                    } else {
                        window.cart = newCart;
                    }
                }

                if (typeof window.refreshUI === 'function') window.refreshUI();
            }
        }

        // 6. ENTER Logic (Process Sale)
        if (e.key === 'Enter') {
            if ((window.cart || []).length > 0) {
                if (typeof window.processSale === 'function') window.processSale();
            }
        }

        // 7. Type to Search Logic
        if (!searchInput) return;

        if (e.key.length === 1) {
            // Automatically switch to POS view if not active
            if (posView && !posView.classList.contains('active')) {
                if (typeof window.showView === 'function') window.showView('pos');
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
            if (window.selectedOrderType === 'DINE_IN' && typeof window.openAdvanceModal === 'function') {
                window.openAdvanceModal();
            }
        } else if (e.key === 'F8') {
            e.preventDefault();
            if (window.selectedOrderType === 'DINE_IN' && typeof window.holdOrder === 'function') {
                window.holdOrder();
            }
        }
    });
};
