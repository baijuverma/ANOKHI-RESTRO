export const initKeyboardShortcuts = () => {
    window.addEventListener('keydown', (e) => {
        // 1. ESC Logic (Reduce Quantity)
        if (e.key === 'Escape') {
            e.preventDefault();
            const currentCart = window.cart || (typeof cart !== 'undefined' ? cart : []);
            if (currentCart && currentCart.length > 0) {
                const lastItem = currentCart[currentCart.length - 1];
                
                // Decrement qty
                if (lastItem.cartQty !== undefined) lastItem.cartQty -= 1;
                if (lastItem.quantity !== undefined) lastItem.quantity -= 1;

                const finalQty = (lastItem.cartQty !== undefined) ? lastItem.cartQty : lastItem.quantity;
                
                // If 0, remove from cart
                if (finalQty <= 0) {
                    if (typeof cart !== 'undefined') {
                        window.cart = cart.filter(i => i.id !== lastItem.id);
                        // Update the global reference in app.js if it exists
                        window.cart.forEach((v, i) => { if(i < cart.length) cart[i] = v; });
                        if(cart.length > window.cart.length) cart.length = window.cart.length;
                    } else {
                        window.cart = currentCart.filter(i => i.id !== lastItem.id);
                    }
                }

                // Force Refresh UI
                if (typeof window.refreshUI === 'function') window.refreshUI();
                if (typeof renderCart === 'function') renderCart();
                if (typeof renderPOSItems === 'function') renderPOSItems();
            }
        }

        // 2. ENTER Logic (Process Sale)
        if (e.key === 'Enter') {
            const activeModal = document.querySelector('.modal.active');
            if (!activeModal && (window.cart || []).length > 0) {
                if (typeof processSale === 'function') processSale();
            }
        }
    });
};
