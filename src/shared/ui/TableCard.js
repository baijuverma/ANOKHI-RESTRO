export const createTableCard = (table, isSelected, onClick) => {
    const div = document.createElement('div');
    const isOccupied = table.cart && table.cart.length > 0;
    
    div.className = `table-card ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`;
    div.innerHTML = `
        <div class="table-name">${table.name}</div>
        <div class="table-status">${isOccupied ? 'Occupied' : 'Available'}</div>
    `;

    div.onclick = () => onClick(table.id);

    return div;
};
