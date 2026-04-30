export let currentFilter = 'all';

export const setFilter = (type) => {
    currentFilter = type;
    
    // UI Update logic (Buttons styling)
    const filterContainer = document.getElementById('pos-filter-container');
    if (filterContainer) {
        const buttons = filterContainer.querySelectorAll('button');
        buttons.forEach(btn => {
            const btnType = btn.getAttribute('data-type');
            if (btnType === type) {
                btn.style.background = (type === 'veg') ? '#22c55e' : (type === 'nonveg' ? '#ef4444' : 'var(--accent-color)');
                btn.style.color = 'white';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = (btnType === 'veg') ? '#22c55e' : (btnType === 'nonveg' ? '#ef4444' : 'var(--accent-color)');
            }
        });
    }
    
    if (typeof window.refreshUI === 'function') window.refreshUI();
};
