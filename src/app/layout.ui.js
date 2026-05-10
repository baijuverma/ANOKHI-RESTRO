export const appShellHTML = `
<!-- Fixed Global Logout Button (Top Right of Screen) -->
    <div id="global-logout-container" class="global-header-actions" style="position: fixed; top: 10px; right: 15px; z-index: 99999; display: none;">
        <button class="modern-logout-btn" onclick="logout()" title="Logout & Lock System">
            <i class="fa-solid fa-power-off"></i>
            <span class="btn-text">Logout</span>
        </button>
    </div>

    <!-- Toggle Sidebar Button -->
    <div class="toggle-sidebar-btn" onclick="toggleSidebar()">
        <i class="fa-solid fa-bars"></i>
    </div>

    <!-- Login Screen -->
    <div id="login-screen" class="login-overlay">
        <div class="login-card glass-panel">
            <div class="login-header">
                <div class="login-logo-container">
                    <img src="logo.jpg" alt="Anokhi Restaurant Logo" class="login-logo">
                </div>
                <h1>Anokhi Restaurant</h1>
                <p>Advanced Management System</p>
            </div>
            <div class="login-form">
                <div class="input-group">
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" id="login-password" placeholder="Enter Admin Password" autofocus onkeyup="if(event.key === 'Enter') checkLogin()">
                </div>
                <button onclick="checkLogin()" class="btn-primary full-width login-btn">
                    <span>Unlock System</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
            <div class="login-footer">
                <a href="#" onclick="openResetModal()">Forgot Password?</a>
            </div>
        </div>
    </div>

    <!-- Reset Password Modal -->
    <div id="reset-password-modal" class="modal">
        <div class="modal-content glass-panel" style="max-width: 400px;">
            <div class="modal-header">
                <h2>Reset Password</h2>
                <button class="close-btn" onclick="closeModal('reset-password-modal')">&times;</button>
            </div>
            <div class="form-group mt-4">
                <label>Admin Date of Birth (Security Check)</label>
                <input type="date" id="reset-dob" required onkeyup="if(event.key==='Enter') handlePasswordReset()">
            </div>
            <div id="password-reset-fields" class="force-hidden">
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" id="new-password" placeholder="Enter new password..." onkeyup="if(event.key==='Enter') handlePasswordReset()">
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" id="confirm-new-password" placeholder="Confirm new password..." onkeyup="if(event.key==='Enter') handlePasswordReset()">
                </div>
            </div>
            <button id="reset-action-btn" class="btn-success full-width mt-4" onclick="handlePasswordReset()">Verify Date of Birth</button>
        </div>
    </div>

    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar glass-panel">
            <div class="logo" style="padding: 10px; display: flex; justify-content: center; align-items: center;">
                <img src="logo.jpg" alt="Anokhi Restaurant" style="max-width: 100%; height: auto; border-radius: 8px; background: white; padding: 4px;">
            </div>
            <nav>
                <a href="#" class="nav-item active" data-target="dashboard" onclick="window.showView('dashboard'); return false;">
                    <i class="fa-solid fa-chart-pie"></i> <span>Dashboard</span>
                </a>
                <a href="#" class="nav-item" data-target="pos" onclick="window.showView('pos'); return false;">
                    <i class="fa-solid fa-cash-register"></i> <span>New Sale</span>
                </a>
                <a href="#" class="nav-item" data-target="history" onclick="window.showView('history'); return false;">
                    <i class="fa-solid fa-clock-rotate-left"></i> <span>Sales History</span>
                </a>
                <a href="#" class="nav-item" data-target="inventory" onclick="window.showView('inventory'); return false;">
                    <i class="fa-solid fa-boxes-stacked"></i> <span>Inventory</span>
                </a>
                <a href="#" class="nav-item" data-target="expenses" onclick="window.showView('expenses'); return false;">
                    <i class="fa-solid fa-wallet"></i> <span>Expenses</span>
                </a>
                <a href="#" class="nav-item" data-target="settings" onclick="window.showView('settings'); return false;">
                    <i class="fa-solid fa-gear"></i> <span>Settings</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Dashboard View -->
            <section id="dashboard" class="view-section active">
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 0;">
                    <!-- Today Sale Card -->
                    <div class="glass-panel" style="padding: 12px 20px; border-left: 4px solid #6366f1; background: rgba(99, 102, 241, 0.05); cursor: pointer; position: relative;" onclick="if(window.downloadTodaySalesReport) window.downloadTodaySalesReport()">
                        <div style="position: absolute; top: 12px; right: 15px; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 18px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <i class="fa-solid fa-file-pdf"></i>
                        </div>
                        <h3 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #818cf8; margin-bottom: 4px;">Today Sales</h3>
                        <p id="today-revenue-card" style="font-size: 28px; font-weight: 800; color: white; margin: 0;">₹0</p>
                        <div style="font-size: 12px; margin-top: 8px; color: var(--text-secondary); display: flex; gap: 12px;">
                            <span><i class="fa-solid fa-money-bill-wave" style="color:#22c55e;"></i> <span id="today-cash-card">₹0</span></span>
                            <span><i class="fa-brands fa-google-pay" style="color:#818cf8;"></i> <span id="today-upi-card">₹0</span></span>
                        </div>
                    </div>

                    <!-- Today Profit/Loss Card -->
                    <div class="glass-panel" id="profit-card-wrapper" style="padding: 12px 20px; border-left: 4px solid #22c55e; background: rgba(34, 197, 94, 0.05); cursor: pointer; position: relative;" onclick="if(window.downloadProfitReport) window.downloadProfitReport()">
                        <div style="position: absolute; top: 12px; right: 15px; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 18px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <i class="fa-solid fa-file-pdf"></i>
                        </div>
                        <h3 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #22c55e; margin-bottom: 4px;">Today Profit & Loss</h3>
                        <p id="today-profit-card" style="font-size: 28px; font-weight: 800; color: #22c55e; margin: 0;">₹0</p>
                        <div style="font-size: 11px; margin-top: 8px; color: var(--text-secondary);">Today Sales - Today Expenses</div>
                    </div>

                    <!-- Today Expense Card -->
                    <div class="glass-panel" style="padding: 12px 20px; border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05); cursor: pointer; position: relative;" onclick="if(window.downloadTodayExpensesReport) window.downloadTodayExpensesReport()">
                        <div style="position: absolute; top: 12px; right: 15px; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 18px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <i class="fa-solid fa-file-pdf"></i>
                        </div>
                        <h3 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #ef4444; margin-bottom: 4px;">Today Expenses</h3>
                        <p id="today-expense-card" style="font-size: 28px; font-weight: 800; color: white; margin: 0;">₹0</p>
                        <div style="font-size: 11px; margin-top: 8px; color: var(--text-secondary);">Total expenses recorded today</div>
                    </div>
                </div>

                <div class="recent-activity glass-panel mt-4">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h2 style="margin: 0;">Recent Sales</h2>
                        <div class="search-bar" style="margin: 0; max-width: 250px; position: relative;">
                            <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 14px;"></i>
                            <input type="text" id="dashboard-dues-search" placeholder="Search dues person..." oninput="window.renderHistory()" style="width: 100%; padding: 8px 35px 8px 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 13px;">
                            <i class="fa-solid fa-circle-xmark clear-input-btn" onclick="window.clearInput('dashboard-dues-search')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.4); font-size: 14px;"></i>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="recent-sales-table">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Sr No.</th>
                                    <th>Order ID</th>
                                    <th>Date & Time</th>
                                    <th>Items Details</th>
                                    <th onclick="window.togglePaymentFilter('CASH', 'dashboard')" style="cursor: pointer; user-select: none;" id="dashboard-th-cash" title="Click to filter by Cash">Cash <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i></th>
                                    <th onclick="window.togglePaymentFilter('UPI', 'dashboard')" style="cursor: pointer; user-select: none;" id="dashboard-th-upi" title="Click to filter by UPI">UPI <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i></th>
                                    <th onclick="window.togglePaymentFilter('DUES', 'dashboard')" style="cursor: pointer; user-select: none;" id="dashboard-th-dues" title="Click to filter by Dues">Dues <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i></th>
                                    <th>Total Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="sales-tbody">
                                <!-- Dynamic content -->
                            </tbody>
                        </table>
                    </div>
                    <div id="dashboard-sales-pagination"></div>
                </div>
            </section>

            <!-- Inventory View -->
            <section id="inventory" class="view-section">
                <header>
                    <div class="flex-between" style="margin-bottom: 15px;">
                        <div>
                            <h1>Inventory Management</h1>
                            <p>Manage your ingredients and products</p>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                            <div class="search-bar" style="margin: 0; max-width: 200px; position: relative; display: flex; align-items: center;">
                                <i class="fa-solid fa-search" style="position: absolute; left: 12px; color: var(--text-secondary); font-size: 14px;"></i>
                                <input type="text" id="inventory-search" placeholder="Search items..." oninput="window.renderInventory()" style="width: 100%; padding: 10px 35px 10px 32px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 14px;">
                                <i class="fa-solid fa-circle-xmark clear-input-btn" onclick="window.clearInput('inventory-search')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.4); font-size: 16px; transition: all 0.2s ease;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='rgba(255,255,255,0.4)'"></i>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <button id="filter-all" onclick="filterInventoryByType('all')" style="padding:6px 14px; border-radius:20px; border:2px solid var(--accent-color); background:var(--accent-color); color:white; cursor:pointer; font-size:12px; font-weight:700;">All</button>
                                <button id="filter-veg" onclick="filterInventoryByType('veg')" style="padding:6px 14px; border-radius:20px; border:2px solid #22c55e; background:transparent; color:#22c55e; cursor:pointer; font-size:12px; font-weight:700;">&#9632; Veg</button>
                                <button id="filter-nonveg" onclick="filterInventoryByType('nonveg')" style="padding:6px 14px; border-radius:20px; border:2px solid #ef4444; background:transparent; color:#ef4444; cursor:pointer; font-size:12px; font-weight:700;">&#9632; Non-Veg</button>
                            </div>
                            <button class="btn-primary" onclick="openAddItemModal()" style="padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700; height: auto;">
                                <i class="fa-solid fa-plus"></i> Add New Item
                            </button>
                        </div>
                    </div>
                    
                    <!-- Single Integrated Stock Summary Card -->
                    <div class="glass-panel" style="display: flex; justify-content: space-around; align-items: center; padding: 15px 20px; border-left: 4px solid var(--accent-color); border-radius: 12px; background: rgba(99, 102, 241, 0.05);">
                        <div style="text-align: center; cursor: pointer; flex: 1;" onclick="window.showStockList('total')">
                            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;"><i class="fa-solid fa-boxes-stacked"></i> Total Stock</div>
                            <div id="inv-total-count" style="font-size: 28px; font-weight: 800; color: white; margin-top: 5px;">0</div>
                        </div>
                        <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.1);"></div>
                        <div style="text-align: center; cursor: pointer; flex: 1;" onclick="window.showStockList('low')">
                            <div style="font-size: 11px; color: var(--warning-color); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock</div>
                            <div id="inv-low-count" style="font-size: 28px; font-weight: 800; color: var(--warning-color); margin-top: 5px;">0</div>
                        </div>
                        <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.1);"></div>
                        <div style="text-align: center; cursor: pointer; flex: 1;" onclick="window.showStockList('out')">
                            <div style="font-size: 11px; color: var(--danger-color); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;"><i class="fa-solid fa-circle-exclamation"></i> Out of Stock</div>
                            <div id="inv-out-count" style="font-size: 28px; font-weight: 800; color: var(--danger-color); margin-top: 5px;">0</div>
                        </div>
                    </div>
                </header>
                <div class="glass-panel mt-4">
                    <div class="table-container">
                        <table id="inventory-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"><input type="checkbox" id="inventory-select-all" onclick="window.toggleSelectAllInventory(this)"></th>
                                    <th style="width: 50px;">Sr No.</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Price (₹)</th>
                                    <th>Stock</th>
                                    <th>Min Stock</th>
                                    <th style="width: 120px;">
                                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                            Actions
                                            <button id="delete-selected-btn" onclick="window.deleteSelectedInventory()" class="btn-danger force-hidden" style="padding: 4px 8px; font-size: 12px; border-radius: 4px;" title="Delete Selected Items">
                                                <i class="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="inventory-tbody">
                                <!-- Dynamic content -->
                            </tbody>
                        </table>
                    </div>
                    <div id="inventory-pagination"></div>
                </div>
            </section>

            <!-- Expenses View -->
            <section id="expenses" class="view-section">
                <header class="flex-between">
                    <div>
                        <h1 style="margin: 0; font-size: 24px;">Business Expenses</h1>
                        <p style="margin: 5px 0 0; color: var(--text-secondary); font-size: 13px;">Manage your daily business expenses and cash flow</p>
                    </div>
                </header>

                <style>
                    #expense-form-container {
                        background: #FDF9F1 !important; /* Soft Cream */
                        color: #2D3748 !important;
                        border: 1px solid #E2E8F0 !important;
                    }
                    #expense-form-container label {
                        color: #4A5568 !important;
                        font-weight: 600;
                    }
                    #expense-form-container input, #expense-form-container textarea {
                        background: #FFFFFF !important;
                        color: #1A202C !important;
                        border: 1px solid #CBD5E0 !important;
                    }
                    #expense-form-container input::placeholder, #expense-form-container textarea::placeholder {
                        color: #A0AEC0 !important;
                    }
                    /* Floating label overrides */
                    #expense-form-container .input-group-floating label {
                        color: #718096 !important;
                        background: transparent !important;
                        text-shadow: none !important;
                    }
                    #expense-form-container .input-group-floating input:focus + label,
                    #expense-form-container .input-group-floating input:not(:placeholder-shown) + label {
                        background: #FFFFFF !important;
                        color: #2D3748 !important;
                        padding: 0 4px !important;
                    }
                    /* Suggestions panel */
                    #expense-form-container .suggestions-panel {
                        background: #FFFFFF !important;
                        color: #1A202C !important;
                        border: 1px solid #E2E8F0 !important;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
                    }
                    #expense-form-container .suggestion-item {
                        color: #1A202C !important;
                        border-bottom: 1px solid #E2E8F0 !important;
                    }
                    #expense-form-container .suggestion-item:hover {
                        background: #EDF2F7 !important;
                        color: #1A202C !important;
                    }
                    #expense-form-container .clear-dropdown-btn, #expense-form-container .dropdown-arrow, #expense-form-container .clear-input-btn {
                        color: #A0AEC0 !important;
                    }
                    #expense-form-container .clear-dropdown-btn:hover, #expense-form-container .clear-input-btn:hover {
                        color: #4A5568 !important;
                    }
                </style>
                <div id="expense-form-container" class="glass-panel mt-4" style="padding: 24px;">
                    <form id="expense-form" class="expense-entry-form">
                        <div class="expense-entry-layout" style="display: flex; flex-direction: column; gap: 20px;">
                            <!-- Top Row -->
                            <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-end;">
                                <div class="form-group" style="flex: 2; min-width: 150px;">
                                    <label>Main Category</label>
                                    <div class="input-wrapper searchable-dropdown" id="main-cat-container">
                                        <input type="text" id="expense-main-cat" placeholder="Select or type category..." oninput="handleSearchableInput('expense-main-cat', 'main-suggestions')" onfocus="showSuggestions('expense-main-cat', 'main-suggestions')" required style="width:100%; padding: 10px 35px 10px 12px; background: var(--panel-bg); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 8px; font-size: 14px;">
                                        <i class="fa-solid fa-xmark clear-dropdown-btn" onclick="clearSearchableInput('expense-main-cat', 'main-suggestions')" title="Clear"></i>
                                        <i class="fa-solid fa-chevron-down dropdown-arrow" onclick="toggleSuggestions('expense-main-cat', 'main-suggestions')"></i>
                                        <div id="main-suggestions" class="suggestions-panel hidden"></div>
                                    </div>
                                </div>
                                <div class="form-group" style="flex: 2; min-width: 150px;">
                                    <label>Sub Category</label>
                                    <div class="input-wrapper searchable-dropdown" id="sub-cat-container">
                                        <input type="text" id="expense-sub-cat" placeholder="Select or type sub-category..." oninput="handleSearchableInput('expense-sub-cat', 'sub-suggestions')" onfocus="showSuggestions('expense-sub-cat', 'sub-suggestions')" required style="width:100%; padding: 10px 35px 10px 12px; background: var(--panel-bg); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 8px; font-size: 14px;">
                                        <i class="fa-solid fa-xmark clear-dropdown-btn" onclick="clearSearchableInput('expense-sub-cat', 'sub-suggestions')" title="Clear"></i>
                                        <i class="fa-solid fa-chevron-down dropdown-arrow" onclick="toggleSuggestions('expense-sub-cat', 'sub-suggestions')"></i>
                                        <div id="sub-suggestions" class="suggestions-panel hidden"></div>
                                    </div>
                                </div>
                                <div class="form-group" id="expense-qty-container" style="flex: 1; max-width: 120px; min-width: 80px;">
                                    <label>Quantity</label>
                                    <input type="number" id="expense-qty" placeholder="Qty" min="0" step="any" style="width:100%; padding: 10px 12px; background: var(--panel-bg); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 8px; font-size: 14px;">
                                </div>
                                <!-- Floating Label Expense Fields -->
                                <div class="expense-payment-row" style="display: flex; gap: 10px; flex: 3; min-width: 250px;">
                                    <div class="input-group-floating" style="flex: 1; position: relative;">
                                        <input type="number" id="expense-cash" placeholder=" " min="0" step="0.01" style="padding-right: 30px;">
                                        <label for="expense-cash">Cash</label>
                                        <i class="fa-solid fa-circle-xmark clear-input-btn" onclick="window.clearInput('expense-cash')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.3); font-size: 14px; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='rgba(255,255,255,0.3)'"></i>
                                    </div>
                                    <div class="input-group-floating" style="flex: 1; position: relative;">
                                        <input type="number" id="expense-upi" placeholder=" " min="0" step="0.01" style="padding-right: 30px;">
                                        <label for="expense-upi">UPI</label>
                                        <i class="fa-solid fa-circle-xmark clear-input-btn" onclick="window.clearInput('expense-upi')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.3); font-size: 14px; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='rgba(255,255,255,0.3)'"></i>
                                    </div>
                                    <div class="input-group-floating" style="flex: 1; position: relative;">
                                        <input type="number" id="expense-udhar" placeholder=" " min="0" step="0.01" style="padding-right: 30px;">
                                        <label for="expense-udhar">Udhar</label>
                                        <i class="fa-solid fa-circle-xmark clear-input-btn" onclick="window.clearInput('expense-udhar')" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.3); font-size: 14px; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='rgba(255,255,255,0.3)'"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Second Row -->
                            <div style="display: flex; gap: 15px;">
                                <div class="form-group" id="expense-sell-price-container" style="flex: 1; max-width: 200px;">
                                    <label>Selling Price (₹)</label>
                                    <input type="number" id="expense-sell-price" placeholder="For new/updated item" min="0" step="any" style="width:100%; padding: 10px 12px; background: var(--panel-bg); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 8px; font-size: 14px;">
                                </div>
                            </div>
                        </div>
                        <div class="form-group mt-2">
                            <label>Description / Remarks (Reason)</label>
                            <textarea id="expense-desc" placeholder="Enter reason for expense..." style="width: 100%; min-height: 80px; padding: 12px; border-radius: 8px; border: 1px solid var(--panel-border); background: rgba(0,0,0,0.3); color: white;"></textarea>
                        </div>
                        <button type="submit" class="btn-primary mt-2" style="width: 200px; height: 48px;">
                            <i class="fa-solid fa-plus"></i> Add Expense
                        </button>
                    </form>
                </div>

                <div class="glass-panel mt-4">
                    <h2 style="padding: 20px 20px 0 20px; font-size: 18px;">Expense History</h2>
                    <div class="table-container">
                        <table id="expenses-table">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Sr No.</th>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Sub-Category</th>
                                    <th>Amount</th>
                                    <th>Mode</th>
                                    <th>Reason</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="expenses-tbody">
                                <!-- Dynamic content -->
                            </tbody>
                        </table>
                    </div>
                    <div id="expenses-pagination"></div>
                </div>
            </section>

            <!-- POS View -->
            <section id="pos" class="view-section">
                <div class="pos-layout">
                    <!-- Left Pane: Tables + Items -->
                    <div class="pos-left-pane">
                        <div id="tables-curtain-area" class="tables-collapsed">
                            <div class="tables-section glass-panel table-grid-compact" id="pos-tables-container">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                    <h2 style="font-size: 14px;"><i class="fa-solid fa-chair"></i> Tables</h2>
                                    <div style="display: flex; gap: 10px; font-size: 10px; color: var(--text-secondary);">
                                        <span><span class="bullet" style="background:#22c55e; width:8px; height:8px;"></span> Ready</span>
                                        <span><span class="bullet" style="background:#ef4444; width:8px; height:8px;"></span> In Use</span>
                                    </div>
                                </div>
                                <!-- Table cards injected here -->
                            </div>
                        </div>

                        <!-- Active Pending Orders (Takeaway/Counter) -->
                        <div id="active-orders-section" class="glass-panel mt-2" style="padding: 10px 15px; border-top: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <h2 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--accent-color);"><i class="fa-solid fa-clock-rotate-left"></i> Pending Bill</h2>
                                <span style="font-size: 9px; color: var(--text-secondary); text-transform: uppercase;">Scroll Horizontal <i class="fa-solid fa-arrow-right"></i></span>
                            </div>
                            <div id="active-orders-list" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: thin;">
                                <!-- Active orders injected here as horizontal cards -->
                            </div>
                        </div>

                        <div class="pos-items glass-panel" style="position: relative; padding-top: 25px;">
                            <!-- Tables Toggle Arrow (Absolute Top Center) -->
                            <div id="tables-curtain-toggle-btn" class="tables-curtain-toggle top-center-toggle" onclick="toggleTablesCurtain()" style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); z-index: 500; cursor: pointer;">
                                <i id="tables-curtain-icon" class="fa-solid fa-chevron-up" style="color: var(--accent-color); font-size: 16px;"></i>
                            </div>

                            <!-- Integrated Header Row: Search + Filters -->
                            <div class="items-header-row" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; position: relative; z-index: 1000;">
                                <!-- Search Bar (Left) -->
                                <div class="search-bar" style="margin: 0; position: relative; display: flex; align-items: center; flex: 1; max-width: 250px;">
                                    <i class="fa-solid fa-search" style="position: absolute; left: 12px; color: var(--text-secondary); font-size: 14px;"></i>
                                    <input type="text" id="pos-search" placeholder="Search menu items..." oninput="window.renderPOSItems()" style="width: 100%; padding: 10px 35px 10px 32px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 14px;">
                                    <i class="fa-solid fa-circle-xmark clear-input-btn" onclick="window.clearInput('pos-search')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.4); font-size: 16px; transition: all 0.2s ease;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='rgba(255,255,255,0.4)'"></i>
                                </div>

                                <!-- Filters (Right) -->
                                <div id="pos-filter-container" style="display: flex; gap: 4px; flex: 1; justify-content: flex-end; position: relative; z-index: 9999;">
                                    <button data-type="all" onclick="setPOSFilter('all')" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--accent-color); background: var(--accent-color); color: white; cursor: pointer; font-size: 11px; font-weight: 700;">All</button>
                                    <button data-type="veg" onclick="setPOSFilter('veg')" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #22c55e; background: transparent; color: #22c55e; cursor: pointer; font-size: 11px; font-weight: 700;">Veg</button>
                                    <button data-type="nonveg" onclick="setPOSFilter('nonveg')" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #ef4444; background: transparent; color: #ef4444; cursor: pointer; font-size: 11px; font-weight: 700;">Non-Veg</button>
                                </div>
                            </div>
                            <div class="item-grid pos-grid-shared" id="pos-item-grid">
                                <!-- Dynamic items -->
                            </div>
                        </div>
                    </div>

                    <!-- Right Pane: Order Type + Cart -->
                    <div class="pos-right-pane" style="display: flex; flex-direction: column; gap: 10px;">
                        <div id="order-type-container" class="order-type-container" style="min-height: 45px; z-index: 1000;"></div>

                        <div class="pos-cart glass-panel">
                            <!-- Hidden elements to maintain JS compatibility -->
                            <div id="dine-in-table-info" style="display: none;">
                                <span id="current-table-name"></span>
                            </div>


                            <div class="cart-items-container" style="position: relative; flex: 2.5; display: flex; flex-direction: column; min-height: 0;">
                                <div class="cart-items-modern" id="cart-items-modern">

                                    <!-- Dynamic content -->
                                </div>
                                <div class="curtain-toggle" onclick="toggleCartDetails()" title="Expand/Collapse Details">
                                    <i id="curtain-icon" class="fa-solid fa-chevron-up"></i>
                                </div>
                            </div>

                            <div class="cart-summary">
                                 <!-- Collapsible Curtain Details -->
                                 <div id="cart-details-curtain" class="cart-details-curtain">
                                     <div class="summary-row">
                                         <span>Subtotal</span>
                                         <span id="cart-subtotal">₹0.00</span>
                                     </div>
                                     <div class="discount-container" style="display: flex; gap: 8px; margin-bottom: 10px; margin-top: 5px;">
                                         <div class="input-group-floating" style="flex: 1; position: relative;">
                                             <input type="number" id="cart-discount-percent" min="0" max="100" oninput="calculateTotal()" placeholder=" ">
                                             <label for="cart-discount-percent">Discount %</label>
                                             <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('cart-discount-percent')" style="right: 12px; top: 50%; transform: translateY(-50%);"></i>
                                         </div>
                                         <div class="input-group-floating" style="flex: 1; position: relative;">
                                             <input type="number" id="cart-discount-fixed" min="0" oninput="calculateTotal()" placeholder=" ">
                                             <label for="cart-discount-fixed">Discount ₹</label>
                                             <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('cart-discount-fixed')" style="right: 12px; top: 50%; transform: translateY(-50%);"></i>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 <div id="round-off-row" class="summary-row">
                                     <span>Round Off</span>
                                     <span id="cart-roundoff">+₹0.00</span>
                                 </div>

                                 <!-- Always Visible Total -->
                                 <div class="summary-row total" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                                     <div style="display: flex; align-items: baseline; gap: 8px; flex: 1;">
                                         <span id="cart-total-label" style="font-weight: 800;">Total</span>
                                         <span id="total-table-indicator" style="font-size: 0.75em; color: var(--accent-color); font-weight: 700; background: rgba(99, 102, 241, 0.1); padding: 1px 6px; border-radius: 4px;"></span>
                                     </div>
                                     <span id="cart-total" style="flex: 0 0 auto; text-align: right; font-size: 1.2em; font-weight: 800;">₹0</span>
                                 </div>
                                 <div id="dues-row" class="summary-row" style="display: none; color: var(--danger-color); font-weight: 700; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 5px; margin-top: 5px;">
                                     <span>Dues (Baki)</span>
                                     <span id="cart-dues">₹0.00</span>
                                 </div>
                                 
                                 <!-- Previously Paid (For Edits) -->
                                 <div id="prev-paid-row" class="summary-row" style="display: none; margin-top: -8px; font-size: 14px; font-weight: 600; color: var(--success-color);">
                                     <span>Previously Paid</span>
                                     <span id="cart-prev-paid">₹0.00</span>
                                 </div>
                            </div>

                                <div id="refund-info" style="display: none; margin-top: 10px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid var(--success-color); text-align: center;">
                                    <span style="color: var(--success-color); font-size: 14px; font-weight: 700;">Refund: <span id="refund-amount-display">₹0</span></span>
                                </div>
                                
                                <div class="payment-input-container" style="margin-top: 5px;">
                                    <div class="input-group-floating" style="position: relative;">
                                        <input type="number" id="pay-cash-amount" min="0" oninput="calculateDues()" onfocus="window.autoFillPayment('cash')" placeholder=" " required>
                                        <label for="pay-cash-amount">Cash</label>
                                        <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('pay-cash-amount')" style="right: 12px; top: 50%; transform: translateY(-50%);"></i>
                                    </div>
                                    <div class="input-group-floating" style="position: relative;">
                                        <input type="number" id="pay-upi-amount" min="0" oninput="calculateDues()" onfocus="window.autoFillPayment('upi')" placeholder=" " required>
                                        <label for="pay-upi-amount">UPI</label>
                                        <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('pay-upi-amount')" style="right: 12px; top: 50%; transform: translateY(-50%);"></i>
                                    </div>
                                </div>
                                <div class="pos-action-buttons" style="display: flex; gap: 8px; margin-top: 2px;">
                                    <button id="dine-in-advance-btn" class="btn-primary" style="background: var(--warning-color); border: none; padding: 10px 5px; font-size: 11px; flex: 1; display: none;" onclick="openAdvanceModal()" title="Shortcut: F4">
                                        <i class="fa-solid fa-hand-holding-dollar"></i> Adv [F4]
                                    </button>
                                    <button id="btn-hold-order" class="btn-primary" style="background: var(--accent-color); border: none; padding: 10px 5px; font-size: 11px; flex: 1;" onclick="holdOrder()" title="Shortcut: F8">
                                        <i class="fa-solid fa-clock"></i> Hold [F8]
                                    </button>
                                    <button id="btn-process-sale" class="btn-success" style="padding: 10px 5px; font-size: 11px; flex: 1.5;" onclick="processSale()" title="Shortcut: Enter">
                                        <i class="fa-solid fa-check"></i> Sale [Ent]
                                    </button>
                                    <button id="btn-delete-sale" class="btn-danger" style="display: none; padding: 10px 5px; font-size: 11px; flex: 1; background: #ef4444;" onclick="window.deleteSaleFromEdit()" title="Delete this sale">
                                        <i class="fa-solid fa-trash"></i> Del
                                    </button>
                                    <button id="btn-new-bill" class="btn-danger" style="padding: 10px 5px; font-size: 11px; flex: 1;" onclick="newBill()" title="Shortcut: Esc">
                                        <i class="fa-solid fa-xmark"></i> Can [Esc]
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
            </section>

            <!-- Settings View -->
            <section id="settings" class="view-section">
                <header>
                    <h1>System Settings</h1>
                    <p>Configure your restaurant layout and preferences</p>
                </header>
                
                <div class="settings-grid mt-4">
                    <!-- Table Configuration -->
                    <div id="table-config-widget" class="glass-panel p-4"></div>

                    <!-- Security Configuration -->
                    <div class="glass-panel p-4">
                        <h2 class="settings-title"><i class="fa-solid fa-shield-halved"></i> Security & Access</h2>
                        
                        <!-- Step 1: DOB Verification -->
                        <div id="settings-dob-section">
                            <div class="form-group">
                                <label>Admin Date of Birth (Security Check)</label>
                                <input type="date" id="settings-admin-dob">
                            </div>
                            <button class="btn-primary" onclick="verifySettingsDoB()">Verify Identity</button>
                        </div>

                        <!-- Step 2: Password Fields (Initially Hidden) -->
                        <div id="settings-password-section" class="force-hidden" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--panel-border);">
                            <div class="form-group">
                                <label>New Admin Password</label>
                                <input type="password" id="new-admin-password" placeholder="Enter new password">
                            </div>
                            <div class="form-group">
                                <label>Confirm Password</label>
                                <input type="password" id="confirm-admin-password" placeholder="Confirm new password">
                            </div>
                            <button class="btn-success" onclick="updateAdminPassword()">Update Password</button>
                        </div>
                        
                        <p class="settings-help mt-3">This password is required to access the system on startup.</p>
                    </div>

                    <!-- Data Management -->
                    <div id="data-management-widget" class="glass-panel mt-4 p-4"></div>
                </div>
            </section>

            <!-- History View -->
            <section id="history" class="view-section">
                <header style="margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%;">
                        <!-- Total Dues Card (Clickable to Filter) -->
                        <div class="glass-panel" onclick="toggleDuesFilter()" style="padding: 12px 20px; border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" id="dues-filter-card">
                            <h3 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #ef4444; margin-bottom: 4px;">Total Dues (Baki)</h3>
                            <p id="history-total-dues" style="font-size: 28px; font-weight: 800; color: #ef4444; margin: 0;">₹0</p>
                            <div id="dues-filter-status" style="font-size: 11px; margin-top: 8px; color: var(--text-secondary); background: rgba(239, 68, 68, 0.1); padding: 2px 8px; border-radius: 4px; display: inline-block;">Click to Filter Dues</div>
                        </div>
                        
                        <!-- Monthly Sale Card -->
                        <div class="glass-panel" onclick="if(window.downloadMonthSalesReport) window.downloadMonthSalesReport()" style="padding: 12px 20px; border-left: 4px solid var(--accent-color); cursor: pointer; transition: transform 0.2s; position: relative;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <div style="position: absolute; top: 12px; right: 15px; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 18px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                            <h3 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Month Sales</h3>
                            <p id="monthly-sale-total" style="font-size: 28px; font-weight: 800; color: white; margin: 0;">₹0</p>
                            <div style="display: flex; gap: 10px; font-size: 13px; margin-top: 8px; color: var(--text-secondary);">
                                <span><i class="fa-solid fa-money-bill-wave" style="color:var(--success-color);"></i> <span id="monthly-cash">₹0</span></span>
                                <span><i class="fa-brands fa-google-pay" style="color:#818cf8;"></i> <span id="monthly-upi">₹0</span></span>
                            </div>
                        </div>

                        <!-- Monthly Expenses Card -->
                        <div class="glass-panel" onclick="if(window.downloadMonthExpensesReport) window.downloadMonthExpensesReport()" style="padding: 12px 20px; border-left: 4px solid #f87171; cursor: pointer; transition: transform 0.2s; position: relative;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <div style="position: absolute; top: 12px; right: 15px; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 18px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                            <h3 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Month Expenses</h3>
                            <p id="monthly-expense-total" style="font-size: 28px; font-weight: 800; color: #f87171; margin: 0;">₹0</p>
                            <div style="font-size: 13px; margin-top: 8px; color: var(--text-secondary); font-weight: 600;">Total Spent This Month</div>
                        </div>

                        <!-- Monthly Profit Card -->
                        <div class="glass-panel" id="monthly-profit-card" onclick="if(window.downloadMonthProfitReport) window.downloadMonthProfitReport()" style="padding: 12px 20px; border-left: 4px solid #22c55e; cursor: pointer; transition: transform 0.2s; position: relative;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                            <div style="position: absolute; top: 12px; right: 15px; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 18px; border: 1px solid rgba(239, 68, 68, 0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <i class="fa-solid fa-file-pdf"></i>
                            </div>
                            <h3 style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Month Profit / Loss</h3>
                            <p id="monthly-profit-total" style="font-size: 28px; font-weight: 900; color: #22c55e; margin: 0;">₹0</p>
                            <div style="font-size: 13px; margin-top: 8px; color: var(--text-secondary); font-weight: 600;">Net Monthly Gain</div>
                        </div>
                    </div>
                </header>
                <!-- Sales Chart (Calendar) -->
                <div class="glass-panel mt-4">
                    <h2 style="padding: 20px; font-size: 18px; border-bottom: 1px solid var(--panel-border); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="toggleCalendarChart()">
                        <span>Sales Chart</span>
                        <i id="calendar-toggle-icon" class="fa-solid fa-chevron-down"></i>
                    </h2>
                    <div id="calendar-wrapper" style="padding: 20px; display: none;">
                        <!-- Calendar will go here -->
                    </div>
                </div>

                <!-- All Transactions with Date Filter & Report -->
                <div id="history-transactions-panel" class="glass-panel mt-4">
                    <div class="flex-between" style="padding: 15px 20px; border-bottom: 1px solid var(--panel-border); flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                            <h2 style="font-size: 18px; margin: 0;">All Transactions</h2>
                            <div class="search-bar" style="margin: 0; min-width: 250px; position: relative;">
                                <i class="fa-solid fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); font-size: 14px;"></i>
                                <input type="text" id="history-search" placeholder="Search order ID, customer..." oninput="window.renderHistory()" style="width: 100%; padding: 8px 35px 8px 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-size: 13px;">
                                <i class="fa-solid fa-circle-xmark clear-input-btn" onclick="window.clearInput('history-search')" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer; color: rgba(255,255,255,0.4); font-size: 14px;"></i>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 8px; border: 1px solid var(--panel-border);">
                                <label style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">From:</label>
                                <input type="date" id="history-start-date" onchange="window.renderHistory()" style="background: transparent; border: none; color: white; font-size: 13px; outline: none;">
                            </div>
                            <div style="display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 8px; border: 1px solid var(--panel-border);">
                                <label style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">To:</label>
                                <input type="date" id="history-end-date" onchange="window.renderHistory()" style="background: transparent; border: none; color: white; font-size: 13px; outline: none;">
                            </div>
                            <button onclick="window.downloadGrossReport()" style="padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; height: auto; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; cursor: pointer;">
                                <i class="fa-solid fa-file-pdf" style="font-size: 15px;"></i> Gross Report PDF
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table id="history-table">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">Sr No.</th>
                                    <th>Order ID</th>
                                    <th>Date & Time</th>
                                    <th>Items Details</th>
                                    <th onclick="window.togglePaymentFilter('CASH', 'history')" style="cursor: pointer; user-select: none;" id="history-th-cash" title="Click to filter by Cash">Cash <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i></th>
                                    <th onclick="window.togglePaymentFilter('UPI', 'history')" style="cursor: pointer; user-select: none;" id="history-th-upi" title="Click to filter by UPI">UPI <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i></th>
                                    <th onclick="window.togglePaymentFilter('DUES', 'history')" style="cursor: pointer; user-select: none;" id="history-th-dues" title="Click to filter by Dues">Dues <i class="fa-solid fa-filter" style="font-size: 10px; margin-left: 3px; opacity: 0.5;"></i></th>
                                    <th>Total Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="history-tbody">
                                <!-- Dynamic content -->
                            </tbody>
                        </table>
                    </div>
                    <div id="history-pagination"></div>
                </div>
            </section>
        </main>
    </div>

    <!-- Modals -->
    <div id="addItemModal" class="modal">
        <div class="modal-content glass-panel">
            <span class="close-btn" onclick="closeModal('addItemModal')">&times;</span>
            <h2 id="modal-title">Add New Item</h2>
            <form id="item-form" class="mt-4">
                <input type="hidden" id="item-id">
                <div class="form-group">
                    <label>Item Name</label>
                    <div class="input-wrapper">
                        <input type="text" id="item-name" list="item-name-list" required placeholder="e.g. Paneer Butter Masala">
                        <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('item-name')"></i>
                    </div>
                    <datalist id="item-name-list"><!-- populated dynamically --></datalist>
                </div>
                <div class="form-group">
                    <label style="margin-bottom: 8px; display: block;">Item Type</label>
                    <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 16px; border-radius: 8px; border: 2px solid #22c55e; background: rgba(34,197,94,0.1); font-weight: 600; font-size: 13px;">
                            <input type="radio" name="item-type" id="type-veg" value="Veg" checked style="accent-color: #22c55e; width: 16px; height: 16px;">
                            <span style="color: #22c55e;">&#9632; Veg</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 16px; border-radius: 8px; border: 2px solid #ef4444; background: rgba(239,68,68,0.1); font-weight: 600; font-size: 13px;">
                            <input type="radio" name="item-type" id="type-nonveg" value="Non-Veg" style="accent-color: #ef4444; width: 16px; height: 16px;">
                            <span style="color: #ef4444;">&#9632; Non-Veg</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <div class="input-wrapper">
                        <input type="text" id="item-category" list="category-list" required placeholder="Select or type category...">
                        <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('item-category')"></i>
                    </div>
                    <datalist id="category-list">
                        <option value="Main Course (Veg)">
                        <option value="Main Course (Non-Veg)">
                        <option value="Starters & Snacks">
                        <option value="Chinese">
                        <option value="Tandoori & Roti">
                        <option value="Sweets & Desserts">
                        <option value="Beverages & Drinks">
                        <option value="South Indian">
                        <option value="Bihari Thali">
                        <option value="Raw Material">
                    </datalist>
                </div>
                <div class="form-row" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px;">
                    <div class="input-group-floating">
                        <input type="number" id="item-price" required min="0" step="0.01" placeholder=" ">
                        <label for="item-price">Price (₹)</label>
                        <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('item-price')" style="right: 12px; top: 50%; transform: translateY(-50%);"></i>
                    </div>
                    <div class="input-group-floating">
                        <input type="number" id="item-quantity" required min="0" placeholder=" ">
                        <label for="item-quantity">Quantity in Stock</label>
                        <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('item-quantity')" style="right: 12px; top: 50%; transform: translateY(-50%);"></i>
                    </div>
                </div>
                <div class="form-group mt-3">
                    <div class="input-group-floating">
                        <input type="number" id="item-low-stock" required min="1" value="5" placeholder=" ">
                        <label for="item-low-stock">Low Stock Alert At (Min Quantity)</label>
                        <i class="fa-solid fa-xmark clear-input-btn" onclick="clearInput('item-low-stock')" style="right: 12px; top: 50%; transform: translateY(-50%);"></i>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button type="submit" id="submit-item-btn" class="btn-primary" style="flex: 2;">Save Item</button>
                    <button type="button" id="delete-item-modal-btn" class="btn-danger force-hidden" style="flex: 1;" onclick="handleModalDelete()">Delete</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Restock Modal -->
    <div id="restockModal" class="modal">
        <div class="modal-content glass-panel">
            <span class="close-btn" onclick="closeModal('restockModal')">&times;</span>
            <h2>Add Stock</h2>
            <form id="restock-form" class="mt-4">
                <input type="hidden" id="restock-item-id">
                <p id="restock-item-name" style="margin-bottom: 16px; font-weight: 600; color: var(--accent-color);">
                </p>
                <div class="form-group">
                    <label>Quantity to Add</label>
                    <input type="number" id="restock-quantity" required min="1" placeholder="e.g. 10">
                </div>
                <button type="submit" class="btn-primary full-width mt-2">Add to Inventory</button>
            </form>
        </div>
    </div>

    <!-- Receipt Modal -->
    <div id="receiptModal" class="modal" onclick="if(event.target === this) closeModal('receiptModal')">
        <div class="modal-content glass-panel receipt-content">
            <span class="close-btn" onclick="closeModal('receiptModal')">&times;</span>
            <h2 style="text-align: center;"><i class="fa-solid fa-circle-check"
                    style="color: var(--success-color);"></i> Sale Successful</h2>
            <div id="receipt-details" class="mt-4">
                <!-- Receipt logic -->
            </div>
            <button class="btn-primary full-width mt-4" onclick="closeModal('receiptModal')">Close</button>
        </div>
    </div>

    <!-- Stock List Modal -->
    <div id="stockListModal" class="modal">
        <div class="modal-content glass-panel">
            <span class="close-btn" onclick="closeModal('stockListModal')">&times;</span>
            <h2 id="stock-list-title">Items List</h2>
            <div class="table-container mt-4" style="max-height: 400px; overflow-y: auto; padding: 0;">
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Stock</th>
                        </tr>
                    </thead>
                    <tbody id="stock-list-tbody">
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Today's Sales Modal -->
    <div id="todaySalesModal" class="modal">
        <div class="modal-content glass-panel">
            <span class="close-btn" onclick="closeModal('todaySalesModal')">&times;</span>
            <h2>Today's Sale Items</h2>
            <div class="table-container mt-4" style="max-height: 400px; overflow-y: auto; padding: 0;">
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Qty Sold</th>
                            <th>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody id="today-sales-tbody">
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Table Grid Modal -->
    <div id="tableGridModal" class="modal">
        <div class="modal-content glass-panel" style="max-width: 800px;">
            <span class="close-btn" onclick="closeModal('tableGridModal'); renderCart(); renderTableGrid();">&times;</span>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Select Table (Dine-In)</h2>
                <div style="display: flex; gap: 15px; font-size: 12px;">
                    <span style="display: flex; align-items: center; gap: 5px;"><div style="width: 12px; height: 12px; border-radius: 3px; background: rgba(255,255,255,0.1); border: 1px solid var(--panel-border);"></div> Available</span>
                    <span style="display: flex; align-items: center; gap: 5px;"><div style="width: 12px; height: 12px; border-radius: 3px; background: rgba(16, 185, 129, 0.2); border: 1px solid var(--success-color);"></div> Occupied / Held</span>
                </div>
            </div>
            <div class="table-grid" id="table-grid-container">
                <!-- Dynamic tables -->
            </div>
        </div>
    </div>

    <!-- Advance Payment Modal -->
    <div id="advanceModal" class="modal">
        <div class="modal-content glass-panel" style="max-width: 400px;">
            <span class="close-btn" onclick="closeModal('advanceModal')">&times;</span>
            <h2>Record Advance Payment</h2>
            <p id="advance-table-name" style="margin: 10px 0; color: var(--accent-color); font-weight: 600;"></p>
            <div class="form-group mt-4">
                <label>Advance Amount (₹)</label>
                <input type="number" id="advance-amount-input" placeholder="Enter amount..." style="font-size: 20px; text-align: center; font-weight: 700;">
            </div>
            <div class="form-group">
                <label>Payment Mode</label>
                <select id="advance-payment-mode">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                </select>
            </div>
            <button class="btn-success full-width" onclick="saveAdvancePayment()">Confirm Advance</button>
        </div>
    </div>

    <!-- Customer Details Modal (For Dues/Credit) -->
    <div id="customerModal" class="modal">
        <div class="modal-content glass-panel" style="max-width: 400px;">
            <span class="close-btn" onclick="closeModal('customerModal')">&times;</span>
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 60px; height: 60px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <i class="fa-solid fa-user-pen" style="font-size: 24px; color: var(--warning-color);"></i>
                </div>
                <h2>Customer Details</h2>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 5px;">This sale has outstanding dues. Please enter customer details to continue.</p>
            </div>
            
            <div class="form-group">
                <label><i class="fa-solid fa-user"></i> Customer Name</label>
                <input type="text" id="cust-name" placeholder="Enter full name..." onkeyup="if(event.key === 'Enter') document.getElementById('cust-mobile').focus()">
            </div>
            <div class="form-group">
                <label><i class="fa-solid fa-phone"></i> Mobile Number</label>
                <input type="tel" id="cust-mobile" placeholder="Enter 10-digit mobile..." maxlength="10" onkeyup="if(event.key === 'Enter') completeCreditSale()">
            </div>
            
            <div id="dues-amount-notice" style="margin-bottom: 20px; padding: 12px; background: rgba(248, 113, 113, 0.1); border-radius: 8px; border: 1px solid rgba(248, 113, 113, 0.2); text-align: center;">
                <span style="color: #f87171; font-weight: 700; font-size: 16px;">Dues: <span id="modal-dues-amount">₹0</span></span>
            </div>
            
            <button class="btn-success full-width" onclick="completeCreditSale()" style="padding: 12px; font-weight: 700; font-size: 16px;">
                <i class="fa-solid fa-check-double"></i> Complete Sale
            </button>
        </div>
    </div>
    <!-- Admin Verification Modal (For sensitive actions) -->
    <div id="adminVerifyModal" class="modal">
        <div class="modal-content glass-panel" style="max-width: 400px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 60px; height: 60px; background: rgba(99, 102, 241, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <i class="fa-solid fa-shield-check" style="font-size: 24px; color: var(--accent-color);"></i>
                </div>
                <h2>Verify Identity</h2>
                <p id="admin-verify-msg" style="font-size: 13px; color: var(--text-secondary); margin-top: 5px;">Please enter admin password to confirm this action.</p>
            </div>
            <div class="form-group">
                <input type="password" id="admin-verify-password" placeholder="Enter Admin Password" style="font-size: 18px; text-align: center; font-weight: 700;" onkeyup="if(event.key === 'Enter') window.confirmAdminVerification()">
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-primary" style="flex: 1; background: var(--text-secondary);" onclick="closeModal('adminVerifyModal')">Cancel</button>
                <button class="btn-success" style="flex: 2;" onclick="window.confirmAdminVerification()">Confirm Action</button>
            </div>
        </div>
    </div>
`;