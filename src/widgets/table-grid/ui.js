import { createTableCard } from '../../shared/ui/TableCard.js';
import { tables } from '../../entities/table/model.js';

export const renderTableGrid = (containerId, currentSelectedTable, onSelect) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    tables.forEach(table => {
        const isSelected = String(table.id) === String(currentSelectedTable);
        const card = createTableCard(table, isSelected, onSelect);
        container.appendChild(card);
    });
};
