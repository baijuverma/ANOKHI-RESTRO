// Feature: Tables — State management for restaurant table system
export function initTablesLogic() {
    // Table state is managed via window.tables (set in store.js)
    // This module provides helper functions for table operations

    window.getTableById = function(id) {
        return (window.tables || []).find(t => String(t.id) === String(id));
    };

    window.updateTableCart = function(tableId, cart) {
        const tables = window.tables || [];
        const idx = tables.findIndex(t => String(t.id) === String(tableId));
        if (idx > -1) {
            tables[idx].cart = JSON.parse(JSON.stringify(cart));
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
        }
    };

    window.clearTableState = function(tableId) {
        const tables = window.tables || [];
        const idx = tables.findIndex(t => String(t.id) === String(tableId));
        if (idx > -1) {
            tables[idx].cart = [];
            tables[idx].advance = 0;
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
        }
    };
}
