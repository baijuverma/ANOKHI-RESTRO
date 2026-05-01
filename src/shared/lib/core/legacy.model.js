export function initCoreLogic() {
function truncateName(name) {
    if (!name) return '';
    return name.length > 10 ? name.substring(0, 8) + '..' : name;
}

// Defensive Stubs for Modular Functions (Prevents crashes on file:// protocol)
window.renderInventory = window.renderInventory || function() {};
window.renderPOSItems = window.renderPOSItems || function() {};
window.renderHistory = window.renderHistory || function() {};
window.renderTableGrid = window.renderTableGrid || function() {};
window.renderExpenses = window.renderExpenses || function() {};
window.updateDashboard = window.updateDashboard || function() {};
window.updateExpenseStats = window.updateExpenseStats || function() {};
window.initSettingsView = window.initSettingsView || function() {};

// Safe Storage Helper
function getLocalData(key, defaultVal) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
        console.warn('Error parsing localStorage key "' + key + '":', e);
        return defaultVal;
    }
}

function formatCurrency(amount) {
    return String.fromCharCode(8377) + parseFloat(amount).toFixed(2);
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

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}


function formatDateLabel(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

window.clearInput = function(id) {
    const input = document.getElementById(id);
    if (input) {
        input.value = '';
        input.focus();
        // Trigger both input and change events to ensure dependency logic runs
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}



window.showView = function(target) {
    const views = document.querySelectorAll('.view-section');
    const navItems = document.querySelectorAll('.nav-item');
    
    console.log('Switching to view:', target);

    // Hide all views
    views.forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    
    // Show target view
    const targetView = document.getElementById(target);
    if (targetView) {
        targetView.classList.add('active');
        targetView.classList.remove('hidden');
        console.log('View activated:', target);
    } else {
        console.warn('Target view not found:', target);
    }

    // Update active nav in sidebar
    navItems.forEach(item => {
        item.classList.remove('active');
        if(item.getAttribute('data-target') === target) {
            item.classList.add('active');
        }
    });

    // Refresh view specific data safely
    if(target === 'dashboard' && typeof updateDashboard === 'function') updateDashboard();
    if(target === 'inventory' && typeof renderInventory === 'function') renderInventory();
    if(target === 'pos' && typeof renderPOSItems === 'function') renderPOSItems();
    if(target === 'history' && typeof renderHistory === 'function') renderHistory();
    if(target === 'expenses') {
        if (typeof renderExpenses === 'function') renderExpenses();
        if (typeof updateExpenseStats === 'function') updateExpenseStats();
    }
    if(target === 'settings' && typeof initSettingsView === 'function') initSettingsView();
}

window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}


window.selectTable = function(id) {
    window.currentSelectedTable = id;
    if (id) {
        localStorage.setItem('anokhi_selected_table', id);
    } else {
        localStorage.removeItem('anokhi_selected_table');
    }
    const table = (window.tables || []).find(t => String(t.id) === String(id));
    if (table) {
        // Sync cart with table's cart
        if (typeof window.setCart === 'function') {
            window.setCart(table.cart || []);
        } else {
            window.cart = table.cart || [];
        }
        
        const tableNameEl = document.getElementById('current-table-name');
        if (tableNameEl) tableNameEl.innerText = table.name;
        
        // Show advance if any
        const advEl = document.getElementById('advance-paid-info');
        const advVal = document.getElementById('cart-advance-paid');
        if (advEl && advVal) {
            if (table.advance > 0) {
                advEl.style.display = 'flex';
                advVal.innerText = formatCurrency(table.advance);
            } else {
                advEl.style.display = 'none';
            }
        }
    }
    
    if (typeof window.refreshUI === 'function') {
        window.refreshUI();
    } else {
        if (typeof renderTableGrid === 'function') renderTableGrid();
        if (typeof renderCart === 'function') renderCart();
    }
};

window.showToast = function(message, type = "success") {

    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}



}
