/**
 * Feature: Layout Management (FSD)
 * Handles conditional visibility of UI elements based on app state.
 */

export const syncLayoutVisibility = (orderType, currentTableId) => {
    const curtainArea = document.getElementById('tables-curtain-area');
    const curtainBtn = document.getElementById('tables-curtain-toggle-btn');
    const tableIndicator = document.getElementById('total-table-indicator');
    
    // Normalize Order Type
    const type = String(orderType || 'DINE_IN').toUpperCase();
    const isDineIn = type === 'DINE_IN';

    // 1. Handle Table Section Visibility
    if (curtainArea) {
        curtainArea.style.display = isDineIn ? 'block' : 'none';
    }

    // 2. Handle Curtain Arrow Visibility
    if (curtainBtn) {
        curtainBtn.style.display = isDineIn ? 'block' : 'none';
    }

    // 3. Handle Total Row Table Indicator
    if (tableIndicator) {
        if (isDineIn && currentTableId) {
            // Access global tables for name lookup
            const found = (window.tables || []).find(t => String(t.id) === String(currentTableId));
            const name = found ? found.name : `Table ${currentTableId}`;
            tableIndicator.textContent = `(${name})`;
        } else {
            tableIndicator.textContent = '';
        }
    }

    console.log(`[Layout Feature] Synced for ${type}. Tables Visible: ${isDineIn}`);
};
