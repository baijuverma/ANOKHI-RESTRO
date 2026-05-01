export function initReceiptLogic() {
function showReceipt(sale) {
    const details = document.getElementById('receipt-details');
    let itemsHtml = sale.items.map(i => `
        <div class="receipt-item">
            <span>${truncateName(i.name)} (x${i.cartQty})</span>
            <span>${formatCurrency(i.price * i.cartQty)}</span>
        </div>
    `).join('');

    const totalPaid = (sale.splitAmounts?.cash || 0) + (sale.splitAmounts?.upi || 0);

    details.innerHTML = `
        <p style="text-align:center; color:var(--text-secondary); margin-bottom: 4px;">Order #${sale.id}</p>
        <p style="text-align:center; color:var(--text-secondary); font-size: 11px; margin-bottom: 8px;">${formatDateTime(sale.date)}</p>
        
        <div style="text-align:center; margin-bottom: 16px;">
            <span class="status-badge" style="background: rgba(255,255,255,0.1); color: var(--text-primary); font-size: 14px; padding: 4px 16px;">
                ${sale.orderType === 'DINE_IN' ? '<i class="fa-solid fa-utensils"></i> DINE-IN' : 
                  sale.orderType === 'TAKEAWAY' ? '<i class="fa-solid fa-bag-shopping"></i> TAKEAWAY' : 
                  '<i class="fa-solid fa-bolt"></i> COUNTER QUICK'}
            </span>
            ${sale.tableName ? `<div style="margin-top: 5px; font-weight: 700; color: var(--accent-color);">${sale.tableName}</div>` : ''}
        </div>

        ${sale.customerName ? `
        <div style="background: rgba(245, 158, 11, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px dashed var(--warning-color);">
            <div style="font-size: 12px; color: var(--text-secondary);">Customer Details (Credit Sale)</div>
            <div style="font-weight: 700; color: var(--warning-color);">${sale.customerName}</div>
            <div style="font-size: 13px; color: var(--text-primary);">${sale.customerMobile}</div>
        </div>
        ` : ''}

        <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px;">
            ${itemsHtml}
            
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px; padding-top: 12px;">
                ${sale.discount > 0 ? `<div style="display:flex; justify-content:space-between; font-size: 14px; color: var(--warning-color);">
                    <span>Discount</span>
                    <span>-${formatCurrency(sale.discount)}</span>
                </div>` : ''}
                ${sale.advancePaid > 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 14px; color: var(--warning-color);">
                    <span>Advance Already Paid</span>
                    <span>-${formatCurrency(sale.advancePaid)}</span>
                </div>` : ''}
                ${sale.roundOff && sale.roundOff !== 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 14px; color: var(--text-secondary);">
                    <span>Round Off</span>
                    <span>${(sale.roundOff >= 0 ? '+' : '') + formatCurrency(sale.roundOff).replace('Î“Ã©â•£-', '-Î“Ã©â•£')}</span>
                </div>` : ''}
                
                <div style="display:flex; justify-content:space-between; margin-top: 10px; font-weight:bold; font-size: 18px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                    <span>Grand Total</span>
                    <span style="color:var(--success-color);">${formatCurrency(sale.total)}</span>
                </div>

                ${sale.dues > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--text-primary); font-weight: 600;">
                    <span>Paid Amount</span>
                    <span>${formatCurrency(totalPaid)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 16px; color: #f87171; font-weight: 800; background: rgba(248, 113, 113, 0.1); padding: 5px; border-radius: 4px;">
                    <span>Dues / Baki</span>
                    <span>${formatCurrency(sale.dues)}</span>
                </div>
                ` : `
                <div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--success-color); font-weight: 700; text-align: center; display: block;">
                    <i class="fa-solid fa-circle-check"></i> FULLY PAID (${sale.paymentMode})
                </div>
                `}
            </div>
        </div>
    `;

    openModal('receiptModal');
}

let currentCalendarDate = null;
let showOnlyDues = false; // New global flag for filtering


window.viewReceipt = function(id) {
    const sale = salesHistory.find(s => s.id === id);
    if(sale) showReceipt(sale);
}



}
