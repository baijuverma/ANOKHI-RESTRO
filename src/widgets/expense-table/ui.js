/**
 * Widget: ExpenseTable (FSD)
 * Renders the expense list with LocalPagination + Infinite Scroll.
 */

const EXPENSE_PAGE_SIZE = 25;
let expensePagination = null;

function buildExpenseRow(exp) {
    return `
        <tr>
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td><span class="category-tag">${exp.main_category || exp.category}</span></td>
            <td>${exp.sub_category || exp.subCategory || '-'}</td>
            <td>₹${exp.amount}</td>
            <td><span class="status-badge">${exp.payment_mode || exp.paymentMode}</span></td>
            <td title="${exp.description || exp.reason || ''}">${exp.description || exp.reason || '-'}</td>
            <td>
                <button onclick="deleteExpenseItem('${exp.id}')" class="btn-icon" style="color: var(--danger-color);">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `;
}

window.changeExpensePage = (page) => {
    if (expensePagination) {
        if (page === undefined) expensePagination.loadMore();
        else expensePagination.goToPage(page);
        renderExpenseTable('expenses-tbody', expensePagination.fullArray);
    }
};

export const renderExpenseTable = (containerId, expenses) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No expenses recorded.</td></tr>';
        return;
    }

    // Sort by date descending
    const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (typeof window.LocalPagination !== 'undefined') {
        if (!expensePagination || expensePagination.fullArray.length !== sorted.length) {
            expensePagination = new window.LocalPagination(sorted, EXPENSE_PAGE_SIZE);
        }
        
        const pageItems = expensePagination.getPageItems();
        container.innerHTML = pageItems.map(exp => buildExpenseRow(exp)).join('');

        // Render Pagination Controls
        if (typeof renderPaginationControls === 'function') {
            renderPaginationControls('expenses-pagination', expensePagination, 'changeExpensePage');
        }
    } else {
        // Fallback
        container.innerHTML = sorted.map(exp => buildExpenseRow(exp)).join('');
    }
};
