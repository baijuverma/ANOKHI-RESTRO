import { createTableCard } from '../molecules/TableCard.js';
import { tables, currentSelectedTable } from '../../core/state.js';

export function renderDineInGrid(gridElement, onSelect) {
    if (!gridElement) return;
    gridElement.innerHTML = '';

    tables.forEach(table => {
        const isSelected = table.id === currentSelectedTable;
        const card = createTableCard(table, isSelected, onSelect);
        gridElement.appendChild(card);
    });
}
