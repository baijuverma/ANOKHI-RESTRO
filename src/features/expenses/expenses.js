
import { formatCurrency, formatDateTime } from '../../shared/utils/index.js';

export const renderExpensesList = (expenses) => {
    const tbody = document.getElementById('expenses-tbody-modular');
    if (!tbody) return;

    tbody.innerHTML = expenses.map(exp => `
        <tr>
            <td>${formatDateTime(exp.date)}</td>
            <td><span class="category-tag">${exp.category}</span></td>
            <td>${exp.description || '-'}</td>
            <td>${exp.payment_mode}</td>
            <td class="amount-cell text-danger">${formatCurrency(exp.amount)}</td>
            <td>
                <button class="btn-icon-small danger" onclick="deleteExpense('${exp.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
};
