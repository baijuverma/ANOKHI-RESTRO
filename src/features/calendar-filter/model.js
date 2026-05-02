let currentCalendarDate = null;

export const getCurrentCalendarDate = () => {
    return currentCalendarDate;
};

export const setCurrentCalendarDate = (date) => {
    currentCalendarDate = date;
};

export const updateCalendarView = () => {
    const mSelect = document.getElementById('calendar-month-select');
    const ySelect = document.getElementById('calendar-year-select');
    if (!mSelect || !ySelect) return;
    
    const m = parseInt(mSelect.value);
    const y = parseInt(ySelect.value);
    currentCalendarDate = new Date(y, m, 1);
    window.currentCalendarDate = currentCalendarDate; // Expose to legacy modules
    if (typeof window.refreshUI === 'function') window.refreshUI();
};

export const filterCalendarData = (salesHistory) => {
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

    return calendarTotals;
};
