export function initPosLogic() {
// renderCart (Now handled by widgets/cart in main.js)

window.newBill = function() {
    console.log('newBill() called. Resetting POS state.');
    const currentCart = window.cart || [];
    
    // If cart has items, ask for confirmation
    if (currentCart.length > 0) {
        if (!confirm('Are you sure you want to cancel this order? All unsaved changes will be lost.')) {
            return;
        }
    }

    // If a table is selected, clear its saved cart and advance as well (Full Cancel)
    if (window.currentSelectedTable) {
        const allTables = window.tables || [];
        const tableIndex = allTables.findIndex(t => t.id === window.currentSelectedTable);
        if (tableIndex > -1) {
            if (typeof window.setCart === 'function') {
                window.setCart([], tableIndex);
            } else {
                allTables[tableIndex].cart = [];
            }
            allTables[tableIndex].advance = 0;
            if (typeof saveData === 'function') saveData();
        }
    }
    
    // Reset POS State
    window.currentSelectedTable = null;
    
    // Reset Buttons
    const processBtn = document.getElementById('btn-process-sale');
    if (processBtn) {
        processBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sale [Ent]';
        processBtn.style.background = ''; // Revert to CSS default (success green)
    }
    
    const deleteBtn = document.getElementById('btn-delete-sale');
    if (deleteBtn) deleteBtn.style.display = 'none';

    if (typeof window.setCart === 'function') {
        window.setCart([]);
    } else {
        window.cart = [];
    }
    
    const tableNameEl = document.getElementById('current-table-name');
    if (tableNameEl) tableNameEl.innerText = 'No Table Selected';
    
    const advInfo = document.getElementById('advance-paid-info');
    if (advInfo) advInfo.style.display = 'none';
    
    // Reset to default Order Type UI (Dine-In)
    const dineInBtn = document.querySelector('.order-type-btn[onclick*="DINE_IN"]');
    if (dineInBtn && typeof setOrderType === 'function') setOrderType('DINE_IN', dineInBtn);
    
    if (typeof window.refreshUI === 'function') {
        window.refreshUI();
    } else {
        if (typeof window.renderCart === 'function') window.renderCart();
        if (typeof renderTableGrid === 'function') renderTableGrid(); 
        if (typeof renderPOSItems === 'function') renderPOSItems(); 
    }
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
                const tbl = (window.tables || []).find(t => String(t.id) === String(window.currentSelectedTable));
                const tblName = tbl ? tbl.name : window.currentSelectedTable;
                tableIndicator.textContent = `(${tblName})`;
                tableIndicator.style.display = 'inline-block';
            } else {
                tableIndicator.textContent = '';
                tableIndicator.style.display = 'none';
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

window.autoFillPayment = function(type) {
    const cashInput = document.getElementById('pay-cash-amount');
    const upiInput = document.getElementById('pay-upi-amount');
    if (!cashInput || !upiInput) return;

    // If either field has a value, do not auto-fill
    if (cashInput.value !== '' || upiInput.value !== '') return;

    if (type === 'cash' && cashInput._isClearing) return;
    if (type === 'upi' && upiInput._isClearing) return;

    const totalEl = document.getElementById('cart-total');
    if (!totalEl) return;
    
    const totalStr = totalEl.innerText.replace(/[^0-9.]/g, '');
    const finalTotal = parseFloat(totalStr) || 0;
    
    const prevPaid = typeof previousPaidAmount !== 'undefined' ? previousPaidAmount : 0;
    const remainingToPay = Math.max(0, finalTotal - prevPaid);
    
    if (remainingToPay > 0) {
        if (type === 'cash') {
            cashInput.value = remainingToPay;
        } else if (type === 'upi') {
            upiInput.value = remainingToPay;
        }
        if (typeof calculateDues === 'function') calculateDues();
    }
};

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
        const modalDues = document.getElementById('modal-dues-amount');
        if (modalDues) modalDues.innerText = formatCurrency(dues);
        
        const nameInput = document.getElementById('cust-name');
        const mobileInput = document.getElementById('cust-mobile');
        
        if (window.editingSaleId) {
            const sale = (window.salesHistory || []).find(s => s.id == window.editingSaleId);
            if (sale) {
                if (nameInput) nameInput.value = sale.customerName || '';
                if (mobileInput) mobileInput.value = sale.customerMobile || '';
            }
        } else {
            // New Sale: Clear fields unless already filled
            if (nameInput && !nameInput.value) nameInput.value = '';
            if (mobileInput && !mobileInput.value) mobileInput.value = '';
        }
        
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
    
    finalizeSaleRecord(name || 'Walk-in Customer', mobile || '');
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

    const allOrders = window.activeOrders || [];
    // Only show Takeaway and Quick/Counter sales in this list
    const orders = allOrders.filter(o => o.orderType !== 'DINE_IN');

    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:10px; color:var(--text-secondary); font-size:11px; width:100%;">No pending takeaway/counter bills.</div>';
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'pending-order-card glass-panel';
        // Style like a table card
        card.style.cssText = `
            flex: 0 0 110px;
            height: 90px;
            padding: 10px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.03);
        `;
        
        card.onclick = () => window.loadActiveOrder(order.id);
        
        const timeStr = new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const typeIcon = order.orderType === 'TAKEAWAY' ? 'fa-bag-shopping' : (order.orderType === 'DINE_IN' ? 'fa-chair' : 'fa-bolt');
        
        card.innerHTML = `
            <span class="bullet" style="position:absolute; top:8px; right:8px; background:var(--warning-color); width:6px; height:6px; border-radius:50%;"></span>
            <div style="font-size: 18px; color: var(--accent-color); margin-bottom: 4px;">
                <i class="fa-solid ${typeIcon}"></i>
            </div>
            <div style="font-weight:800; font-size:11px; color:white; line-height:1;">
                ${order.tableName || order.orderType}
            </div>
            <div style="font-size:10px; font-weight:700; color:var(--warning-color); margin-top:4px;">
                ${formatCurrency(order.total)}
            </div>
            <div style="font-size:8px; color:var(--text-secondary); margin-top:2px;">
                ${order.items.length} Items • ${timeStr}
            </div>
            <button class="action-btn" style="position:absolute; bottom:5px; right:5px; color:rgba(255,255,255,0.3); font-size:10px; padding:2px; background:transparent; border:none;" onclick="event.stopPropagation(); window.deleteActiveOrder('${order.id}')">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        // Add hover effect via JS
        card.onmouseover = () => { card.style.background = 'rgba(255,255,255,0.08)'; card.style.transform = 'translateY(-2px)'; };
        card.onmouseout = () => { card.style.background = 'rgba(255,255,255,0.03)'; card.style.transform = 'translateY(0)'; };

        container.appendChild(card);
    });
};

function finalizeSaleRecord(custName = null, custMobile = null) {
    const totals = window.calculateTotal() || { total: 0, discount: 0, roundOff: 0, advance: 0 };
    const total = totals.total;
    const discount = totals.discount;
    const roundOff = totals.roundOff;
    
    // Get current payment values
    const payCash = parseFloat(document.getElementById('pay-cash-amount').value) || 0;
    const payUpi = parseFloat(document.getElementById('pay-upi-amount').value) || 0;

    let finalSaleId = Math.floor(100000 + Math.random() * 900000).toString();
    let finalCustName = custName;
    let finalCustMobile = custMobile;
    let finalSaleDate = new Date().toISOString();
    
    let prevCash = 0;
    let prevUpi = 0;
    let prevTotalPaid = 0;

    if (window.editingSaleId) {
        const oldSale = (window.salesHistory || []).find(s => s.id == window.editingSaleId);
        if (oldSale) {
            finalSaleId = oldSale.id;
            if (oldSale.date) finalSaleDate = oldSale.date;
            else if (oldSale.timestamp) finalSaleDate = oldSale.timestamp;

            if (oldSale.items) {
                oldSale.items.forEach(oldItem => {
                    const invItem = (window.inventory || []).find(i => i.id === oldItem.id);
                    if (invItem) invItem.quantity += oldItem.cartQty;
                });
            }
            if (!finalCustName) finalCustName = oldSale.customerName;
            if (!finalCustMobile) finalCustMobile = oldSale.customerMobile;
            window.salesHistory = window.salesHistory.filter(s => s.id != window.editingSaleId);
            
            prevCash = (window.previousSplitAmounts && window.previousSplitAmounts.cash) ? parseFloat(window.previousSplitAmounts.cash) : 0;
            prevUpi = (window.previousSplitAmounts && window.previousSplitAmounts.upi) ? parseFloat(window.previousSplitAmounts.upi) : 0;
            prevTotalPaid = window.previousPaidAmount || 0;
            
            // Fallback if split amounts weren't tracked but amount was paid
            if (prevTotalPaid > 0 && prevCash === 0 && prevUpi === 0) {
                if (oldSale.paymentMode === 'UPI') prevUpi = prevTotalPaid;
                else prevCash = prevTotalPaid;
            }
        }
    }

    const finalCash = prevCash + payCash;
    const finalUpi = prevUpi + payUpi;
    const finalSplitAmounts = { cash: finalCash, upi: finalUpi };
    const totalPaidCombined = prevTotalPaid + payCash + payUpi;

    // Deduct Inventory
    (window.cart || []).forEach(cartItem => {
        const invItem = (window.inventory || []).find(i => i.id === cartItem.id);
        if(invItem) {
            invItem.quantity -= cartItem.cartQty;
        }
    });

    // Determine Table Name and ID
    let tableName = null;
    let tableId = null;
    if (window.selectedOrderType === 'DINE_IN' && window.currentSelectedTable) {
        tableId = window.currentSelectedTable;
        const table = (window.tables || []).find(t => String(t.id) === String(window.currentSelectedTable));
        tableName = table ? table.name : window.currentSelectedTable;
    }

    // Record Sale
    const sale = {
        id: finalSaleId,
        date: finalSaleDate,
        items: [...window.cart],
        total: total,
        discount: discount,
        roundOff: roundOff,
        paymentMode: (finalCash > 0 && finalUpi > 0) ? 'BOTH' : (finalUpi > 0 ? 'UPI' : 'CASH'),
        splitAmounts: finalSplitAmounts,
        orderType: window.selectedOrderType,
        tableName: tableName,
        tableId: tableId,
        advancePaid: totals.advance,
        customerName: finalCustName,
        customerMobile: finalCustMobile,
        dues: Math.max(0, total - totalPaidCombined)
    };
    
    // Clear held table if applicable
    if (window.selectedOrderType === 'DINE_IN' && window.currentSelectedTable) {
        const tableIndex = (window.tables || []).findIndex(t => String(t.id) === String(window.currentSelectedTable));
        if (tableIndex > -1) {
            window.tables[tableIndex].cart = [];
            window.tables[tableIndex].advance = 0;
        }
    }

    if (!window.salesHistory) window.salesHistory = [];
    window.salesHistory.unshift(sale);
    
    if (typeof window.saveData === 'function') window.saveData();

    // Reset editing state
    window.editingSaleId = null;
    window.previousPaidAmount = 0;
    window.previousSplitAmounts = null;
    const prevPaidRow = document.getElementById('prev-paid-row');
    if(prevPaidRow) prevPaidRow.style.display = 'none';

    // Show Receipt Modal
    if (typeof window.showReceipt === 'function') window.showReceipt(sale);

    // Reset UI
    window.currentSelectedTable = null;
    const tableNameDisplay = document.getElementById('current-table-name');
    if (tableNameDisplay) tableNameDisplay.innerText = 'No Table Selected';
    
    const advanceInfo = document.getElementById('advance-paid-info');
    if (advanceInfo) advanceInfo.style.display = 'none';
    
    window.clearCart();
    if (typeof window.renderInventory === 'function') window.renderInventory();
    if (typeof window.renderPOSItems === 'function') window.renderPOSItems();
    if (typeof window.updateDashboard === 'function') window.updateDashboard();
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();
    if (typeof window.renderHistoryCards === 'function') window.renderHistoryCards();
}


window.editSale = function(id) {
    const sale = (window.salesHistory || []).find(s => s.id == id);
    if (!sale) return;
    
    if ((window.cart || []).length > 0) {
        if (!confirm('Current cart items will be cleared. Do you want to edit this sale?')) return;
    }
    
    // Store editing state
    window.editingSaleId = sale.id;
    window.previousPaidAmount = sale.total - (sale.dues || 0);
    
    // Load sale data into cart
    const newCartItems = sale.items.map(saleItem => {
        // Try to find in inventory to get latest stock/price info, but preserve original ID
        const invItem = (window.inventory || []).find(i => 
            (saleItem.id && String(i.id) === String(saleItem.id)) || 
            (i.name.trim().toLowerCase() === saleItem.name.trim().toLowerCase())
        );
        
        return {
            ...saleItem,
            id: invItem ? invItem.id : (saleItem.id || `legacy-${Date.now()}-${Math.random()}`)
        };
    });

    console.log(`Editing Sale #${id}. Loading ${newCartItems.length} items into cart.`);

    if (typeof window.setCart === 'function') {
        window.setCart(newCartItems);
    } else {
        window.cart = newCartItems;
    }

    const type = sale.orderType || 'COUNTER';
    window.currentSelectedTable = sale.tableId || sale.tableName || null;

    // Pre-fill customer details if available
    const nameInput = document.getElementById('cust-name');
    const mobileInput = document.getElementById('cust-mobile');
    if (nameInput) nameInput.value = sale.customerName || '';
    if (mobileInput) mobileInput.value = sale.customerMobile || '';
    
    // Update UI
    window.showView('pos');
    
    // Update Buttons for Edit Mode
    const processBtn = document.getElementById('btn-process-sale');
    if (processBtn) {
        processBtn.innerHTML = '<i class="fa-solid fa-save"></i> Update Sale';
        processBtn.style.background = 'var(--warning-color)'; // Make it orange/amber
    }
    
    const deleteBtn = document.getElementById('btn-delete-sale');
    if (deleteBtn) deleteBtn.style.display = 'block';
    
    // Show previous paid in UI
    const prevPaidRow = document.getElementById('prev-paid-row');
    const prevPaidEl = document.getElementById('cart-prev-paid');
    if (prevPaidRow && prevPaidEl) {
        prevPaidRow.style.display = 'flex';
        prevPaidEl.innerText = window.formatCurrency ? window.formatCurrency(window.previousPaidAmount) : `₹${window.previousPaidAmount}`;
    }
    
    // Clear search so items are visible
    const searchInput = document.getElementById('pos-search');
    if (searchInput) searchInput.value = '';
    
    // Set order type
    if (typeof window.setOrderType === 'function') {
        window.setOrderType(type);
    }
    
    // Restore Table UI if DINE_IN
    const tableNameEl = document.getElementById('current-table-name');
    if (type === 'DINE_IN' && window.currentSelectedTable) {
        const tbl = (window.tables || []).find(t => String(t.id) === String(window.currentSelectedTable) || t.name === window.currentSelectedTable);
        if (tbl) {
            window.currentSelectedTable = tbl.id;
            if (tableNameEl) tableNameEl.innerText = tbl.name;
        } else {
            if (tableNameEl) tableNameEl.innerText = window.currentSelectedTable;
        }
    } else {
        window.currentSelectedTable = null;
        if (tableNameEl) tableNameEl.innerText = 'No Table Selected';
    }
    
    if (typeof window.calculateTotal === 'function') window.calculateTotal(); // Refresh total and dues
    
    // Explicitly refresh UI components
    if (typeof window.renderCart === 'function') window.renderCart();
    if (typeof window.renderPOSItems === 'function') window.renderPOSItems(); 
    if (typeof window.renderTableGrid === 'function') window.renderTableGrid();
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', function (e) {
    // Close Receipt Modal with Enter or Escape
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal && receiptModal.classList.contains('active')) {
        if (e.key === 'Enter' || e.key === 'Escape') {
            if (typeof closeModal === 'function') closeModal('receiptModal');
            e.preventDefault();
        }
    }
});

// Cart toggle moved to main.js

// Tables curtain toggle moved to main.js

window.deleteSaleFromEdit = function() {
    if (!window.editingSaleId) return;
    if (typeof deleteSale === 'function') {
        deleteSale(window.editingSaleId);
        newBill();
    }
}


}
