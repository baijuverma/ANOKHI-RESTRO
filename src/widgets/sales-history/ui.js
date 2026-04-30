/**
 * Widget: SalesHistoryTable (FSD)
 * Renders the list of completed sales and orders.
 */

export const renderSalesHistory = (containerId, orders, onViewBill, onDelete) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No sales records found.</td></tr>';
        return;
    }

    // Sort by date (descending)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedOrders.map(order => `
        <tr>
            <td>${new Date(order.date).toLocaleString()}</td>
            <td>${order.id}</td>
            <td>${order.tableId || (order.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Counter')}</td>
            <td>₹${order.total}</td>
            <td><span class="badge ${order.status === 'PAID' ? 'success' : 'warning'}">${order.status || 'PAID'}</span></td>
            <td>${order.paymentMethod || 'Cash'}</td>
            <td>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button onclick="viewOrderDetails('${order.id}')" title="View Details" style="color: var(--accent-color);"><i class="fa-solid fa-eye"></i></button>
                    <button onclick="printOrderBill('${order.id}')" title="Print Bill" style="color: var(--secondary-color);"><i class="fa-solid fa-print"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
};
