// Widget: Sidebar — Navigation rendering
export function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            // Clear cart when navigating via sidebar
            if (window.cart && window.cart.length > 0) {
                if (!confirm('Are you sure you want to leave this view? Any unsaved bill items will be cleared.')) {
                    return; // Abort navigation
                }
                // They confirmed, so clear the cart and edit state
                if (typeof window.clearCart === 'function') {
                    window.clearCart();
                } else {
                    window.cart = [];
                }
                window.editingSaleId = null;
                window.currentSelectedTable = null;
                
                // Reset buttons if they were in edit mode
                const processBtn = document.getElementById('btn-process-sale');
                if (processBtn) {
                    processBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sale [Ent]';
                    processBtn.style.background = '';
                }
                const deleteBtn = document.getElementById('btn-delete-sale');
                if (deleteBtn) deleteBtn.style.display = 'none';
            } else {
                // Cart is empty, but we should still clear edit state to be safe
                window.editingSaleId = null;
                window.currentSelectedTable = null;
                
                const processBtn = document.getElementById('btn-process-sale');
                if (processBtn) {
                    processBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sale [Ent]';
                    processBtn.style.background = '';
                }
                const deleteBtn = document.getElementById('btn-delete-sale');
                if (deleteBtn) deleteBtn.style.display = 'none';
            }

            if (typeof window.showView === 'function') window.showView(target);
        });
    });
}
