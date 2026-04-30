export function createTableCard(table, isSelected, onSelect) {
    const div = document.createElement('div');
    const isOccupied = table.cart && table.cart.length > 0;
    
    div.className = `table-card ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`;
    div.onclick = () => onSelect(table.id);
    
    div.innerHTML = `
        <i class="fa-solid fa-chair" style="font-size: 24px; margin-bottom: 10px; color: ${isOccupied ? '#ef4444' : 'var(--accent-color)'}"></i>
        <div style="font-weight: bold;">${table.name}</div>
        ${isOccupied ? `<div style="font-size: 10px; color: #ef4444; margin-top: 5px;">Occupied</div>` : ''}
    `;
    
    return div;
}
