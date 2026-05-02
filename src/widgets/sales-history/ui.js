/**
 * Widget: SalesHistoryTable (FSD)
 * Renders the list of completed sales and orders.
 */

export const renderSalesHistory = (containerId, orders, limit = null) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No sales records found.</td></tr>';
        return;
    }

    // Sort by date (descending)
    let sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply limit if provided
    if (limit) {
        sortedOrders = sortedOrders.slice(0, limit);
    }

    container.innerHTML = sortedOrders.map((order, index) => `
        <tr>
            <td style="color: var(--text-secondary); font-size: 11px;">${index + 1}</td>
            <td>${new Date(order.date).toLocaleString()}</td>
            <td>${order.id}</td>
            <td>${order.tableId || (order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Counter')}</td>
            <td>₹${order.total}</td>
            <td><span class="badge ${order.status === 'PAID' ? 'success' : 'warning'}">${order.status || 'PAID'}</span></td>
            <td>${order.paymentMethod || 'Cash'}</td>
            <td>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-edit-small" onclick="editSale('${order.id}')" title="Edit Sale">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
};


