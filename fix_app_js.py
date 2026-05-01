
import os

app_js_path = 'app.js'
with open(app_js_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We need to find where calculateTotal starts and where processSale starts,
# and insert the missing pieces in between.

calc_total_start = -1
process_sale_start = -1

for i, line in enumerate(lines):
    if 'window.calculateTotal = function()' in line:
        calc_total_start = i
    if 'window.processSale = function()' in line:
        process_sale_start = i
        break

if calc_total_start != -1 and process_sale_start != -1:
    # Construct the correct middle part
    middle_part = """    try {
        const currentCart = window.cart || [];
        let subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
        
        let discPercentInput = document.getElementById('cart-discount-percent');
        let discFixedInput = document.getElementById('cart-discount-fixed');
        
        let discPercent = discPercentInput ? (parseFloat(discPercentInput.value) || 0) : 0;
        let discFixed = discFixedInput ? (parseFloat(discFixedInput.value) || 0) : 0;
        
        if (discPercent > 100) {
            discPercent = 100;
            if(discPercentInput) discPercentInput.value = 100;
        }

        let discountAmount = (subtotal * (discPercent / 100)) + discFixed;
        if (discountAmount > subtotal) discountAmount = subtotal;
        
        let advancePaid = 0;
        if (window.selectedOrderType === 'DINE_IN' && window.currentSelectedTable) {
            const allTables = window.tables || [];
            const table = allTables.find(t => t.id === window.currentSelectedTable);
            if (table) advancePaid = table.advance || 0;
        }

        let totalBeforeRound = subtotal - discountAmount - advancePaid;
        let finalTotal = Math.max(0, Math.round(totalBeforeRound));
        let roundOffVal = finalTotal - totalBeforeRound;
        let refundAmount = totalBeforeRound < 0 ? Math.abs(Math.round(totalBeforeRound)) : 0;

        const roundOffEl = document.getElementById('cart-roundoff');
        if (roundOffEl && typeof formatCurrency === 'function') {
            const sign = roundOffVal >= 0 ? '+' : '';
            roundOffEl.innerText = sign + formatCurrency(roundOffVal);
        }

        const totalLabel = document.getElementById('cart-total-label');
        if(totalLabel) totalLabel.innerText = (refundAmount > 0) ? 'Payable' : 'Total';

        const totalEl = document.getElementById('cart-total');
        if (totalEl && typeof formatCurrency === 'function') {
            totalEl.innerText = formatCurrency(finalTotal);
        }
        
        if (typeof calculateDues === 'function') calculateDues();
        
        return { subtotal, discount: discountAmount, advance: advancePaid, roundOff: roundOffVal, total: finalTotal };
    } catch (e) {
        console.error("Calculation Error:", e);
        return { subtotal: 0, discount: 0, advance: 0, roundOff: 0, total: 0 };
    }
}

window.clearCart = function() {
    if (typeof window.setCart === 'function') {
        window.setCart([]);
    } else {
        window.cart = [];
    }
    const discPercentIn = document.getElementById('cart-discount-percent');
    const discFixedIn = document.getElementById('cart-discount-fixed');
    if(discPercentIn) discPercentIn.value = '';
    if(discFixedIn) discFixedIn.value = '';
    
    // Reset search
    const searchIn = document.getElementById('pos-search');
    if(searchIn) searchIn.value = '';

    // Reset payment fields
    const cashIn = document.getElementById('pay-cash-amount');
    const upiIn = document.getElementById('pay-upi-amount');
    if(cashIn) cashIn.value = '';
    if(upiIn) upiIn.value = '';

    // Reset editing state
    window.editingSaleId = null;
    window.previousPaidAmount = 0;
    const prevPaidRow = document.getElementById('prev-paid-row');
    if(prevPaidRow) prevPaidRow.style.display = 'none';
    
    if (typeof renderCart === 'function') renderCart();
}

window.calculateDues = function() {
    const totalEl = document.getElementById('cart-total');
    if (!totalEl) return;
    
    const totalStr = totalEl.innerText.replace(/[^0-9.]/g, '');
    const finalTotal = parseFloat(totalStr) || 0;
    
    const cashInput = document.getElementById('pay-cash-amount');
    const upiInput = document.getElementById('pay-upi-amount');
    
    let cashPaid = parseFloat(cashInput.value) || 0;
    let upiPaid = parseFloat(upiInput.value) || 0;
    
    // Total Paid = Previous + Current
    let totalPaid = (typeof previousPaidAmount !== 'undefined' ? previousPaidAmount : 0) + cashPaid + upiPaid;
    
    let dues = Math.max(0, finalTotal - totalPaid);
    
    // Update the UI element and visibility
    const duesEl = document.getElementById('cart-dues');
    const duesRow = document.getElementById('dues-row');
    if (duesEl) duesEl.innerText = formatCurrency(dues);
    
    if (duesRow) {
        if (dues > 0.01) {
            duesRow.style.display = 'flex';
            duesRow.style.color = 'var(--danger-color)';
            // Clear any error states
            cashInput.style.borderColor = '';
            upiInput.style.borderColor = '';
        } else if (totalPaid > finalTotal + 0.01) {
            // OVERPAYMENT CASE: Show warning
            duesRow.style.display = 'flex';
            duesRow.style.color = '#ff4d4d';
            document.getElementById('cart-dues').innerText = 'Limit Exceeded!';
            cashInput.style.borderColor = '#ff4d4d';
            upiInput.style.borderColor = '#ff4d4d';
        } else {
            duesRow.style.display = 'none';
            cashInput.style.borderColor = '';
            upiInput.style.borderColor = '';
        }
    }
}

"""
    new_content = lines[:calc_total_start+1] + [middle_part] + lines[process_sale_start:]
    with open(app_js_path, 'w', encoding='utf-8') as f:
        f.writelines(new_content)
    print("Successfully patched app.js")
else:
    print(f"Could not find start/end points. calc_total_start: {calc_total_start}, process_sale_start: {process_sale_start}")
