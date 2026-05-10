import { filterCalendarData, getCurrentCalendarDate, setCurrentCalendarDate } from '../../features/calendar-filter/model.js';

export const renderCalendarChart = (dailyTotals) => {
    const wrapper = document.getElementById('calendar-wrapper');
    if(!wrapper) return;

    let targetDate = getCurrentCalendarDate() || new Date();
    
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
            <select id="calendar-month-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="window.updateCalendarView()">
                ${monthOptions}
            </select>
            <select id="calendar-year-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="window.updateCalendarView()">
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
    
    let maxTotal = 0;
    let minTotal = Infinity;
    
    // Pre-calculate max and min for the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = String(day).padStart(2, '0') + '/' + String(month + 1).padStart(2, '0') + '/' + year;
        const total = dailyTotals[dStr] ? dailyTotals[dStr].total : 0;
        if (total > maxTotal) maxTotal = total;
        if (total > 0 && total < minTotal) minTotal = total;
    }
    if (minTotal === Infinity) minTotal = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = String(day).padStart(2, '0') + '/' + String(month + 1).padStart(2, '0') + '/' + year;
        const total = dailyTotals[dStr] ? dailyTotals[dStr].total : 0;
        const orders = dailyTotals[dStr] ? dailyTotals[dStr].orders : 0;
        const cashAmt = dailyTotals[dStr] ? dailyTotals[dStr].cash : 0;
        const upiAmt = dailyTotals[dStr] ? dailyTotals[dStr].upi : 0;
        
        let isMax = total > 0 && total === maxTotal;
        let isMin = total > 0 && total === minTotal && total !== maxTotal;

        let extraClass = total > 0 ? 'has-sales' : '';
        let displayTotal = total > 0 ? (window.formatCurrency ? window.formatCurrency(total) : '₹' + total) : '-';
        let displayOrders = orders > 0 ? `${orders} order(s)` : '';
        let breakdownHtml = total > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1);">
                <span style="color:var(--success-color);" title="Cash Sale">Cash: ${cashAmt}</span>
                <span style="color:#818cf8;" title="UPI Sale">UPI: ${upiAmt}</span>
            </div>
        ` : '';

        let styleHtml = '';
        let amtStyle = '';
        let dateNumStyle = '';
        if (isMax) {
            styleHtml = 'background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4);';
            amtStyle = 'color: #10b981; font-weight: 800; font-size: 15px;';
            dateNumStyle = 'color: #10b981; font-weight: 700;';
        } else if (isMin) {
            styleHtml = 'background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4);';
            amtStyle = 'color: #ef4444; font-weight: 800; font-size: 15px;';
            dateNumStyle = 'color: #ef4444; font-weight: 700;';
        }

        html += `
            <div class="calendar-day ${extraClass}" title="${dStr}" style="${styleHtml}">
                <div class="flex-between">
                    <span class="calendar-date-num" style="${dateNumStyle}">${day}</span>
                    <span style="font-size: 11px; color: var(--text-secondary);">${displayOrders}</span>
                </div>
                <div class="calendar-sales-amt" style="${amtStyle}">${displayTotal}</div>
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
    
    const calendarTotals = filterCalendarData(salesHistory);
    renderCalendarChart(calendarTotals);
};
