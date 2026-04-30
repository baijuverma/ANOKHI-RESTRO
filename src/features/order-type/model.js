export let currentOrderType = 'DINE_IN';

export const setOrderType = (type) => {
    currentOrderType = type;
    
    // UI Update: Buttons highlighting
    const container = document.getElementById('order-type-container');
    if (container) {
        const buttons = container.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-type') === type) {
                btn.classList.add('active');
                btn.style.background = 'var(--accent-color)';
                btn.style.color = 'white';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-secondary)';
            }
        });
    }

    // Logic: Show/Hide Tables section
    const tablesSection = document.getElementById('tables-curtain-area');
    if (tablesSection) {
        if (type === 'DINE_IN') {
            tablesSection.style.display = 'block';
        } else {
            tablesSection.style.display = 'none';
        }
    }
    
    if (typeof window.refreshUI === 'function') window.refreshUI();
};
