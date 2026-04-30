/**
 * Widget: InventoryTable (FSD)
 * Renders the inventory list with stock status and actions.
 */

export const renderInventoryTable = (containerId, inventory, onEdit, onDelete) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!inventory || inventory.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No items in inventory.</td></tr>';
        return;
    }

    container.innerHTML = inventory.map(item => {
        let statusClass = 'status-ok';
        if (item.quantity === 0) statusClass = 'status-out';
        else if (item.quantity <= (item.lowStockThreshold || 5)) statusClass = 'status-low';

        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.itemType || 'Veg'}</td>
                <td>₹${item.price}</td>
                <td class="${statusClass}">${item.quantity}</td>
                <td>${item.lowStockThreshold || 5}</td>
                <td>
                    <div style="display: flex; gap: 5px; justify-content: center;">
                        <button onclick="editInventoryItem('${item.id}')" class="btn-icon" style="color: var(--accent-color);"><i class="fa-solid fa-edit"></i></button>
                        <button onclick="deleteInventoryItem('${item.id}')" class="btn-icon" style="color: var(--danger-color);"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};
