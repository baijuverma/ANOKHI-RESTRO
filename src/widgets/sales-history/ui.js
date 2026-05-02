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

    // Filter by dues if applicable
    let activeOrders = orders;
    if (window.showOnlyDues) {
        activeOrders = activeOrders.filter(s => (s.dues || 0) > 0.01);
    }

    // Sort by date (descending)
    let sortedOrders = [...activeOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply limit if provided
    if (limit) {
        sortedOrders = sortedOrders.slice(0, limit);
    }

    const formatCurrency = window.formatCurrency || ((amt) => `₹${Number(amt).toFixed(2)}`);
    const formatDateTime = window.formatDateTime || ((date) => new Date(date).toLocaleString());

    let html = sortedOrders.map((sale, index) => {
        const items = sale.items || [];
        const itemsStr = items.map(i => `${i.name || 'Unknown'} (x${i.cartQty || 0})`).join(', ');
        
        const pMode = sale.paymentMode || 'CASH';
        let pModeBadge = '';
        
        if (sale.status === 'HELD') {
            pModeBadge = '<span class="status-badge" style="background: #334155; color: white; font-weight: 800;">HELD</span>';
        } else if (sale.status === 'ADVANCE') {
            pModeBadge = '<span class="status-badge" style="background: var(--warning-color); color: white; font-weight: 800;">ADVANCE</span>';
        } else if (sale.dues > 0) {
            pModeBadge = '<span class="status-badge" style="background: #ef4444; color: white; font-weight: 800;">CREDIT</span>';
            pModeBadge += `<div style="font-size: 11px; color: #ef4444; margin-top: 4px; font-weight: 700;">Dues: ${formatCurrency(sale.dues)}</div>`;
        } else if (pMode === 'UPI') {
            pModeBadge = '<span class="status-badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">UPI</span>';
        } else if (pMode === 'BOTH') {
            pModeBadge = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">SPLIT</span>';
        } else {
            pModeBadge = '<span class="status-badge status-instock">CASH</span>';
        }

        let trStyle = '';
        if (sale.status === 'HELD' || sale.status === 'ADVANCE') {
            trStyle = 'background: #fef9c3; color: #1e293b; border-left: 4px solid #f59e0b;';
        } else if (sale.dues > 0) {
            trStyle = 'background: rgba(239, 68, 68, 0.05); border-left: 4px solid #ef4444;';
        }

        const typeBadge = `
            <span style="font-size: 11px; display: block; color: ${sale.status ? '#475569' : 'var(--text-secondary)'}; margin-top: 4px;">
                ${sale.orderType === 'DINE_IN' ? 'Dine-In' : sale.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Counter'}
            </span>
        `;

        const displayDate = sale.date || sale.timestamp || new Date();

        return `
        <tr style="${trStyle}">
            <td style="color: var(--text-secondary); font-size: 11px;">${index + 1}</td>
            <td style="color: inherit;">
                <strong>#${sale.id.toString().slice(-6)}</strong>
                ${typeBadge}
                ${sale.customerName ? `<div style="font-size: 11px; color: var(--warning-color); font-weight: 700; margin-top: 4px;"><i class="fa-solid fa-user"></i> ${sale.customerName}</div>` : ''}
            </td>
            <td style="color: inherit;">${formatDateTime(displayDate)}</td>
            <td style="color: inherit;"><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsStr}">${itemsStr}</div></td>
            <td>${pModeBadge}</td>
            <td style="font-weight:bold; color: var(--text-primary);">${formatCurrency(sale.total)}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-primary" style="padding: 6px 16px; font-size:12px; background: var(--accent-color); border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;" onclick="editSale('${sale.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');

    // Add sentinel if limit is null (History Page)
    if (limit === null && orders.length >= 20) {
        html += `
            <tr id="load-more-sentinel">
                <td colspan="7" style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 13px;">
                    <button id="load-more-btn" class="btn-primary" style="background: rgba(255,255,255,0.05); border: 1px solid var(--panel-border); width: 200px;" onclick="window.loadMoreSales()">
                        Scrolling for more...
                    </button>
                </td>
            </tr>
        `;
        setTimeout(() => {
            if (typeof window.setupInfiniteScroll === 'function') {
                window.setupInfiniteScroll('load-more-sentinel', window.loadMoreSales);
            }
        }, 100);
    }

    container.innerHTML = html;
};


