import { createTableCard } from '../../shared/ui/TableCard.js';
import { tables } from '../../entities/table/model.js';

export const renderTableGrid = (containerId, currentSelectedTable, onSelect) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    const currentTables = window.tables || tables;
    const activeOrders = window.activeOrders || [];

    currentTables.forEach(table => {
        const isSelected = String(table.id) === String(currentSelectedTable);
        
        // Check if table has a held bill or active cart items
        // Fix: Ensure the held order actually has items
        const tableHeldOrder = activeOrders.find(o => 
            String(o.tableId) === String(table.id) && 
            o.items && o.items.length > 0
        );
        
        const hasActiveCart = Array.isArray(table.cart) && table.cart.length > 0;
        
        // Final Occupied state
        const isOccupied = !!(tableHeldOrder || hasActiveCart);
        
        // Enhance table object for the UI component
        const enhancedTable = {
            ...table,
            isOccupied: isOccupied,
            total: tableHeldOrder ? tableHeldOrder.total : 0,
            timestamp: tableHeldOrder ? tableHeldOrder.createdAt : (table.timestamp || null)
        };

        const card = createTableCard(enhancedTable, isSelected, onSelect);
        container.appendChild(card);
    });
};
