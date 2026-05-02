export function initSupabaseLogic() {
    const db = window.db;

    window.syncFromSupabase = async function() {
        if (!window.db && typeof window.reinitSupabase === 'function') {
            window.reinitSupabase();
        }
        const db = window.db;
        if (!db) { console.warn('Supabase unavailable, skipping sync.'); return; }
        try {
            const { data: invData } = await db.from('inventory').select('*');
            if (invData && invData.length > 0) {
                window.inventory = invData.map(i => ({
                    id: i.id,
                    name: i.name,
                    category: i.category,
                    itemType: i.item_type || 'Veg',
                    price: i.price,
                    quantity: i.quantity,
                    lowStockThreshold: i.low_stock_threshold || 5
                }));
                localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
            }

            // Fetch more records for accurate dashboard/monthly stats
            const { data: salesData } = await db.from('sales_history').select('*').order('date', { ascending: false }).limit(200);
            if (salesData) {
                window.salesHistory = salesData.map(s => ({
                    ...s,
                    paymentMode: s.payment_mode,
                    splitAmounts: s.split_amounts,
                    roundOff: s.round_off,
                    tableName: s.table_name,
                    advancePaid: s.advance_paid,
                    // dues should be calculated if not in DB, but let's assume it might be there or needs calculation
                    dues: s.dues || (parseFloat(s.total || 0) - parseFloat(s.advance_paid || 0)) // fallback if dues column missing
                }));
                localStorage.setItem('anokhi_sales', JSON.stringify(window.salesHistory));
            }

            const { data: tableData } = await db.from('tables').select('*');
            if (tableData && tableData.length > 0) {
                // Map db tables to local structure if needed
                window.tables = window.tables.map(t => {
                    const dbTable = tableData.find(dt => dt.id === t.id);
                    return dbTable ? { ...t, ...dbTable } : t;
                });
                localStorage.setItem('anokhi_tables', JSON.stringify(window.tables));
            }

            const { data: expData } = await db.from('expenses').select('*').order('date', { ascending: false }).limit(200);
            if (expData && expData.length > 0) {
                window.expensesHistory = expData;
                localStorage.setItem('anokhi_expenses', JSON.stringify(window.expensesHistory));
            }

            const { data: activeData } = await db.from('active_orders').select('*').order('created_at', { ascending: false });
            if (activeData && activeData.length > 0) {
                window.activeOrders = activeData.map(o => ({
                    id: o.id,
                    orderType: o.order_type,
                    items: o.items,
                    total: o.total,
                    discount: o.discount || 0,
                    roundOff: o.round_off || 0,
                    customerName: o.customer_name,
                    customerMobile: o.customer_mobile,
                    tableName: o.table_name,
                    createdAt: o.created_at
                }));
                localStorage.setItem('anokhi_active_orders', JSON.stringify(window.activeOrders));
            }

            // Re-render views safely
            if (typeof window.renderInventory === 'function') window.renderInventory();
            if (typeof window.renderPOSItems === 'function') window.renderPOSItems();
            if (typeof window.renderHistory === 'function') window.renderHistory();
            if (typeof window.renderTableGrid === 'function') window.renderTableGrid();
            if (typeof window.renderActiveOrders === 'function') window.renderActiveOrders();
            if (typeof window.renderExpenses === 'function') window.renderExpenses();
            if (typeof window.updateDashboard === 'function') window.updateDashboard();
            if (typeof window.updateExpenseStats === 'function') window.updateExpenseStats();
        } catch (err) {
            console.error('Sync Error:', err);
        }
    };

    // Supabase Realtime Setup
    function setupRealtime() {
        if (!db) {
            console.warn('Supabase DB not initialized, Realtime disabled.');
            return;
        }

        console.log('Initializing Supabase Realtime...');

        // 1. Inventory Realtime
        db.channel('inventory-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
                console.log('Realtime Inventory Update:', payload);
                const { eventType, new: newItem, old: oldItem } = payload;
                
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const mapped = {
                        id: newItem.id,
                        name: newItem.name,
                        category: newItem.category,
                        itemType: newItem.item_type || 'Veg',
                        price: newItem.price,
                        quantity: newItem.quantity,
                        lowStockThreshold: newItem.low_stock_threshold || 5
                    };
                    const idx = window.inventory.findIndex(i => i.id === mapped.id);
                    if (idx > -1) {
                        window.inventory[idx] = mapped;
                    } else {
                        window.inventory.push(mapped);
                    }
                } else if (eventType === 'DELETE') {
                    window.inventory = window.inventory.filter(i => i.id !== oldItem.id);
                }
                
                localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
                if (typeof window.renderInventory === 'function') window.renderInventory();
                if (typeof window.renderPOSItems === 'function') window.renderPOSItems();
                if (typeof window.updateDashboard === 'function') window.updateDashboard();
            })
            .subscribe();

        // 2. Tables Realtime
        db.channel('tables-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
                console.log('Realtime Tables Update:', payload);
                const { eventType, new: newTable } = payload;
                
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const idx = window.tables.findIndex(t => t.id === newTable.id);
                    if (idx > -1) {
                        window.tables[idx] = { 
                            ...window.tables[idx], 
                            id: newTable.id,
                            name: newTable.name,
                            cart: newTable.cart || [],
                            advance: newTable.advance || 0,
                            advanceMode: newTable.advance_mode || 'CASH'
                        };
                    } else {
                        window.tables.push({
                            id: newTable.id,
                            name: newTable.name,
                            cart: newTable.cart || [],
                            advance: newTable.advance || 0,
                            advanceMode: newTable.advance_mode || 'CASH'
                        });
                    }
                }
                
                localStorage.setItem('anokhi_tables', JSON.stringify(window.tables));
                if (typeof window.renderTableGrid === 'function') window.renderTableGrid();
                
                if (window.currentSelectedTable && window.currentSelectedTable.id === newTable.id) {
                    window.currentSelectedTable = window.tables.find(t => t.id === newTable.id);
                    window.cart = window.currentSelectedTable.cart || [];
                    if (typeof window.renderCart === 'function') window.renderCart();
                }
            })
            .subscribe();

        // 3. Sales History Realtime
        db.channel('sales-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_history' }, payload => {
                console.log('Realtime Sales Update:', payload);
                const { eventType, new: newSale, old: oldSale } = payload;
                
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const mapped = {
                        id: newSale.id,
                        date: newSale.date,
                        items: newSale.items,
                        total: newSale.total,
                        discount: newSale.discount,
                        roundOff: newSale.round_off,
                        paymentMode: newSale.payment_mode,
                        splitAmounts: newSale.split_amounts,
                        orderType: newSale.order_type,
                        tableName: newSale.table_name,
                        advancePaid: newSale.advance_paid
                    };
                    const idx = window.salesHistory.findIndex(s => s.id === mapped.id);
                    if (idx > -1) {
                        window.salesHistory[idx] = mapped;
                    } else {
                        window.salesHistory.unshift(mapped);
                    }
                } else if (eventType === 'DELETE') {
                    window.salesHistory = window.salesHistory.filter(s => s.id !== oldSale.id);
                }
                
                localStorage.setItem('anokhi_sales', JSON.stringify(window.salesHistory));
                if (typeof window.renderHistory === 'function') window.renderHistory();
                if (typeof window.updateDashboard === 'function') window.updateDashboard();
            })
            .subscribe();

        // 4. Expenses Realtime
        db.channel('expenses-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => {
                console.log('Realtime Expenses Update:', payload);
                const { eventType, new: newExpense, old: oldExpense } = payload;
                
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const idx = window.expensesHistory.findIndex(e => e.id === newExpense.id);
                    if (idx > -1) {
                        window.expensesHistory[idx] = newExpense;
                    } else {
                        window.expensesHistory.unshift(newExpense);
                    }
                } else if (eventType === 'DELETE') {
                    window.expensesHistory = window.expensesHistory.filter(e => e.id !== oldExpense.id);
                }
                
                localStorage.setItem('anokhi_expenses', JSON.stringify(window.expensesHistory));
                if (typeof window.renderExpenses === 'function') window.renderExpenses();
                if (typeof window.updateExpenseStats === 'function') window.updateExpenseStats();
                if (typeof window.updateDashboard === 'function') window.updateDashboard();
            })
            .subscribe();

        // 5. Active Orders Realtime
        db.channel('active-orders-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'active_orders' }, payload => {
                console.log('Realtime Active Orders Update:', payload);
                const { eventType, new: newOrder, old: oldOrder } = payload;
                
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const mapped = {
                        id: newOrder.id,
                        orderType: newOrder.order_type,
                        items: newOrder.items,
                        total: newOrder.total,
                        discount: newOrder.discount || 0,
                        roundOff: newOrder.round_off || 0,
                        customerName: newOrder.customer_name,
                        customerMobile: newOrder.customer_mobile,
                        createdAt: newOrder.created_at
                    };
                    const idx = window.activeOrders.findIndex(o => o.id === mapped.id);
                    if (idx > -1) window.activeOrders[idx] = mapped;
                    else window.activeOrders.unshift(mapped);
                } else if (eventType === 'DELETE') {
                    window.activeOrders = window.activeOrders.filter(o => o.id !== oldOrder.id);
                }
                
                localStorage.setItem('anokhi_active_orders', JSON.stringify(window.activeOrders));
                if (typeof window.renderActiveOrders === 'function') window.renderActiveOrders();
            })
            .subscribe();
    }

    window.saveData = async function() {
        localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
        localStorage.setItem('anokhi_sales', JSON.stringify(window.salesHistory));
        localStorage.setItem('anokhi_tables', JSON.stringify(window.tables));
        localStorage.setItem('anokhi_expenses', JSON.stringify(window.expensesHistory));
        localStorage.setItem('anokhi_active_orders', JSON.stringify(window.activeOrders));

        if (!db) return;
        try {
            if (window.inventory.length > 0) {
                await db.from('inventory').upsert(window.inventory.map(i => ({
                    id: i.id,
                    name: i.name,
                    category: i.category,
                    item_type: i.itemType || 'Veg',
                    price: i.price,
                    quantity: i.quantity,
                    low_stock_threshold: i.lowStockThreshold || 5
                })));
            }
            
            if (window.tables.length > 0) {
                await db.from('tables').upsert(window.tables.map(t => ({
                    id: t.id,
                    name: t.name,
                    cart: t.cart,
                    advance: t.advance,
                    advance_mode: t.advanceMode
                })));
            }

            if (window.activeOrders && window.activeOrders.length > 0) {
                await db.from('active_orders').upsert(window.activeOrders.map(o => ({
                    id: o.id,
                    order_type: o.orderType,
                    items: o.items,
                    total: o.total,
                    discount: o.discount,
                    round_off: o.roundOff,
                    customer_name: o.customerName,
                    customer_mobile: o.customer_mobile,
                    table_name: o.tableName,
                    created_at: o.createdAt
                })));
            }

            if (window.salesHistory && window.salesHistory.length > 0) {
                await db.from('sales_history').upsert(window.salesHistory.map(s => ({
                    id: s.id,
                    date: s.date,
                    items: s.items,
                    total: s.total,
                    discount: s.discount || 0,
                    round_off: s.roundOff || 0,
                    payment_mode: s.paymentMode,
                    split_amounts: s.splitAmounts,
                    order_type: s.orderType,
                    table_name: s.tableName,
                    table_id: s.tableId,
                    advance_paid: s.advancePaid || 0,
                    customer_name: s.customerName,
                    customer_mobile: s.customerMobile,
                    dues: s.dues || 0
                })));
            }

            if (window.expensesHistory && window.expensesHistory.length > 0) {
                await db.from('expenses').upsert(window.expensesHistory.map(e => ({
                    id: e.id,
                    date: e.date,
                    main_category: e.main_category,
                    sub_category: e.sub_category,
                    amount: e.amount,
                    payment_mode: e.payment_mode,
                    description: e.description
                })));
            }
    };

    // Auto-sync on init
    if (typeof window.syncFromSupabase === 'function') {
        window.syncFromSupabase().then(() => {
            setupRealtime();
        });
    }
}
