
import { formatCurrency, truncateName } from '../../shared/utils/index.js';

export const renderInventoryList = (items) => {
    const tbody = document.getElementById('inventory-tbody-modular');
    if (!tbody) return;

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>#${item.id}</td>
            <td><strong>${truncateName(item.name)}</strong></td>
            <td><span class="badge ${item.itemType}">${item.itemType}</span></td>
            <td>${formatCurrency(item.price)}</td>
            <td class="${item.quantity < 10 ? 'low-stock' : ''}">${item.quantity}</td>
            <td>
                <button class="btn-icon-small" onclick="editItem('${item.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-icon-small danger" onclick="deleteItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};
