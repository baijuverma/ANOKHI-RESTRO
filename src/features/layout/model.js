/**
 * Feature: Layout Management (FSD)
 * Handles conditional visibility of UI elements based on app state.
 */

import { renderLayoutToggle } from '../../shared/ui/LayoutToggle.js';

export const syncLayoutVisibility = (orderType, currentTableId) => {
    const curtainArea = document.getElementById('tables-curtain-area');
    const tableIndicator = document.getElementById('total-table-indicator');
    
    // Normalize Order Type (Strictly match DINE_IN)
    const type = String(orderType || 'DINE_IN').trim().toUpperCase();
    const isDineIn = type === 'DINE_IN';

    // 1. Handle Table Section Visibility
    if (curtainArea) {
        curtainArea.style.setProperty('display', isDineIn ? 'block' : 'none', 'important');
    }

    // 2. Handle Curtain Arrow Visibility (Atomic Component)
    renderLayoutToggle('tables-curtain-toggle-btn', isDineIn, () => {
        if (typeof window.toggleTablesCurtain === 'function') window.toggleTablesCurtain();
    });

    // 3. Handle Total Row Table Indicator
    if (tableIndicator) {
        if (isDineIn && currentTableId) {
            const found = (window.tables || []).find(t => String(t.id) === String(currentTableId));
            const name = found ? found.name : `Table ${currentTableId}`;
            tableIndicator.textContent = `(${name})`;
        } else {
            tableIndicator.textContent = '';
        }
    }
};
