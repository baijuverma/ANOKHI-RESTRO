export const initKeyboardShortcuts = () => {
    window.addEventListener('keydown', (e) => {
        // 1. ESC Logic (Reduce Quantity)
        if (e.key === 'Escape') {
            e.preventDefault();
            
            // Determine which cart to target
            let targetCart = [];
            const orderType = window.selectedOrderType || 'DINE_IN';
            
            if (orderType === 'DINE_IN') {
                const tableId = window.currentSelectedTable;
                if (!tableId) return;
                const table = (window.tables || []).find(t => String(t.id) === String(tableId));
                if (table && table.cart) targetCart = table.cart;
            } else {
                targetCart = window.cart || (typeof cart !== 'undefined' ? cart : []);
            }

            if (targetCart && targetCart.length > 0) {
                const lastItem = targetCart[targetCart.length - 1];
                console.log('ESC: Targeting item', lastItem.name, 'current qty', lastItem.cartQty || lastItem.quantity);

                // Decrement qty (Force update both names)
                if (lastItem.cartQty !== undefined) lastItem.cartQty -= 1;
                if (lastItem.quantity !== undefined) lastItem.quantity -= 1;

                const finalQty = (lastItem.cartQty !== undefined) ? lastItem.cartQty : lastItem.quantity;
                
                // If 0, remove from target cart
                if (finalQty <= 0) {
                    const newCart = targetCart.filter(i => i.id !== lastItem.id);
                    
                    if (orderType === 'DINE_IN') {
                        const table = (window.tables || []).find(t => String(t.id) === String(window.currentSelectedTable));
                        if (table) table.cart = newCart;
                    } else {
                        // Update global cart references
                        if (typeof cart !== 'undefined') {
                            cart.length = 0;
                            newCart.forEach(i => cart.push(i));
                        }
                        window.cart = newCart;
                    }
                }

                // ULTIMATE REFRESH: Force every possible render function
                if (typeof window.refreshUI === 'function') window.refreshUI();
                if (typeof renderCart === 'function') renderCart();
                if (typeof renderPOSItems === 'function') renderPOSItems();
                if (typeof renderTableGrid === 'function') renderTableGrid();
            } else {
                console.log('ESC: Cart is empty, nothing to reduce.');
            }
        }

        // 2. ENTER Logic (Process Sale)
        if (e.key === 'Enter') {
            const activeModal = document.querySelector('.modal.active');
            if (!activeModal && (window.cart || []).length > 0) {
                if (typeof processSale === 'function') processSale();
            }
        }

        // 3. Type to Search Logic
        const searchInput = document.getElementById('pos-search');
        if (!searchInput) return;

        // Don't intercept if user is inside another real input/textarea/select
        const active = document.activeElement;
        const isOtherInput = active && 
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) && 
            active !== searchInput;
        if (isOtherInput) return;

        // Ignore system shortcuts
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        if (e.key.length === 1) {
            // Route any printable character to the search bar
            if (active !== searchInput) {
                e.preventDefault();
                searchInput.focus();
                searchInput.value += e.key;
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (e.key === 'Backspace' && active !== searchInput) {
            e.preventDefault();
            searchInput.focus();
            if (searchInput.value.length > 0) {
                searchInput.value = searchInput.value.slice(0, -1);
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });
};
