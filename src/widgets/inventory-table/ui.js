/**
 * Widget: InventoryTable (FSD)
 * Renders the inventory list with stock status and actions.
 */

export const renderInventoryTable = (containerId, inventory, offset = 0) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!inventory || inventory.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No items in inventory.</td></tr>';
        return;
    }

    container.innerHTML = inventory.map((item, index) => {
        let statusClass = 'status-ok';
        if (item.quantity === 0) statusClass = 'status-out';
        else if (item.quantity <= (item.lowStockThreshold || 5)) statusClass = 'status-low';

        return `
            <tr data-id="${item.id}">
                <td style="color: var(--text-secondary); font-size: 11px;">${offset + index + 1}</td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.itemType || 'Veg'}</td>
                <td>₹${item.price}</td>
                <td class="${statusClass}">${item.quantity}</td>
                <td>${item.lowStockThreshold || 5}</td>
                <td>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button onclick="editItem('${item.id}')" class="btn-primary" style="padding: 6px 12px; font-size: 14px; background: var(--accent-color); border:none;" title="Edit Item"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
};
