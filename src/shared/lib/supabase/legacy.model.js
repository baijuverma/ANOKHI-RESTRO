export function initSupabaseLogic() {
window.syncFromSupabase = async function() {
    if (!db) { console.warn('Supabase unavailable, skipping sync.'); return; }
    try {
        const { data: invData } = await db.from('inventory').select('*');
        if (invData && invData.length > 0) {
            inventory = invData.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                itemType: i.item_type || 'Veg',
                price: i.price,
                quantity: i.quantity,
                lowStockThreshold: i.low_stock_threshold || 5
            }));
            localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
        }

        // Fetch only the latest 20 sales initially for better performance
        const { data: salesData } = await db.from('sales_history').select('*').order('date', { ascending: false }).range(0, 19);
        if (salesData) {
            salesHistory = salesData;
            localStorage.setItem('anokhi_sales', JSON.stringify(salesHistory));
        }

        const { data: tableData } = await db.from('tables').select('*');
        if (tableData && tableData.length > 0) {
            // Map db tables to local structure if needed
            tables = tables.map(t => {
                const dbTable = tableData.find(dt => dt.id === t.id);
                return dbTable ? { ...t, ...dbTable } : t;
            });
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
    localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
        }

        const { data: expData } = await db.from('expenses').select('*').order('date', { ascending: false });
        if (expData && expData.length > 0) {
            expensesHistory = expData;
            localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
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
        if (typeof renderInventory === 'function') renderInventory();
        if (typeof renderPOSItems === 'function') renderPOSItems();
        if (typeof renderHistory === 'function') renderHistory();
        if (typeof renderTableGrid === 'function') renderTableGrid();
        if (typeof renderActiveOrders === 'function') renderActiveOrders();
        if (typeof renderExpenses === 'function') renderExpenses();
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof updateExpenseStats === 'function') updateExpenseStats();
    } catch (err) {
        console.error('Sync Error:', err);
    }
}

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
                const idx = inventory.findIndex(i => i.id === mapped.id);
                if (idx > -1) {
                    inventory[idx] = mapped;
                } else {
                    inventory.push(mapped);
                }
            } else if (eventType === 'DELETE') {
                inventory = inventory.filter(i => i.id !== oldItem.id);
            }
            
            localStorage.setItem('anokhi_inventory', JSON.stringify(inventory));
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderPOSItems === 'function') renderPOSItems();
            if (typeof updateDashboard === 'function') updateDashboard();
        })
        .subscribe();

    // 2. Tables Realtime
    db.channel('tables-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, payload => {
            console.log('Realtime Tables Update:', payload);
            const { eventType, new: newTable } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const idx = tables.findIndex(t => t.id === newTable.id);
                if (idx > -1) {
                    tables[idx] = { 
                        ...tables[idx], 
                        id: newTable.id,
                        name: newTable.name,
                        cart: newTable.cart || [],
                        advance: newTable.advance || 0,
                        advanceMode: newTable.advance_mode || 'CASH'
                    };
                } else {
                    tables.push({
                        id: newTable.id,
                        name: newTable.name,
                        cart: newTable.cart || [],
                        advance: newTable.advance || 0,
                        advanceMode: newTable.advance_mode || 'CASH'
                    });
                }
            }
            
            localStorage.setItem('anokhi_tables', JSON.stringify(tables));
            if (typeof renderTableGrid === 'function') renderTableGrid();
            
            // If the table being edited is the current table, refresh its state
            if (window.currentSelectedTable && window.currentSelectedTable.id === newTable.id) {
                window.currentSelectedTable = tables.find(t => t.id === newTable.id);
                window.cart = window.currentSelectedTable.cart || [];
                if (typeof renderCart === 'function') renderCart();
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
                const idx = salesHistory.findIndex(s => s.id === mapped.id);
                if (idx > -1) {
                    salesHistory[idx] = mapped;
                } else {
                    salesHistory.unshift(mapped);
                }
            } else if (eventType === 'DELETE') {
                salesHistory = salesHistory.filter(s => s.id !== oldSale.id);
            }
            
            localStorage.setItem('anokhi_sales', JSON.stringify(salesHistory));
            if (typeof renderHistory === 'function') renderHistory();
            if (typeof updateDashboard === 'function') updateDashboard();
        })
        .subscribe();

    // 4. Expenses Realtime
    db.channel('expenses-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => {
            console.log('Realtime Expenses Update:', payload);
            const { eventType, new: newExpense, old: oldExpense } = payload;
            
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const idx = expensesHistory.findIndex(e => e.id === newExpense.id);
                if (idx > -1) {
                    expensesHistory[idx] = newExpense;
                } else {
                    expensesHistory.unshift(newExpense);
                }
            } else if (eventType === 'DELETE') {
                expensesHistory = expensesHistory.filter(e => e.id !== oldExpense.id);
            }
            
            localStorage.setItem('anokhi_expenses', JSON.stringify(expensesHistory));
            if (typeof renderExpenses === 'function') renderExpenses();
            if (typeof updateExpenseStats === 'function') updateExpenseStats();
            if (typeof updateDashboard === 'function') updateDashboard();
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
                const idx = activeOrders.findIndex(o => o.id === mapped.id);
                if (idx > -1) activeOrders[idx] = mapped;
                else activeOrders.unshift(mapped);
            } else if (eventType === 'DELETE') {
                activeOrders = activeOrders.filter(o => o.id !== oldOrder.id);
            }
            
            localStorage.setItem('anokhi_active_orders', JSON.stringify(activeOrders));
            if (typeof renderActiveOrders === 'function') renderActiveOrders();
        })
        .subscribe();
}
window.saveData = async function() {
    localStorage.setItem('anokhi_inventory', JSON.stringify(window.inventory));
    localStorage.setItem('anokhi_sales', JSON.stringify(window.salesHistory));
    localStorage.setItem('anokhi_tables', JSON.stringify(window.tables));
    localStorage.setItem('anokhi_expenses', JSON.stringify(window.expensesHistory));
    localStorage.setItem('anokhi_active_orders', JSON.stringify(window.activeOrders));

    // Async push to Supabase
    if (!window.db) return;
    try {
        // Upsert inventory
        if (window.inventory && window.inventory.length > 0) {
            await window.db.from('inventory').upsert(window.inventory.map(i => ({
                id: i.id,
                name: i.name,
                category: i.category,
                item_type: i.itemType || 'Veg',
                price: i.price,
                quantity: i.quantity,
                low_stock_threshold: i.lowStockThreshold || 5
            })));
        }
        
        // Upsert tables
        if (window.tables && window.tables.length > 0) {
            await window.db.from('tables').upsert(window.tables.map(t => ({
                id: t.id,
                name: t.name,
                cart: t.cart,
                advance: t.advance,
                advance_mode: t.advanceMode
            })));
        }

        // Upsert Active Orders
        if (window.activeOrders && window.activeOrders.length > 0) {
            await window.db.from('active_orders').upsert(window.activeOrders.map(o => ({
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

        // For sales history, we usually only add new ones, but upsert is safer if we allow edits
        if (window.expensesHistory && window.expensesHistory.length > 0) { 
            await window.db.from('expenses').upsert(window.expensesHistory); 
        }

        if (window.salesHistory && window.salesHistory.length > 0) {
            await window.db.from('sales_history').upsert(window.salesHistory.map(s => ({
                id: s.id,
                date: s.date,
                items: s.items,
                total: s.total,
                discount: s.discount,
                round_off: s.roundOff,
                payment_mode: s.paymentMode,
                split_amounts: s.splitAmounts,
                order_type: s.orderType,
                table_name: s.tableName,
                advance_paid: s.advancePaid
            })));
        }
    } catch (err) {
        console.error('Push Error:', err);
    }
}
}

