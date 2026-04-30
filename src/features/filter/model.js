import { normalizeType } from './lib/filter-logic.js';

export const filterState = { current: 'all' };

/**
 * Updates the visual state of filter buttons in the UI.
 * @param {string} activeType 
 */
export const updateFilterUI = (activeType) => {
    const filterContainer = document.getElementById('pos-filter-container');
    if (!filterContainer) return;

    const buttons = filterContainer.querySelectorAll('button');
    buttons.forEach(btn => {
        const btnType = btn.getAttribute('data-type');
        const isActive = btnType === activeType;
        
        if (isActive) {
            btn.style.background = (activeType === 'veg') ? '#22c55e' : (activeType === 'nonveg' ? '#ef4444' : 'var(--accent-color)');
            btn.style.color = 'white';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = (btnType === 'veg') ? '#22c55e' : (btnType === 'nonveg' ? '#ef4444' : 'var(--accent-color)');
        }
    });
};

export const setFilter = (type) => {
    console.log(`Filter Button Clicked: ${type}`);
    filterState.current = type;
    updateFilterUI(type);
    
    if (typeof window.refreshUI === 'function') {
        window.refreshUI();
    } else {
        console.warn('window.refreshUI is not defined!');
    }
};

