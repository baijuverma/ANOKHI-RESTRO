// Data Structures
let inventory = JSON.parse(localStorage.getItem('anokhi_inventory')) || [];
let salesHistory = JSON.parse(localStorage.getItem('anokhi_sales')) || [];
let cart = [];

// DOM Elements
const views = document.querySelectorAll('.view-section');
const navItems = document.querySelectorAll('.nav-item');

// Initialize App
window.checkLogin = function() {
    const pwd = document.getElementById('login-password').value;
    if (pwd === '8540') {
        document.getElementById('login-screen').style.display = 'none';
        // Password correct, proceed
    } else {
        alert('Incorrect Password!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Always show login screen on load
    const loginScreen = document.getElementById('login-screen');
    if(loginScreen) {
        loginScreen.style.display = 'flex';
        const pwdInput = document.getElementById('login-password');
        if (pwdInput) {
            pwdInput.value = '';
            setTimeout(() => pwdInput.focus(), 100);
        }
    }

    // Navigation Logic
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Show target view
            views.forEach(v => {
                v.classList.remove('active');
                if(v.id === target) {
                    v.classList.add('active');
                }
            });

            // Refresh view specific data
            if(target === 'dashboard') updateDashboard();
            if(target === 'inventory') renderInventory();
            if(target === 'pos') renderPOSItems();
            if(target === 'history') renderHistory();
        });
    });

    // Form Submissions
    document.getElementById('item-form').addEventListener('submit', handleItemSubmit);
    document.getElementById('restock-form').addEventListener('submit', handleRestockSubmit);
    document.getElementById('pos-search').addEventListener('input', (e) => renderPOSItems(e.target.value));

    // Initial Renders
    updateDashboard();
    renderInventory();
    renderPOSItems();
    renderHistory();
});

// Utility: Save to LocalStorage
function saveData() {
    localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
    localStorage.setItem('anokhi_sales', JSON.stringify(salesHistory));
}

// Format Currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}

// Format Date to DD/MM/YYYY
function getDDMMYYYY(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format Date & Time
function formatDateTime(isoString) {
    const d = new Date(isoString);
    const datePart = getDDMMYYYY(d);
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    
    return `${datePart}, ${strTime}`;
}

// Modals
window.openAddItemModal = function() {
    document.getElementById('item-form').reset();
    document.getElementById('item-id').value = '';
    document.getElementById('item-low-stock').value = '5';
    document.getElementById('modal-title').innerText = 'Add New Item';
    openModal('addItemModal');
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

window.showStockList = function(type) {
    let list = [];
    let title = '';
    
    if (type === 'total') {
        list = inventory;
        title = 'Total Items Available';
    } else if (type === 'low') {
        list = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0);
        title = 'Low Stock Items';
    } else if (type === 'out') {
        list = inventory.filter(i => i.quantity === 0);
        title = 'Out of Stock Items';
    }
    
    document.getElementById('stock-list-title').innerText = title;
    const tbody = document.getElementById('stock-list-tbody');
    tbody.innerHTML = '';
    
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No items found in this category.</td></tr>';
    } else {
        list.forEach(item => {
            let statusColor = 'var(--success-color)';
            if (item.quantity === 0) statusColor = 'var(--danger-color)';
            else if (item.quantity <= (item.lowStockThreshold || 5)) statusColor = 'var(--warning-color)';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${item.quantity}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    openModal('stockListModal');
}

window.showTodaySalesList = function() {
    const todayStr = getDDMMYYYY(new Date());
    let todaySales = salesHistory.filter(s => getDDMMYYYY(new Date(s.date)) === todayStr);
    
    // aggregate items
    let itemsSold = {};
    todaySales.forEach(sale => {
        sale.items.forEach(item => {
            if(!itemsSold[item.id]) {
                itemsSold[item.id] = { name: item.name, qty: 0, total: 0 };
            }
            itemsSold[item.id].qty += item.cartQty;
            itemsSold[item.id].total += item.price * item.cartQty;
        });
    });
    
    const tbody = document.getElementById('today-sales-tbody');
    tbody.innerHTML = '';
    
    const itemIds = Object.keys(itemsSold);
    if (itemIds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No items sold today.</td></tr>';
    } else {
        itemIds.forEach(id => {
            const data = itemsSold[id];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${data.name}</td>
                <td style="font-weight:bold; color:var(--accent-color);">${data.qty}</td>
                <td>${formatCurrency(data.total)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    openModal('todaySalesModal');
}

// Dashboard Logic
function updateDashboard() {
    const todayStr = getDDMMYYYY(new Date());
    let todaySales = salesHistory.filter(s => getDDMMYYYY(new Date(s.date)) === todayStr);
    let todayRev = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    
    let todayCash = todaySales.reduce((sum, sale) => {
        if (sale.paymentMode === 'BOTH') return sum + sale.splitAmounts.cash;
        return sum + ((sale.paymentMode || 'CASH') === 'CASH' ? sale.total : 0);
    }, 0);
    
    let todayUpi = todaySales.reduce((sum, sale) => {
        if (sale.paymentMode === 'BOTH') return sum + sale.splitAmounts.upi;
        return sum + (sale.paymentMode === 'UPI' ? sale.total : 0);
    }, 0);

    let totalItems = inventory.length;
    let lowStock = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 5) && i.quantity > 0).length;
    let outOfStock = inventory.filter(i => i.quantity === 0).length;

    document.getElementById('total-revenue').innerText = formatCurrency(todayRev);
    document.getElementById('today-cash').innerText = formatCurrency(todayCash);
    document.getElementById('today-upi').innerText = formatCurrency(todayUpi);

    document.getElementById('total-items').innerText = totalItems;
    document.getElementById('low-stock').innerText = lowStock;
    document.getElementById('out-of-stock').innerText = outOfStock;

    // Recent Sales
    const tbody = document.querySelector('#recent-sales-table tbody');
    tbody.innerHTML = '';
    
    const recentSales = [...salesHistory].reverse().slice(0, 5);
    if(recentSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent sales</td></tr>';
    }

    recentSales.forEach(sale => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${sale.id}</td>
            <td>${formatDateTime(sale.date)}</td>
            <td>${sale.items.length} items</td>
            <td>${formatCurrency(sale.total)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Inventory Logic
function handleItemSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const name = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const quantity = parseInt(document.getElementById('item-quantity').value);
    const lowStockThreshold = parseInt(document.getElementById('item-low-stock').value) || 5;

    if (id) {
        // Update
        const index = inventory.findIndex(i => i.id == id);
        if(index > -1) {
            inventory[index] = { ...inventory[index], name, category, price, quantity, lowStockThreshold };
        }
    } else {
        // Add
        const newItem = {
            id: Date.now().toString(),
            name, category, price, quantity, lowStockThreshold
        };
        inventory.push(newItem);
    }

    saveData();
    closeModal('addItemModal');
    renderInventory();
    updateDashboard();
}

function renderInventory() {
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';

    if(inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No items found. Add some items to your inventory.</td></tr>';
        return;
    }

    inventory.forEach(item => {
        let statusClass = 'status-instock';
        let statusText = 'In Stock';
        
        if (item.quantity === 0) {
            statusClass = 'status-outstock';
            statusText = 'Out of Stock';
        } else if (item.quantity <= (item.lowStockThreshold || 5)) {
            statusClass = 'status-lowstock';
            statusText = 'Low Stock';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="action-btn" style="color: var(--success-color); border: 1px solid var(--success-color); background: rgba(16, 185, 129, 0.1);" onclick="openRestockModal('${item.id}')" title="Add Stock"><i class="fa-solid fa-plus"></i></button>
                <button class="action-btn edit" onclick="editItem('${item.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="action-btn delete" onclick="deleteItem('${item.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openRestockModal = function(id) {
    const item = inventory.find(i => i.id === id);
    if(item) {
        document.getElementById('restock-item-id').value = item.id;
        document.getElementById('restock-item-name').innerText = `Adding stock for: ${item.name}`;
        document.getElementById('restock-quantity').value = '';
        openModal('restockModal');
    }
}

function handleRestockSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('restock-item-id').value;
    const qtyToAdd = parseInt(document.getElementById('restock-quantity').value);

    const index = inventory.findIndex(i => i.id == id);
    if(index > -1 && qtyToAdd > 0) {
        inventory[index].quantity += qtyToAdd;
        saveData();
        closeModal('restockModal');
        renderInventory();
        updateDashboard();
    }
}

window.editItem = function(id) {
    const item = inventory.find(i => i.id === id);
    if(item) {
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-quantity').value = item.quantity;
        document.getElementById('item-low-stock').value = item.lowStockThreshold || 5;
        document.getElementById('modal-title').innerText = 'Edit Item';
        openModal('addItemModal');
    }
}

window.deleteItem = function(id) {
    if(confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(i => i.id !== id);
        saveData();
        renderInventory();
        updateDashboard();
    }
}

// POS Logic
function renderPOSItems(search = '') {
    const grid = document.getElementById('pos-item-grid');
    grid.innerHTML = '';

    const filtered = inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) && i.quantity > 0);

    if(filtered.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-secondary); grid-column:1/-1; text-align:center;">No available items found.</p>';
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'pos-item-card';
        div.onclick = () => addToCart(item);
        div.innerHTML = `
            <h4>${item.name}</h4>
            <div class="price">${formatCurrency(item.price)}</div>
            <div class="stock">${item.quantity} in stock</div>
        `;
        grid.appendChild(div);
    });
}

function addToCart(item) {
    const existing = cart.find(c => c.id === item.id);
    if(existing) {
        if(existing.cartQty < item.quantity) {
            existing.cartQty++;
        } else {
            alert('Not enough stock!');
        }
    } else {
        cart.push({...item, cartQty: 1});
    }
    renderCart();
}

window.updateCartQty = function(id, delta) {
    const itemIndex = cart.findIndex(c => c.id === id);
    if(itemIndex > -1) {
        const item = cart[itemIndex];
        const invItem = inventory.find(i => i.id === id);
        
        item.cartQty += delta;
        if(item.cartQty <= 0) {
            cart.splice(itemIndex, 1);
        } else if (item.cartQty > invItem.quantity) {
            item.cartQty = invItem.quantity;
            alert('Not enough stock!');
        }
    }
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    cartContainer.innerHTML = '';
    
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.cartQty;
        subtotal += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>${formatCurrency(item.price)} x ${item.cartQty}</p>
            </div>
            <div class="cart-controls">
                <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                <span>${item.cartQty}</span>
                <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
        cartContainer.appendChild(div);
    });

    document.getElementById('cart-subtotal').innerText = formatCurrency(subtotal);
    calculateTotal();
}

window.calculateTotal = function() {
    let subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
    let discountInput = document.getElementById('cart-discount');
    let discountTypeObj = document.getElementById('discount-type');
    let discountType = discountTypeObj ? discountTypeObj.value : 'amount';
    let discountVal = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    
    let discountAmount = 0;
    
    if (discountType === 'percent') {
        if (discountVal > 100) {
            discountVal = 100;
            if(discountInput) discountInput.value = discountVal;
        }
        discountAmount = subtotal * (discountVal / 100);
    } else {
        if (discountVal > subtotal) {
            discountVal = subtotal;
            if(discountInput) discountInput.value = discountVal;
        }
        discountAmount = discountVal;
    }
    let totalBeforeRound = subtotal - discountAmount;
    let finalTotal = Math.round(totalBeforeRound);
    let roundOff = finalTotal - totalBeforeRound;
    
    const roundOffEl = document.getElementById('cart-roundoff');
    if(roundOffEl) {
        roundOffEl.innerText = (roundOff >= 0 ? '+' : '') + formatCurrency(roundOff).replace('₹-', '-₹');
    }

    document.getElementById('cart-total').innerText = formatCurrency(finalTotal);
    return { subtotal, discount: discountAmount, roundOff, total: finalTotal };
}

window.clearCart = function() {
    cart = [];
    const discountInput = document.getElementById('cart-discount');
    if(discountInput) discountInput.value = '0';
    renderCart();
}

window.toggleSplitPayment = function() {
    const pMode = document.querySelector('input[name="payment-mode"]:checked').value;
    const splitFields = document.getElementById('split-payment-fields');
    if (pMode === 'BOTH') {
        splitFields.style.display = 'block';
    } else {
        splitFields.style.display = 'none';
    }
}

window.processSale = function() {
    if(cart.length === 0) return alert('Cart is empty!');

    const totals = calculateTotal();
    const total = totals.total;
    const discount = totals.discount;
    const roundOff = totals.roundOff;
    const saleId = Math.floor(100000 + Math.random() * 900000).toString();

    const paymentModeObj = document.querySelector('input[name="payment-mode"]:checked');
    const paymentMode = paymentModeObj ? paymentModeObj.value : 'CASH';

    let splitAmounts = null;
    if (paymentMode === 'BOTH') {
        const splitCash = parseFloat(document.getElementById('split-cash-amount').value) || 0;
        const splitUpi = parseFloat(document.getElementById('split-upi-amount').value) || 0;
        
        if (splitCash + splitUpi !== total) {
            return alert(`Validation Error: Cash (₹${splitCash}) + UPI (₹${splitUpi}) must exactly equal the Total Bill (₹${total}).`);
        }
        splitAmounts = { cash: splitCash, upi: splitUpi };
    }

    // Deduct Inventory
    cart.forEach(cartItem => {
        const invItem = inventory.find(i => i.id === cartItem.id);
        if(invItem) {
            invItem.quantity -= cartItem.cartQty;
        }
    });

    // Record Sale
    const sale = {
        id: saleId,
        date: new Date().toISOString(),
        items: [...cart],
        total: total,
        discount: discount,
        roundOff: roundOff,
        paymentMode: paymentMode,
        splitAmounts: splitAmounts
    };
    
    salesHistory.push(sale);
    saveData();

    // Show Receipt Modal
    showReceipt(sale);

    // Reset UI
    clearCart();
    renderInventory();
    renderPOSItems();
    updateDashboard();
}

function showReceipt(sale) {
    const details = document.getElementById('receipt-details');
    let itemsHtml = sale.items.map(i => `
        <div class="receipt-item">
            <span>${i.name} (x${i.cartQty})</span>
            <span>${formatCurrency(i.price * i.cartQty)}</span>
        </div>
    `).join('');

    details.innerHTML = `
        <p style="text-align:center; color:var(--text-secondary); margin-bottom: 16px;">Order #${sale.id}</p>
        <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px;">
            ${itemsHtml}
            ${sale.discount > 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--warning-color);">
                <span>Discount</span>
                <span>-${formatCurrency(sale.discount)}</span>
            </div>` : ''}
            ${sale.roundOff && sale.roundOff !== 0 ? `<div style="display:flex; justify-content:space-between; margin-top: 4px; font-size: 14px; color: var(--text-secondary);">
                <span>Round Off</span>
                <span>${(sale.roundOff >= 0 ? '+' : '') + formatCurrency(sale.roundOff).replace('₹-', '-₹')}</span>
            </div>` : ''}
            <div style="display:flex; justify-content:space-between; margin-top: 16px; font-weight:bold; font-size: 18px;">
                <span>Total Paid (${sale.paymentMode === 'BOTH' ? 'SPLIT' : sale.paymentMode || 'CASH'})</span>
                <span style="color:var(--success-color);">${formatCurrency(sale.total)}</span>
            </div>
            ${sale.paymentMode === 'BOTH' && sale.splitAmounts ? `
            <div style="display:flex; justify-content:space-between; margin-top: 8px; font-size: 14px; color: var(--text-secondary); border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 8px;">
                <span>Cash Paid: <span style="color:var(--text-primary);">${formatCurrency(sale.splitAmounts.cash)}</span></span>
                <span>UPI Paid: <span style="color:var(--text-primary);">${formatCurrency(sale.splitAmounts.upi)}</span></span>
            </div>
            ` : ''}
        </div>
    `;

    openModal('receiptModal');
}

let currentCalendarDate = null;

window.updateCalendarView = function() {
    const m = parseInt(document.getElementById('calendar-month-select').value);
    const y = parseInt(document.getElementById('calendar-year-select').value);
    currentCalendarDate = new Date(y, m, 1);
    
    renderHistory();
}

function renderCalendarChart(dailyTotals) {
    const wrapper = document.getElementById('calendar-wrapper');
    if(!wrapper) return;

    let targetDate = new Date();
    if (currentCalendarDate) {
        targetDate = currentCalendarDate;
    } else {
        currentCalendarDate = targetDate;
    }
    
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); // 0-6 (Sun-Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let monthOptions = monthNames.map((m, idx) => `<option value="${idx}" ${idx === month ? 'selected' : ''}>${m}</option>`).join('');
    
    let currentYearObj = new Date().getFullYear();
    let years = [];
    for(let y = currentYearObj - 5; y <= currentYearObj + 5; y++) {
        years.push(y);
    }
    let yearOptions = years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('');
    
    let html = `
        <div style="text-align: center; margin-bottom: 16px; display: flex; justify-content: center; gap: 10px;">
            <select id="calendar-month-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="updateCalendarView()">
                ${monthOptions}
            </select>
            <select id="calendar-year-select" style="width: auto; padding: 6px 16px; background: rgba(0,0,0,0.3); color: white; border: 1px solid var(--panel-border); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;" onchange="updateCalendarView()">
                ${yearOptions}
            </select>
        </div>
        <div class="calendar-header">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div class="calendar-chart">
    `;
    
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dStr = String(day).padStart(2, '0') + '/' + String(month + 1).padStart(2, '0') + '/' + year;
        const total = dailyTotals[dStr] ? dailyTotals[dStr].total : 0;
        const orders = dailyTotals[dStr] ? dailyTotals[dStr].orders : 0;
        const cashAmt = dailyTotals[dStr] ? dailyTotals[dStr].cash : 0;
        const upiAmt = dailyTotals[dStr] ? dailyTotals[dStr].upi : 0;
        
        let extraClass = total > 0 ? 'has-sales' : '';
        let displayTotal = total > 0 ? formatCurrency(total) : '-';
        let displayOrders = orders > 0 ? `${orders} order(s)` : '';
        let breakdownHtml = total > 0 ? `
            <div style="display:flex; justify-content:space-between; font-size:10px; margin-top:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.1);">
                <span style="color:var(--success-color);" title="Cash Sale">Cash: ${cashAmt}</span>
                <span style="color:#818cf8;" title="UPI Sale">UPI: ${upiAmt}</span>
            </div>
        ` : '';

        html += `
            <div class="calendar-day ${extraClass}" title="${dStr}">
                <div class="flex-between">
                    <span class="calendar-date-num">${day}</span>
                    <span style="font-size: 11px; color: var(--text-secondary);">${displayOrders}</span>
                </div>
                <div class="calendar-sales-amt">${displayTotal}</div>
                ${breakdownHtml}
            </div>
        `;
    }
    
    html += `</div>`;
    wrapper.innerHTML = html;
}

// History Logic
function renderHistory() {
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = '';

    if(salesHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No sales history found.</td></tr>';
        renderCalendarChart({});
        return;
    }

    // Calculate Monthly Calendar Totals
    const calendarTotals = {};
    salesHistory.forEach(sale => {
        const dateStr = getDDMMYYYY(new Date(sale.date));
        if(!calendarTotals[dateStr]) {
            calendarTotals[dateStr] = { orders: 0, total: 0, cash: 0, upi: 0 };
        }
        calendarTotals[dateStr].orders += 1;
        calendarTotals[dateStr].total += sale.total;
        
        const pMode = sale.paymentMode || 'CASH';
        if(pMode === 'UPI') {
            calendarTotals[dateStr].upi += sale.total;
        } else if (pMode === 'BOTH') {
            calendarTotals[dateStr].upi += sale.splitAmounts.upi;
            calendarTotals[dateStr].cash += sale.splitAmounts.cash;
        } else {
            calendarTotals[dateStr].cash += sale.total;
        }
    });

    renderCalendarChart(calendarTotals);

    const sortedHistory = [...salesHistory].reverse();

    sortedHistory.forEach(sale => {
        const itemsStr = sale.items.map(i => `${i.name} (x${i.cartQty})`).join(', ');
        
        const tr = document.createElement('tr');
        const pMode = sale.paymentMode || 'CASH';
        let pModeBadge = '';
        if (pMode === 'UPI') {
            pModeBadge = '<span class="status-badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">UPI</span>';
        } else if (pMode === 'BOTH') {
            pModeBadge = '<span class="status-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b;">SPLIT</span>';
        } else {
            pModeBadge = '<span class="status-badge status-instock">CASH</span>';
        }

        tr.innerHTML = `
            <td><strong>#${sale.id}</strong></td>
            <td>${formatDateTime(sale.date)}</td>
            <td><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsStr}">${itemsStr}</div></td>
            <td>${pModeBadge}</td>
            <td style="color:var(--success-color); font-weight:bold;">${formatCurrency(sale.total)}</td>
            <td>
                <button class="btn-primary" style="padding: 6px 12px; font-size:12px; margin-right: 5px;" onclick="viewReceipt('${sale.id}')">View</button>
                <button class="btn-danger" style="padding: 6px 12px; font-size:12px;" onclick="deleteSale('${sale.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Attach globally for inline onclick
window.viewReceipt = function(id) {
    const sale = salesHistory.find(s => s.id === id);
    if(sale) showReceipt(sale);
}

window.deleteSale = function(saleId) {
    const password = prompt("Enter Admin Password to delete this sale:");
    if (password === '8540') {
        const saleIndex = salesHistory.findIndex(s => s.id === saleId);
        if (saleIndex > -1) {
            const sale = salesHistory[saleIndex];
            
            // Restock inventory
            sale.items.forEach(cartItem => {
                const invItem = inventory.find(i => i.id === cartItem.id);
                if (invItem) {
                    invItem.quantity += cartItem.cartQty;
                }
            });

            // Remove sale
            salesHistory.splice(saleIndex, 1);
            saveData();
            
            // Re-render
            renderHistory();
            updateDashboard();
            renderInventory();
            alert("Sale deleted and stock restored successfully.");
        }
    } else if (password !== null) {
        alert("Incorrect Password! You do not have permission to delete this sale.");
    }
}
