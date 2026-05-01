
import { formatCurrency, formatDateTime } from '../../shared/utils/index.js';

export const renderSalesList = (sales) => {
    const tbody = document.getElementById('sales-history-tbody-modular');
    if (!tbody) return;

    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td>#${sale.id}</td>
            <td>${formatDateTime(sale.date)}</td>
            <td>${sale.orderType}</td>
            <td>${sale.customer_name || 'Guest'}</td>
            <td><strong>${formatCurrency(sale.total)}</strong></td>
            <td><span class="status-badge ${sale.dues > 0 ? 'pending' : 'paid'}">${sale.dues > 0 ? 'Dues' : 'Paid'}</span></td>
            <td>
                <button class="btn-icon-small" onclick="viewReceipt('${sale.id}')"><i class="fa-solid fa-eye"></i></button>
                <button class="btn-icon-small" onclick="editSale('${sale.id}')"><i class="fa-solid fa-edit"></i></button>
            </td>
        </tr>
    `).join('');
};
