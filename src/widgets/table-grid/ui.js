import { createTableCard } from '../../shared/ui/TableCard.js';
import { tables } from '../../entities/table/model.js';

export const renderTableGrid = (containerId, currentSelectedTable, onSelect) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    const currentTables = window.tables || tables;
    const heldBills = window.heldBills || [];

    currentTables.forEach(table => {
        const isSelected = String(table.id) === String(currentSelectedTable);
        
        // Check if table has a held bill or active cart items
        const tableHeldBill = heldBills.find(b => String(b.tableId) === String(table.id));
        const hasActiveCart = table.cart && table.cart.length > 0;
        
        // Enhance table object for the UI component
        const enhancedTable = {
            ...table,
            isOccupied: tableHeldBill || hasActiveCart,
            timestamp: tableHeldBill ? tableHeldBill.timestamp : (table.timestamp || Date.now())
        };

        const card = createTableCard(enhancedTable, isSelected, onSelect);
        container.appendChild(card);
    });
};
