/**
 * Widget: ExpenseTable (FSD)
 * Renders the expense list with LocalPagination + Infinite Scroll.
 */

const EXPENSE_PAGE_SIZE = 25;
let expensePagination = null;

function buildExpenseRow(exp, index) {
    const isCash = (exp.payment_mode || exp.paymentMode) === 'Cash';
    const isUPI = (exp.payment_mode || exp.paymentMode) === 'UPI';
    const isUdhar = (exp.payment_mode || exp.paymentMode) === 'Udhar';

    return `
        <tr data-id="${exp.id}">
            <td><input type="checkbox" class="expense-row-checkbox" data-id="${exp.id}" onclick="window.syncExpenseHeaderCheckbox()"></td>
            <td style="font-size: 11px; color: var(--text-secondary);">${index + 1}</td>
            <td>${new Date(exp.date).toLocaleDateString('en-GB')}</td>
            <td><span class="category-tag">${exp.main_category || exp.category}</span></td>
            <td>${exp.sub_category || exp.subCategory || '-'}</td>
            <td>${exp.qty || '-'}</td>
            <td>${exp.selling_price || exp.sell_price ? '₹' + (exp.selling_price || exp.sell_price) : '-'}</td>
            <td style="color: ${isCash ? '#10b981' : 'inherit'}">${isCash || exp.cash > 0 ? '₹' + (exp.cash || exp.amount) : '-'}</td>
            <td style="color: ${isUPI ? '#3b82f6' : 'inherit'}">${isUPI || exp.upi > 0 ? '₹' + (exp.upi || exp.amount) : '-'}</td>
            <td style="color: ${isUdhar ? '#f59e0b' : 'inherit'}">${isUdhar || exp.udhar > 0 ? '₹' + (exp.udhar || exp.amount) : '-'}</td>
            <td title="${exp.description || exp.reason || ''}">${exp.description || exp.reason || '-'}</td>
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
        if (!expensePagination || expensePagination.fullArray.length !== sorted.length) {
            expensePagination = new window.LocalPagination(sorted, EXPENSE_PAGE_SIZE);
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
