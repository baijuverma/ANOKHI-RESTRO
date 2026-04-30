export const createTableCard = (table, isSelected, onClick) => {
    const div = document.createElement('div');
    const isOccupied = table.cart && table.cart.length > 0;
    
    div.className = `table-card ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`;
    div.innerHTML = `
        <span class="bullet" style="position:absolute; top:12px; right:12px; background:${isOccupied ? '#ef4444' : '#22c55e'};"></span>
        <div class="table-name">${table.name}</div>
        <div class="table-status">${isOccupied ? 'In Use' : 'Ready'}</div>
    `;

    div.onclick = () => onClick(table.id);

    return div;
};
