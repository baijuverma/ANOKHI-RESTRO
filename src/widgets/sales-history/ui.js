/**
 * Widget: SalesHistoryTable (FSD)
 * Renders the list of completed sales with proper LocalPagination + Infinite Scroll.
 */

const PAGE_SIZE = 20;
let salesHistoryPagination = null;

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

    const pMode = (sale.payment_mode || sale.paymentMode || 'CASH').toUpperCase();
    let pModeBadge = '';

    if (sale.status === 'HELD') {
        pModeBadge = '<span class="status-badge" style="background: #334155; color: white; font-weight: 800;">HELD</span>';
    } else if (sale.status === 'ADVANCE') {
        pModeBadge = '<span class="status-badge" style="background: var(--warning-color); color: white; font-weight: 800;">ADVANCE</span>';
    } else if (sale.dues > 0.01) {
        pModeBadge = '<span class="status-badge" style="background: #ef4444; color: white; font-weight: 800; border-radius: 20px; padding: 4px 12px; font-size: 11px;">CREDIT</span>';
        pModeBadge += `<div style="font-size: 11px; color: #ef4444; margin-top: 4px; font-weight: 700;">Dues: ${formatCurrency(sale.dues)}</div>`;
    } else if (pMode === 'UPI') {
        pModeBadge = '<span class="status-badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 800;">UPI</span>';
    } else if (pMode === 'BOTH' || pMode === 'SPLIT') {
        pModeBadge = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 800;">SPLIT</span>';
    } else {
        pModeBadge = '<span class="status-badge" style="background: rgba(13, 148, 136, 0.1); color: #0d9488; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 800;">CASH</span>';
    }

    let trStyle = 'border-bottom: 1px solid rgba(255,255,255,0.05);';
    let leftBar = '';
    if (sale.dues > 0.01) {
        trStyle += 'background: rgba(239, 68, 68, 0.03); position: relative;';
        leftBar = '<div style="position: absolute; left: 0; top: 10%; height: 80%; width: 3px; background: #ef4444; border-radius: 0 4px 4px 0;"></div>';
    }

    const orderTypeLabel = sale.orderType === 'DINE_IN' ? 'Dine-In' : sale.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Counter';
    
    const customerInfo = `
        <div style="font-size: 11px; margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="color: rgba(255,255,255,0.5);">${orderTypeLabel}</span>
            ${sale.customerName ? `
                <span style="color: #f59e0b; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-user" style="font-size: 10px;"></i> ${sale.customerName}
                </span>
            ` : ''}
            ${sale.customerMobile ? `
                <span style="color: #f59e0b; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-phone" style="font-size: 10px;"></i> ${sale.customerMobile}
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
        <td style="padding: 20px 16px;">${pModeBadge}</td>
        <td style="padding: 20px 16px; font-weight: 800; color: white; font-size: 15px;">${formatCurrency(sale.total)}</td>
        <td style="padding: 20px 16px;">
            <button class="btn-edit" onclick="editSale('${sale.id}')" style="background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s;">
                <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
        </td>
    </tr>
    `;
}


function appendSentinel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const sentinel = document.createElement('tr');
    sentinel.id = 'history-load-more-sentinel';
    sentinel.innerHTML = `<td colspan="7" style="text-align:center; padding:20px; color:var(--text-secondary); font-size:13px;">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading more...
    </td>`;
    container.appendChild(sentinel);
    setTimeout(() => {
        if (typeof window.setupInfiniteScroll === 'function') {
            window.setupInfiniteScroll('history-load-more-sentinel', window.loadMoreSales);
        }
    }, 100);
}

export const renderSalesHistory = (containerId, orders, limit = null) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No sales records found.</td></tr>';
        return;
    }

    // Filter by dues ONLY on history page (limit === null), NOT on dashboard
    let activeOrders = orders;
    if (window.showOnlyDues && limit === null) {
        activeOrders = activeOrders.filter(s => (s.dues || 0) > 0.01);
    }

    // Sort by date (descending)
    let sortedOrders = [...activeOrders].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (limit !== null) {
        // Dashboard mode: just render top N directly
        container.innerHTML = sortedOrders.slice(0, limit).map((sale, i) => buildSaleRow(sale, i)).join('');
        return;
    }

    // History page: use LocalPagination + infinite scroll
    if (typeof window.LocalPagination !== 'undefined') {
        salesHistoryPagination = new window.LocalPagination(sortedOrders, PAGE_SIZE);
        const visible = salesHistoryPagination.getVisibleItems();
        container.innerHTML = visible.map((sale, i) => buildSaleRow(sale, i)).join('');

        if (salesHistoryPagination.hasMore()) {
            appendSentinel(containerId);
        }

        // Expose loadMore globally
        window.loadMoreSales = () => {
            if (salesHistoryPagination && salesHistoryPagination.loadMore()) {
                const existingSentinel = document.getElementById('history-load-more-sentinel');
                if (existingSentinel) existingSentinel.remove();

                const allVisible = salesHistoryPagination.getVisibleItems();
                const prevCount = (salesHistoryPagination.currentPage - 1) * salesHistoryPagination.pageSize;
                const newRows = allVisible.slice(prevCount);
                
                const rowsHtml = newRows.map((sale, i) => buildSaleRow(sale, prevCount + i)).join('');
                container.insertAdjacentHTML('beforeend', rowsHtml);

                if (salesHistoryPagination.hasMore()) {
                    appendSentinel(containerId);
                }
            }
        };
    } else {
        // Fallback if LocalPagination not loaded
        container.innerHTML = sortedOrders.map((sale, i) => buildSaleRow(sale, i)).join('');
    }
};
