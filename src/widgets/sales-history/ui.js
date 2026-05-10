/**
 * Widget: SalesHistoryTable (FSD)
 * Renders the list of completed sales with proper LocalPagination + Infinite Scroll.
 */

const PAGE_SIZE = 20;
let salesHistoryPagination = null;
let dashboardSalesPagination = null;

function buildSaleRow(sale, index) {
    const formatCurrency = window.formatCurrency || ((amt) => `₹${Number(amt).toFixed(2)}`);
    const formatDateTime = window.formatDateTime || ((date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
    });

    const items = sale.items || [];
    const itemsStr = items.map(i => `${i.name || 'Unknown'} (x${i.cartQty || i.qty || 0})`).join(', ');

    let trStyle = 'border-bottom: 1px solid rgba(255,255,255,0.05);';
    let leftBar = '';
    
    // Calculate Cash, UPI, Dues separately
    const totalPaid = parseFloat(sale.total || 0) - parseFloat(sale.dues || 0);
    const split = sale.split_amounts || sale.splitAmounts;
    let sCash = 0, sUpi = 0;

    if (pMode === 'UPI') {
        sUpi = totalPaid;
    } else if ((pMode === 'BOTH' || pMode === 'SPLIT') && split) {
        sCash = parseFloat(split.cash || 0);
        sUpi = parseFloat(split.upi || 0);
    } else {
        sCash = totalPaid;
    }
    const sDues = parseFloat(sale.dues || 0);

    if (sDues > 0.01) {
        trStyle += 'background: rgba(239, 68, 68, 0.03); position: relative;';
        leftBar = '<div style="position: absolute; left: 0; top: 10%; height: 80%; width: 3px; background: #ef4444; border-radius: 0 4px 4px 0;"></div>';
    }

    const orderTypeLabel = sale.orderType === 'DINE_IN' ? 'Dine-In' : sale.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Counter';
    
    const cName = sale.customerName || sale.customer_name;
    const cMobile = sale.customerMobile || sale.customer_mobile;
    
    const customerInfo = `
        <div style="font-size: 11px; margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="color: rgba(255,255,255,0.5);">${orderTypeLabel}</span>
            ${cName ? `
                <span style="color: #f59e0b; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-user" style="font-size: 10px;"></i> ${cName}
                </span>
            ` : ''}
            ${cMobile ? `
                <span style="color: #f59e0b; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-phone" style="font-size: 10px;"></i> ${cMobile}
                </span>
            ` : ''}
        </div>
    `;

    const displayDate = sale.date || sale.timestamp || new Date();

    return `
    <tr style="${trStyle}">
        <td style="padding: 20px 16px; color: var(--text-secondary); font-size: 13px; position: relative;">
            ${leftBar}
            ${index + 1}
        </td>
        <td style="padding: 20px 16px;">
            <strong style="font-size: 15px; color: white; display: block;">#${sale.id.toString().slice(-6)}</strong>
            ${customerInfo}
        </td>
        <td style="padding: 20px 16px; color: rgba(255,255,255,0.8); font-size: 13px;">${formatDateTime(displayDate)}</td>
        <td style="padding: 20px 16px; color: rgba(255,255,255,0.8); font-size: 13px;">
            <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsStr}">
                ${itemsStr}
            </div>
        </td>
        <td style="padding: 20px 16px; color: #10b981; font-weight: 600;">${sCash > 0 ? formatCurrency(sCash) : '-'}</td>
        <td style="padding: 20px 16px; color: #818cf8; font-weight: 600;">${sUpi > 0 ? formatCurrency(sUpi) : '-'}</td>
        <td style="padding: 20px 16px; color: #ef4444; font-weight: 600;">${sDues > 0 ? formatCurrency(sDues) : '-'}</td>
        <td style="padding: 20px 16px; font-weight: 800; color: white; font-size: 15px;">${formatCurrency(sale.total)}</td>
        <td style="padding: 20px 16px;">
            <button class="btn-edit" onclick="editSale('${sale.id}')" style="background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s;">
                <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
        </td>
    </tr>
    `;
}




window.changeDashboardSalesPage = (page) => {
    if (dashboardSalesPagination) {
        if (page === undefined) dashboardSalesPagination.loadMore();
        else dashboardSalesPagination.goToPage(page);
        renderSalesHistory('sales-tbody', dashboardSalesPagination.fullArray, 'dashboard');
    }
};

window.changeSalesPage = (page) => {
    if (salesHistoryPagination) {
        if (page === undefined) salesHistoryPagination.loadMore();
        else salesHistoryPagination.goToPage(page);
        renderSalesHistory('history-tbody', salesHistoryPagination.fullArray, null);
    }
};

export const renderSalesHistory = (containerId, orders, mode = null) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<tr><td colspan="9" style="text-align:center;">No sales records found.</td></tr>';
        return;
    }

    // Filter by dues ONLY on history page (mode === null)
    let activeOrders = orders;
    if (window.showOnlyDues && mode === null) {
        activeOrders = activeOrders.filter(s => (s.dues || 0) > 0.01);
    }

    // Sort by date (descending)
    let sortedOrders = [...activeOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Support for pagination in both dashboard and history
    if (typeof window.LocalPagination !== 'undefined') {
        let paginator;
        let paginatorId;
        let changeFnName;

        if (mode === 'dashboard') {
            if (!dashboardSalesPagination || dashboardSalesPagination.fullArray.length !== sortedOrders.length) {
                dashboardSalesPagination = new window.LocalPagination(sortedOrders, PAGE_SIZE);
            }
            paginator = dashboardSalesPagination;
            paginatorId = 'dashboard-sales-pagination';
            changeFnName = 'changeDashboardSalesPage';
        } else {
            if (!salesHistoryPagination || salesHistoryPagination.fullArray.length !== sortedOrders.length) {
                salesHistoryPagination = new window.LocalPagination(sortedOrders, PAGE_SIZE);
            }
            paginator = salesHistoryPagination;
            paginatorId = 'history-pagination';
            changeFnName = 'changeSalesPage';
        }
        
        const pageItems = paginator.getPageItems();
        const offset = 0;
        container.innerHTML = pageItems.map((sale, i) => buildSaleRow(sale, offset + i)).join('');

        // Render Pagination Controls
        if (typeof renderPaginationControls === 'function') {
            renderPaginationControls(paginatorId, paginator, changeFnName);
        }
    } else {
        // Fallback if LocalPagination not loaded
        container.innerHTML = sortedOrders.map((sale, i) => buildSaleRow(sale, i)).join('');
    }
};
