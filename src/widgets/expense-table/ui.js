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

function appendExpenseSentinel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const sentinel = document.createElement('tr');
    sentinel.id = 'expense-load-more-sentinel';
    sentinel.innerHTML = `<td colspan="7" style="text-align:center; padding:16px; color:var(--text-secondary); font-size:13px;">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading more...
    </td>`;
    container.appendChild(sentinel);
    setTimeout(() => {
        if (typeof window.setupInfiniteScroll === 'function') {
            window.setupInfiniteScroll('expense-load-more-sentinel', window.loadMoreExpenses);
        }
    }, 100);
}

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
        expensePagination = new window.LocalPagination(sorted, EXPENSE_PAGE_SIZE);
        const visible = expensePagination.getVisibleItems();
        container.innerHTML = visible.map(exp => buildExpenseRow(exp)).join('');

        if (expensePagination.hasMore()) {
            appendExpenseSentinel(containerId);
        }

        window.loadMoreExpenses = () => {
            if (expensePagination && expensePagination.loadMore()) {
                const existingSentinel = document.getElementById('expense-load-more-sentinel');
                if (existingSentinel) existingSentinel.remove();

                const allVisible = expensePagination.getVisibleItems();
                const prevCount = (expensePagination.currentPage - 1) * expensePagination.pageSize;
                const newRows = allVisible.slice(prevCount);
                
                const rowsHtml = newRows.map(exp => buildExpenseRow(exp)).join('');
                container.insertAdjacentHTML('beforeend', rowsHtml);

                if (expensePagination.hasMore()) {
                    appendExpenseSentinel(containerId);
                }
            }
        };
    } else {
        // Fallback
        container.innerHTML = sorted.map(exp => buildExpenseRow(exp)).join('');
    }
};
