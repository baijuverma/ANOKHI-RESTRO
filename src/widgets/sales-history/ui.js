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

let currentCalendarDate = null;

export const updateCalendarView = () => {
    const m = parseInt(document.getElementById('calendar-month-select').value);
    const y = parseInt(document.getElementById('calendar-year-select').value);
    currentCalendarDate = new Date(y, m, 1);
    if (typeof window.refreshUI === 'function') window.refreshUI();
}
window.updateCalendarView = updateCalendarView;

export const renderCalendarChart = (dailyTotals) => {
    const wrapper = document.getElementById('calendar-wrapper');
    if(!wrapper) return;

    let targetDate = new Date();
    if (currentCalendarDate) {
        targetDate = currentCalendarDate;
    } else {
        currentCalendarDate = targetDate;
    }
    
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); // 0-6 (Sun-Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let monthOptions = monthNames.map((m, idx) => `<option value="${idx}" ${idx === month ? 'selected' : ''}>${m}</option>`).join('');
    
    let currentYearObj = new Date().getFullYear();
    let years = [];
    for(let y = currentYearObj - 5; y <= currentYearObj + 5; y++) {
        years.push(y);
    }
    let yearOptions = years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('');
    
    let html = `
        <div style="text-align: center; margin-bottom: 16px; display: flex; justify-content: center; gap: 10px;">
            <select id="calendar-month-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="updateCalendarView()">
                ${monthOptions}
            </select>
            <select id="calendar-year-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="updateCalendarView()">
                ${yearOptions}
            </select>
        </div>
        <div class="calendar-header">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-chart">
    `;
    
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = String(day).padStart(2, '0') + '/' + String(month + 1).padStart(2, '0') + '/' + year;
        const total = dailyTotals[dStr] ? dailyTotals[dStr].total : 0;
        const orders = dailyTotals[dStr] ? dailyTotals[dStr].orders : 0;
        const cashAmt = dailyTotals[dStr] ? dailyTotals[dStr].cash : 0;
        const upiAmt = dailyTotals[dStr] ? dailyTotals[dStr].upi : 0;
        
        let extraClass = total > 0 ? 'has-sales' : '';
        let displayTotal = total > 0 ? (window.formatCurrency ? window.formatCurrency(total) : '₹' + total) : '-';
        let displayOrders = orders > 0 ? `${orders} order(s)` : '';
        let breakdownHtml = total > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1);">
                <span style="color:var(--success-color);" title="Cash Sale">Cash: ${cashAmt}</span>
                <span style="color:#818cf8;" title="UPI Sale">UPI: ${upiAmt}</span>
            </div>
        ` : '';

        html += `
            <div class="calendar-day ${extraClass}" title="${dStr}">
                <div class="flex-between">
                    <span class="calendar-date-num">${day}</span>
                    <span style="font-size: 11px; color: var(--text-secondary);">${displayOrders}</span>
                </div>
                <div class="calendar-sales-amt">${displayTotal}</div>
                ${breakdownHtml}
            </div>
        `;
    }
    
    html += `</div>`;
    wrapper.innerHTML = html;
};

export const updateCalendarData = (salesHistory) => {
    if(!salesHistory || salesHistory.length === 0) {
        renderCalendarChart({});
        return;
    }
    
    const getDDMMYYYY = window.getDDMMYYYY || function(date) {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return (d < 10 ? '0' : '') + d + '/' + (m < 10 ? '0' : '') + m + '/' + y;
    };

    const calendarTotals = {};
    salesHistory.forEach(sale => {
        const dateStr = getDDMMYYYY(new Date(sale.date));
        if(!calendarTotals[dateStr]) {
            calendarTotals[dateStr] = { orders: 0, total: 0, cash: 0, upi: 0 };
        }
        calendarTotals[dateStr].orders += 1;
        calendarTotals[dateStr].total += sale.total;
        
        const pMode = sale.paymentMode || 'CASH';
        if(pMode === 'UPI') {
            calendarTotals[dateStr].upi += sale.total;
        } else if (pMode === 'BOTH' && sale.splitAmounts) {
            calendarTotals[dateStr].upi += (sale.splitAmounts.upi || 0);
            calendarTotals[dateStr].cash += (sale.splitAmounts.cash || 0);
        } else {
            calendarTotals[dateStr].cash += sale.total;
        }
    });

    renderCalendarChart(calendarTotals);
};
