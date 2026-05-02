/**
 * Widget: ExpenseTable (FSD)
 * Renders the expense list with categories and reason.
 */

export const renderExpenseTable = (containerId, expenses, onDelete) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<tr><td colspan="7" style="text-align:center;">No expenses recorded.</td></tr>';
        return;
    }

    container.innerHTML = expenses.map(exp => `
        <tr>
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td><span class="category-tag">${exp.main_category || exp.category}</span></td>
            <td>${exp.sub_category || exp.subCategory || '-'}</td>
            <td>₹${exp.amount}</td>
            <td><span class="status-badge">${exp.payment_mode || exp.paymentMode}</span></td>
            <td title="${exp.description || exp.reason || ''}">${exp.description || exp.reason || '-'}</td>
            <td>
                <button onclick="deleteExpenseItem('${exp.id}')" class="btn-icon" style="color: var(--danger-color);"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};
