/**
 * Widget: ExpenseTable (FSD)
 * Renders the expense list with LocalPagination + Infinite Scroll.
 */

const EXPENSE_PAGE_SIZE = 25;
let expensePagination = null;

function buildExpenseRow(exp, index) {
    const legacyAmount = parseFloat(exp.amount || exp.net_amount || exp.total_amount || 0);
    let dCash = parseFloat(exp.cash);
    let dUpi = parseFloat(exp.upi);
    let dUdhar = parseFloat(exp.udhar);
    
    const pMode = (exp.payment_mode || exp.paymentMode || 'CASH').toUpperCase();
    
    // Fallback for older records
    if (isNaN(dCash) && isNaN(dUpi) && isNaN(dUdhar) && legacyAmount > 0) {
        if (pMode === 'UPI') { dUpi = legacyAmount; dCash = 0; dUdhar = 0; }
        else if (pMode === 'UDHAR' || pMode === 'DUES') { dUdhar = legacyAmount; dCash = 0; dUpi = 0; }
        else { dCash = legacyAmount; dUpi = 0; dUdhar = 0; }
    } else {
        // Ensure they are numbers for rendering
        if (isNaN(dCash)) dCash = 0;
        if (isNaN(dUpi)) dUpi = 0;
        if (isNaN(dUdhar)) dUdhar = 0;
    }

    let cleanDesc = exp.description || exp.reason || '';
    if (cleanDesc.startsWith('Qty:')) {
        const parts = cleanDesc.split('|');
        cleanDesc = parts.length > 1 ? parts.slice(1).join('|').trim() : '';
    }

    return `
        <tr data-id="${exp.id}">
            <td><input type="checkbox" class="expense-row-checkbox" data-id="${exp.id}" onclick="window.syncExpenseHeaderCheckbox()"></td>
            <td style="font-size: 11px; color: var(--text-secondary);">${index + 1}</td>
            <td>${new Date(exp.date).toLocaleDateString('en-GB')}</td>
            <td><span class="category-tag">${exp.main_category || exp.category}</span></td>
            <td>${exp.sub_category || exp.subCategory || '-'}</td>
            <td>${exp.qty ? exp.qty + ' ' + (exp.unit || ((exp.main_category || exp.category || '').toLowerCase().includes('kitchen') || (exp.main_category || exp.category || '').toLowerCase().includes('raw') ? 'KG' : 'QTY')) : '-'}</td>
            <td>${exp.selling_price || exp.sell_price ? '₹' + (exp.selling_price || exp.sell_price) : '-'}</td>
            <td style="color: #10b981">${dCash > 0 ? '₹' + dCash : (dCash === 0 ? '₹0' : '-')}</td>
            <td style="color: #3b82f6">${dUpi > 0 ? '₹' + dUpi : (dUpi === 0 ? '₹0' : '-')}</td>
            <td style="color: #f59e0b">${dUdhar > 0 ? '₹' + dUdhar : (dUdhar === 0 ? '₹0' : '-')}</td>
            <td title="${cleanDesc}">${cleanDesc || '-'}</td>
            <td>
                <div class="action-menu-container">
                    <button onclick="window.toggleExpenseActionMenu('${exp.id}', event)" class="btn-edit-modern">
                        <i class="fa-solid fa-pencil"></i> Edit
                    </button>
                    <div id="action-menu-${exp.id}" class="action-dropdown-menu hidden">
                        <button onclick="window.editExpense('${exp.id}')">
                            <i class="fa-solid fa-pen-to-square"></i> Update
                        </button>
                        <button onclick="window.deleteExpense('${exp.id}')" style="color: var(--danger-color);">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

window.changeExpensePage = (page) => {
    if (expensePagination) {
        if (page === undefined) expensePagination.loadMore();
        else expensePagination.goToPage(page);
        window.renderExpenses(); 
    }
};

export const renderExpenseTable = (containerId, expenses) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<tr><td colspan="10" style="text-align:center;">No expenses recorded.</td></tr>';
        return;
    }

    // Sort by date descending
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (typeof window.LocalPagination !== 'undefined') {
        const prevPage = expensePagination ? expensePagination.currentPage : 1;
        expensePagination = new window.LocalPagination(sorted, EXPENSE_PAGE_SIZE);
        if (prevPage > 1 && prevPage <= expensePagination.getTotalPages()) {
            expensePagination.goToPage(prevPage);
        }
        
        const pageItems = expensePagination.getPageItems();
        container.innerHTML = pageItems.map((exp, idx) => buildExpenseRow(exp, idx)).join('');

        // Render Pagination Controls
        if (typeof renderPaginationControls === 'function') {
            renderPaginationControls('expenses-pagination', expensePagination, 'changeExpensePage');
        }
    } else {
        // Fallback
        container.innerHTML = sorted.map((exp, idx) => buildExpenseRow(exp, idx)).join('');
    }
};
