export function initPosLogic() {
// renderCart (Now handled by widgets/cart in main.js)

window.newBill = function() {
    // If cart has items, ask for confirmation
    if (cart.length > 0) {
        if (!confirm('Are you sure you want to cancel this order? All unsaved changes will be lost.')) {
            return;
        }
    }

    // If a table is selected, clear its saved cart and advance as well (Full Cancel)
    if (currentSelectedTable) {
        const tableIndex = tables.findIndex(t => t.id === currentSelectedTable);
        if (tableIndex > -1) {
            tables[tableIndex].cart = [];
            tables[tableIndex].advance = 0;
            saveData();
        }
    }
    
    // Reset POS State
    currentSelectedTable = null;
    cart = [];
    document.getElementById('current-table-name').innerText = 'No Table Selected';
    document.getElementById('advance-paid-info').style.display = 'none';
    
    // Reset to default Order Type UI (Dine-In)
    const dineInBtn = document.querySelector('.order-type-btn[onclick*="DINE_IN"]');
    if (dineInBtn) setOrderType('DINE_IN', dineInBtn);
    
    window.renderCart();
    renderTableGrid(); // Update the grid so table turns from RED to GLASS/GREEN
    if(typeof renderPOSItems === 'function') renderPOSItems(); 
}

window.calculateTotal = function() {
    try {
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
        
        // Update table indicator in total row
        const tableIndicator = document.getElementById('total-table-indicator');
        if (tableIndicator) {
            if (window.selectedOrderType === 'DINE_IN' && window.currentSelectedTable) {
                const tbl = (window.tables || []).find(t => t.id === window.currentSelectedTable);
                const tblName = tbl ? tbl.name : window.currentSelectedTable;
                tableIndicator.textContent = `(${tblName})`;
            } else {
                tableIndicator.textContent = '';
            }
        }

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

    // Reset Hold Button Text
    const holdBtn = document.getElementById('btn-hold-order');
    if (holdBtn) holdBtn.innerHTML = '<i class="fa-solid fa-clock"></i> Hold [F8]';

    // Refresh the Cart Widget
    window.renderCart();

    // Refresh Active Takeaway Orders List
    if (typeof window.renderActiveOrders === 'function') window.renderActiveOrders();

    // Reset editing state
    window.editingSaleId = null;
    window.previousPaidAmount = 0;
    const prevPaidRow = document.getElementById('prev-paid-row');
    if(prevPaidRow) prevPaidRow.style.display = 'none';
    
    if (typeof renderCart === 'function') window.renderCart();
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
    let totalPaid = previousPaidAmount + cashPaid + upiPaid;
    
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

window.toggleSplitPayment = function() {
    // Redundant now as both fields are always visible
    calculateDues();
}

window.processSale = function() {
    if(cart.length === 0) return alert('Cart is empty!');

    if (selectedOrderType === 'DINE_IN' && !currentSelectedTable) {
        return alert('Validation Error: Please select a table before completing a Dine-In sale.');
    }

    const totals = calculateTotal();
    const total = totals.total;
    const payCash = parseFloat(document.getElementById('pay-cash-amount').value) || 0;
    const payUpi = parseFloat(document.getElementById('pay-upi-amount').value) || 0;
    
    let currentPaid = payCash + payUpi;
    let totalPaidCombined = (typeof previousPaidAmount !== 'undefined' ? previousPaidAmount : 0) + currentPaid;

    // VALIDATION: Prevent overpayment
    if (totalPaidCombined > total + 0.01) {
        alert('Invalid Payment! Total paid amount (₹' + totalPaidCombined.toFixed(2) + ') cannot exceed the Bill Total (₹' + total.toFixed(2) + '). Please correct the amount.');
        return;
    }

    const dues = total - totalPaidCombined;

    if (dues > 0.01) {
        // CREDIT SALE: Require customer details
        document.getElementById('modal-dues-amount').innerText = formatCurrency(dues);
        document.getElementById('cust-name').value = '';
        document.getElementById('cust-mobile').value = '';
        window.openModal('customerModal');
    } else {
        // NORMAL SALE: Just confirm
        if (!confirm('Are you sure you want to complete this sale?')) {
            return;
        }
        finalizeSaleRecord();
    }
}

window.completeCreditSale = function() {
    const name = document.getElementById('cust-name').value.trim();
    const mobile = document.getElementById('cust-mobile').value.trim();
    
    if (!name || !mobile) {
        return alert('Please enter both Customer Name and Mobile Number.');
    }
    if (mobile.length !== 10) {
        return alert('Please enter a valid 10-digit mobile number.');
    }
    
    finalizeSaleRecord(name, mobile);
    window.closeModal('customerModal');
}

// Active Orders (Hold/Takeaway) Logic
window.holdOrder = async function() {
    try {
        const currentCart = window.cart || [];
        if (currentCart.length === 0) return alert('Cart is empty!');
        
        if (window.selectedOrderType === 'DINE_IN' && !window.currentSelectedTable) {
            return alert('Please select a Table first.');
        }

        const totals = window.calculateTotal();
        // Get table name if DINE_IN
        let tableName = null;
        if (window.selectedOrderType === 'DINE_IN' && window.currentSelectedTable) {
            const tbl = (window.tables || []).find(t => t.id === window.currentSelectedTable);
            tableName = tbl ? tbl.name : window.currentSelectedTable;
        }

        const newActiveOrder = {
            id: `ACT-${Date.now()}`,
            orderType: window.selectedOrderType,
            items: JSON.parse(JSON.stringify(currentCart)),
            total: totals.total || 0,
            discount: totals.discount || 0,
            roundOff: totals.roundOff || 0,
            customerName: document.getElementById('cust-name')?.value || null,
            customerMobile: document.getElementById('cust-mobile')?.value || null,
            tableName: tableName,
            tableId: window.currentSelectedTable || null,
            createdAt: new Date().toISOString()
        };

        if (!window.activeOrders) window.activeOrders = [];
        window.activeOrders.unshift(newActiveOrder);
        
        if (window.selectedOrderType === 'DINE_IN' && window.currentSelectedTable) {
            const allTables = window.tables || [];
            const tIdx = allTables.findIndex(t => t.id === window.currentSelectedTable);
            if (tIdx > -1) {
                allTables[tIdx].cart = [];
                allTables[tIdx].advance = 0;
            }
        }

        localStorage.setItem('anokhi_active_orders', JSON.stringify(window.activeOrders));
        localStorage.setItem('anokhi_tables', JSON.stringify(window.tables));
        
        // Non-blocking sync
        saveData().catch(e => console.warn("Sync failed:", e));

        window.clearCart();
        window.currentSelectedTable = null;
        const tableNameEl = document.getElementById('current-table-name');
        if (tableNameEl) tableNameEl.innerText = 'No Table Selected';
        
        if (typeof renderActiveOrders === 'function') renderActiveOrders();
        if (typeof renderTableGrid === 'function') renderTableGrid();
        
        showToast('Order Success: Order is now on Hold.', 'success');
    } catch (error) {
        console.error("Hold Order Error:", error);
        showToast('Internal Error. Please try again.', 'error');
    }
};

window.loadActiveOrder = async function(id) {
    const orders = window.activeOrders || [];
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (window.cart && window.cart.length > 0) {
        if (!confirm('Cart has items. Replace with this active order?')) return;
    }

    const newCart = JSON.parse(JSON.stringify(order.items));
    if (typeof window.setCart === 'function') {
        window.setCart(newCart);
    } else {
        window.cart = newCart;
    }
    window.selectedOrderType = order.orderType;
    
    // Restore Table Selection if applicable
    if (order.tableId) {
        window.currentSelectedTable = order.tableId;
        localStorage.setItem('anokhi_selected_table', order.tableId);
        
        // Update table's own cart so it doesn't stay empty
        const allTables = window.tables || [];
        const tIdx = allTables.findIndex(t => t.id === order.tableId);
        if (tIdx > -1) {
            allTables[tIdx].cart = JSON.parse(JSON.stringify(newCart));
            localStorage.setItem('anokhi_tables', JSON.stringify(allTables));
        }
    } else {
        window.currentSelectedTable = null;
        localStorage.removeItem('anokhi_selected_table');
    }
    
    // Update UI for order type
    const btnClass = order.orderType === 'DINE_IN' ? 'DINE_IN' : (order.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'QUICK');
    const targetBtn = document.querySelector(`.order-type-btn[onclick*="${btnClass}"]`);
    if (targetBtn && typeof setOrderType === 'function') setOrderType(order.orderType, targetBtn);

    // Change Hold button to Update
    const holdBtn = document.getElementById('btn-hold-order');
    if (holdBtn) holdBtn.innerHTML = '<i class="fa-solid fa-clock"></i> Update [F8]';

    // Remove from active orders
    window.activeOrders = orders.filter(o => o.id !== id);
    localStorage.setItem('anokhi_active_orders', JSON.stringify(window.activeOrders));
    
    saveData().catch(e => console.warn("Sync failed after load:", e));
    
    // Explicitly delete from Supabase to ensure clean removal
    if (db) await db.from('active_orders').delete().eq('id', id);

    if (typeof window.refreshUI === 'function') {
        window.refreshUI();
    } else {
        if (typeof renderCart === 'function') window.renderCart();
        if (typeof renderActiveOrders === 'function') renderActiveOrders();
    }
    
    if (typeof window.calculateTotal === 'function') window.calculateTotal();
    console.log('Order loaded from Hold.');
};

window.deleteActiveOrder = async function(id) {
    if (!confirm('Are you sure you want to delete this pending order?')) return;
    
    window.activeOrders = (window.activeOrders || []).filter(o => o.id !== id);
    localStorage.setItem('anokhi_active_orders', JSON.stringify(window.activeOrders));
    
    saveData().catch(e => console.warn("Sync failed after delete:", e));
    if (db) await db.from('active_orders').delete().eq('id', id);
    
    if (typeof renderActiveOrders === 'function') renderActiveOrders();
};

window.renderActiveOrders = function() {
    const container = document.getElementById('active-orders-list');
    if (!container) return;
    container.innerHTML = '';

    const orders = window.activeOrders || [];

    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:12px;">No pending takeaway orders.</div>';
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'active-order-card glass-panel';
        card.style.cssText = 'margin-bottom:10px; padding:12px; border-left:3px solid var(--accent-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer;';
        card.onclick = () => window.loadActiveOrder(order.id);
        
        const timeStr = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const typeIcon = order.orderType === 'TAKEAWAY' ? 'fa-bag-shopping' : 'fa-bolt';
        
        card.innerHTML = `
            <div style="flex:1;">
                <div style="font-weight:700; font-size:13px; display:flex; align-items:center; gap:5px;">
                    <i class="fa-solid ${typeIcon}" style="color:var(--accent-color);"></i>
                    <span>${order.orderType}</span>
                    <span style="font-size:10px; color:var(--text-secondary); font-weight:400;">(${timeStr})</span>
                </div>
                <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">
                    ${order.items.length} items • <strong>${formatCurrency(order.total)}</strong>
                    ${order.tableName ? `<span style="margin-left:8px; color:var(--accent-color); font-weight:700;">[${order.tableName}]</span>` : ''}
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="action-btn" style="color:var(--danger-color); font-size:12px;" onclick="event.stopPropagation(); window.deleteActiveOrder('${order.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
};

function finalizeSaleRecord(custName = null, custMobile = null) {
    const totals = calculateTotal();
    const total = totals.total;
    const discount = totals.discount;
    const roundOff = totals.roundOff;
    // Get current payment values
    const payCash = parseFloat(document.getElementById('pay-cash-amount').value) || 0;
    const payUpi = parseFloat(document.getElementById('pay-upi-amount').value) || 0;

    // Merge payments if editing
    let finalCash = payCash;
    let finalUpi = payUpi;
    let finalSaleId = Math.floor(100000 + Math.random() * 900000).toString();
    let finalCustName = custName;
    let finalCustMobile = custMobile;

    if (editingSaleId) {
        const oldSale = salesHistory.find(s => s.id == editingSaleId);
        if (oldSale) {
            finalSaleId = oldSale.id;
            finalCash += (oldSale.splitAmounts?.cash || 0);
            finalUpi += (oldSale.splitAmounts?.upi || 0);
            if (!finalCustName) finalCustName = oldSale.customerName;
            if (!finalCustMobile) finalCustMobile = oldSale.customerMobile;
            
            // Remove old record
            salesHistory = salesHistory.filter(s => s.id != editingSaleId);
        }
    }

    const finalSplitAmounts = { cash: finalCash, upi: finalUpi };

    // Deduct Inventory
    cart.forEach(cartItem => {
        const invItem = inventory.find(i => i.id === cartItem.id);
        if(invItem) {
            invItem.quantity -= cartItem.cartQty;
        }
    });

    // Record Sale
    const sale = {
        id: finalSaleId,
        date: new Date().toISOString(),
        items: [...cart],
        total: total,
        discount: discount,
        roundOff: roundOff,
        paymentMode: (finalCash > 0 && finalUpi > 0) ? 'BOTH' : (finalUpi > 0 ? 'UPI' : 'CASH'),
        splitAmounts: finalSplitAmounts,
        orderType: selectedOrderType,
        tableName: selectedOrderType === 'DINE_IN' && currentSelectedTable ? tables.find(t => t.id === currentSelectedTable).name : null,
        advancePaid: totals.advance,
        customerName: finalCustName,
        customerMobile: finalCustMobile,
        dues: Math.max(0, total - (finalCash + finalUpi))
    };
    
    // Clear held table if applicable
    if (selectedOrderType === 'DINE_IN' && currentSelectedTable) {
        const tableIndex = tables.findIndex(t => t.id === currentSelectedTable);
        if (tableIndex > -1) {
            tables[tableIndex].cart = [];
            tables[tableIndex].advance = 0;
        }
    }

    salesHistory.unshift(sale);
    saveData();

    // Reset editing state
    editingSaleId = null;
    previousPaidAmount = 0;
    const prevPaidRow = document.getElementById('prev-paid-row');
    if(prevPaidRow) prevPaidRow.style.display = 'none';

    // Show Receipt Modal
    showReceipt(sale);

    // Reset UI
    currentSelectedTable = null;
    document.getElementById('current-table-name').innerText = 'No Table Selected';
    document.getElementById('advance-paid-info').style.display = 'none';
    clearCart();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderPOSItems === 'function') renderPOSItems();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderTableGrid === 'function') renderTableGrid();
}


window.editSale = function(id) {
    const sale = salesHistory.find(s => s.id == id);
    if (!sale) return;
    
    if (cart.length > 0) {
        if (!confirm('Current cart items will be cleared. Do you want to edit this sale?')) return;
    }
    
    // Store editing state
    editingSaleId = sale.id;
    previousPaidAmount = sale.total - (sale.dues || 0);
    
    // Load sale data into cart
    cart = sale.items.map(saleItem => {
        const invItem = inventory.find(i => i.name.trim().toLowerCase() === saleItem.name.trim().toLowerCase());
        if (invItem) {
            return { ...saleItem, id: invItem.id };
        }
        return { ...saleItem };
    });

    const type = sale.orderType || 'COUNTER';
    currentSelectedTable = sale.tableId || null;
    
    // Update UI
    window.showView('pos');
    
    // Show previous paid in UI
    const prevPaidRow = document.getElementById('prev-paid-row');
    const prevPaidEl = document.getElementById('cart-prev-paid');
    if (prevPaidRow && prevPaidEl) {
        prevPaidRow.style.display = 'flex';
        prevPaidEl.innerText = formatCurrency(previousPaidAmount);
    }
    
    // Clear search so items are visible
    const searchInput = document.getElementById('pos-search');
    if (searchInput) searchInput.value = '';
    
    // Set order type
    const targetBtn = Array.from(document.querySelectorAll('.order-type-btn')).find(btn => 
        btn.innerText.toUpperCase().includes(type)
    );
    if (targetBtn) setOrderType(type, targetBtn);
    
    calculateTotal(); // Refresh total and dues
    setOrderType(type, targetBtn, true);

    window.renderCart();
    if (typeof renderPOSItems === 'function') renderPOSItems(); 
}

// Global Keyboard Shortcuts
$(document).on('_disabled_keydown', function (e) {
    // Close Receipt Modal with Enter or Escape
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal && receiptModal.classList.contains('active')) {
        if (e.key === 'Enter' || e.key === 'Escape') {
            closeModal('receiptModal');
            e.preventDefault();
        }
    }
});

// Cart toggle moved to main.js

// Tables curtain toggle moved to main.js

// System Settings & Data Management


}
