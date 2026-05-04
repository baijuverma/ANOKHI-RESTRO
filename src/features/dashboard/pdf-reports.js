/**
 * Service for generating Dashboard PDF reports using jsPDF.
 */

export function initPdfReports() {
    window.downloadTodaySalesReport = () => {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : today.toDateString();
        
        const data = (window.salesHistory || []).filter(s => {
            const dVal = s.date || s.timestamp || s.created_at;
            return dVal && window.getDDMMYYYY && window.getDDMMYYYY(new Date(dVal)) === todayStr;
        });

        generateSalesReport(`Today's Sales Report (${todayStr})`, data);
    };

    window.downloadProfitReport = () => {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : today.toDateString();
        
        const sales = (window.salesHistory || []).filter(s => {
            const dVal = s.date || s.timestamp || s.created_at;
            return dVal && window.getDDMMYYYY && window.getDDMMYYYY(new Date(dVal)) === todayStr;
        });

        const expenses = (window.expensesHistory || []).filter(e => {
            const dVal = e.date || e.timestamp || e.created_at;
            return dVal && window.getDDMMYYYY && window.getDDMMYYYY(new Date(dVal)) === todayStr;
        });

        generateProfitReport(`Today's Profit & Loss Statement (${todayStr})`, sales, expenses);
    };

    window.downloadTodayExpensesReport = () => {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : today.toDateString();

        const data = (window.expensesHistory || []).filter(e => {
            const dVal = e.date || e.timestamp || e.created_at;
            return dVal && window.getDDMMYYYY && window.getDDMMYYYY(new Date(dVal)) === todayStr;
        });

        generateExpensesReport(`Today's Expenses Report (${todayStr})`, data);
    };

    window.downloadMonthSalesReport = () => {
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        const currentMonth = now.getMonth();

        const data = (window.salesHistory || []).filter(s => {
            const dVal = s.date || s.timestamp || s.created_at;
            if (!dVal) return false;
            const d = new Date(dVal);
            return d.getMonth() === currentMonth && d.getFullYear() === year;
        });

        generateSalesReport(`Monthly Sales Report (${monthName} ${year})`, data);
    };

    window.downloadMonthExpensesReport = () => {
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        const currentMonth = now.getMonth();

        const data = (window.expensesHistory || []).filter(e => {
            const dVal = e.date || e.timestamp || e.created_at;
            if (!dVal) return false;
            const d = new Date(dVal);
            return d.getMonth() === currentMonth && d.getFullYear() === year;
        });

        generateExpensesReport(`Monthly Expenses Report (${monthName} ${year})`, data);
    };

    window.downloadMonthProfitReport = () => {
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        const currentMonth = now.getMonth();

        const sales = (window.salesHistory || []).filter(s => {
            const dVal = s.date || s.timestamp || s.created_at;
            if (!dVal) return false;
            const d = new Date(dVal);
            return d.getMonth() === currentMonth && d.getFullYear() === year;
        });

        const expenses = (window.expensesHistory || []).filter(e => {
            const dVal = e.date || e.timestamp || e.created_at;
            if (!dVal) return false;
            const d = new Date(dVal);
            return d.getMonth() === currentMonth && d.getFullYear() === year;
        });

        generateProfitReport(`Monthly Profit & Loss Statement (${monthName} ${year})`, sales, expenses);
    };

    window.generateGrossReport = (title, sales) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const margin = 10;
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text(title, margin, margin + 10);
        
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${String(d.getDate()).padStart(2, '0')} ${String(d.getMonth() + 1).padStart(2, '0')} ${d.getFullYear()}`;
        };

        const formatDateTime = (dateStr) => {
            const d = new Date(dateStr);
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${formatDate(d)} ${time}`;
        };

        doc.setFontSize(10);
        doc.text(`Generated on: ${formatDateTime(new Date())}`, margin, margin + 18);

        // --- Section 1: Bill-wise Transactions ---
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("1. Bill-wise Transactions", margin, margin + 28);
        
        const billTableBody = sales.map((s, i) => [
            i + 1,
            s.id.toString().slice(-6),
            formatDate(s.date),
            s.orderType || 'Counter',
            (s.payment_mode || 'CASH').toUpperCase(),
            `Rs. ${parseFloat(s.total || 0).toFixed(2)}`
        ]);

        const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

        billTableBody.push([
            '',
            '',
            '',
            '',
            { content: 'TOTAL', styles: { fontStyle: 'bold' } },
            { content: `Rs. ${totalRevenue.toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ]);

        doc.autoTable({
            head: [['Sr.', 'Bill ID', 'Date', 'Type', 'Mode', 'Amount']],
            body: billTableBody,
            startY: margin + 32,
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [99, 102, 241] }, // Indigo for bills
            styles: { fontSize: 8 }
        });

        const billY = doc.lastAutoTable.finalY || 100;

        // --- Section 2: Item-wise Ranking Summary ---
        let itemStartY = billY + 20;
        if (itemStartY > 240) {
            doc.addPage();
            itemStartY = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("2. Item-wise Sales Ranking", margin, itemStartY - 5);

        // Aggregate items by category
        const categoryMap = {};
        let totalDiscount = 0;
        sales.forEach(sale => {
            totalDiscount += parseFloat(sale.discount || 0);
            (sale.items || []).forEach(item => {
                const cat = item.category || "General";
                const name = item.name || "Unknown";
                const qty = parseFloat(item.cartQty || item.qty || 0);
                const revenue = parseFloat(item.price || 0) * qty;
                
                if (!categoryMap[cat]) categoryMap[cat] = {};
                if (!categoryMap[cat][name]) {
                    categoryMap[cat][name] = { name, quantity: 0, revenue: 0 };
                }
                categoryMap[cat][name].quantity += qty;
                categoryMap[cat][name].revenue += revenue;
            });
        });

        const itemTableBody = [];
        let totalItemQty = 0;
        let totalItemRev = 0;

        // Calculate total quantity per category for sorting categories by performance
        const categoryPerformance = {};
        Object.keys(categoryMap).forEach(cat => {
            categoryPerformance[cat] = Object.values(categoryMap[cat]).reduce((sum, item) => sum + item.quantity, 0);
        });

        // Sort categories by total quantity (descending)
        const sortedCategories = Object.keys(categoryMap).sort((a, b) => categoryPerformance[b] - categoryPerformance[a]);

        sortedCategories.forEach((catName, catIdx) => {
            // Add Category Header Row with Serial Number
            itemTableBody.push([
                { content: `${catIdx + 1}. Category: ${catName}`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
            ]);

            let catQty = 0;
            let catRev = 0;
            const categoryItems = Object.values(categoryMap[catName]).sort((a, b) => b.quantity - a.quantity);
            categoryItems.forEach((item, i) => {
                totalItemQty += item.quantity;
                totalItemRev += item.revenue;
                catQty += item.quantity;
                catRev += item.revenue;
                itemTableBody.push([
                    i + 1,
                    item.name,
                    item.quantity,
                    `Rs. ${item.revenue.toFixed(2)}`
                ]);
            });

            // Subtotal for Category
            itemTableBody.push([
                '',
                { content: `${catName} Total`, styles: { fontStyle: 'bold', textColor: [99, 102, 241] } },
                { content: catQty.toString(), styles: { fontStyle: 'bold', textColor: [99, 102, 241] } },
                { content: `Rs. ${catRev.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [99, 102, 241] } }
            ]);
        });

        const netTotal = totalItemRev - totalDiscount;

        // Row 1: Gross Total
        itemTableBody.push([
            '',
            { content: 'Gross Total', styles: { fontStyle: 'bold' } },
            { content: totalItemQty.toString(), styles: { fontStyle: 'bold' } },
            { content: `Rs. ${totalItemRev.toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ]);
        // Row 2: Less Discount
        itemTableBody.push([
            '',
            { content: 'Less: Discount', styles: { fontStyle: 'italic', textColor: [239, 68, 68] } },
            '',
            { content: `- Rs. ${totalDiscount.toFixed(2)}`, styles: { fontStyle: 'italic', textColor: [239, 68, 68] } }
        ]);
        // Row 3: Net Total
        itemTableBody.push([
            '',
            { content: 'Net Total (= Bill Total)', styles: { fontStyle: 'bold', textColor: [34, 197, 94] } },
            '',
            { content: `Rs. ${netTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [34, 197, 94] } }
        ]);

        doc.autoTable({
            head: [['Rank', 'Item Name', 'Qty Sold', 'Revenue']],
            body: itemTableBody,
            startY: itemStartY,
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [34, 197, 94] }, // Green for rankings
            styles: { fontSize: 9 }
        });

        const finalY = doc.lastAutoTable.finalY || 150;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Period Revenue: Rs. ${totalRevenue.toFixed(2)}`, pageWidth - margin - 80, finalY + 12);

        // --- Add Footers to All Pages at Once ---
        const totalPagesCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPagesCount; i++) {
            doc.setPage(i);
            addFooter(doc, i);
        }
        
        if (typeof doc.putTotalPages === 'function') {
            doc.putTotalPages('{totalPages}');
        }
        doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    };
}

function generateProfitReport(title, sales, expenses) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text(title, margin, margin + 10);
    
    const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const profit = totalSales - totalExp;

    doc.autoTable({
        head: [['Type', 'Description', 'Amount']],
        body: [
            ['Income', 'Total Sales Revenue', `Rs. ${totalSales.toFixed(2)}`],
            ['Expense', 'Total Operational Expenses', `Rs. ${totalExp.toFixed(2)}`],
            [{ content: 'Net Profit / Loss', styles: { fontStyle: 'bold' } }, '', { content: `Rs. ${profit.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: profit >= 0 ? [34, 197, 94] : [239, 68, 68] } }]
        ],
        startY: margin + 25,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [99, 102, 241] }
    });

    addFooter(doc, 1);
    if (typeof doc.putTotalPages === 'function') doc.putTotalPages('{totalPages}');
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

function generateSalesReport(title, data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, margin, margin + 10);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, margin + 18);

    // Table Data
    const tableBody = data.map((s, i) => [
        i + 1,
        s.orderId || s.id.substring(0, 8),
        new Date(s.date).toLocaleString(),
        s.customer_name || 'Walk-in',
        (s.payment_mode || 'CASH').toUpperCase(),
        `Rs. ${parseFloat(s.total || 0).toFixed(2)}`
    ]);

    doc.autoTable({
        head: [['Sr.', 'Order ID', 'Date & Time', 'Customer', 'Mode', 'Amount']],
        body: tableBody,
        startY: margin + 25,
        margin: { left: margin, right: margin, top: margin, bottom: margin + 10 },
        styles: { fontSize: 9 },
        headStyles: { fillStyle: 'f', fillColor: [99, 102, 241] }
    });

    const total = data.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    const finalY = doc.lastAutoTable.finalY || 40;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Grand Total: Rs. ${total.toFixed(2)}`, pageWidth - margin - 60, finalY + 10);

    // --- Section 2: Item-wise Ranking Summary ---
    let itemStartY = finalY + 20;
    if (itemStartY > pageHeight - 40) {
        doc.addPage();
        itemStartY = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Item-wise Sales Ranking", margin, itemStartY - 5);

    // Aggregate items by category
    const categoryMap = {};
    let totalDiscount = 0;
    data.forEach(sale => {
        totalDiscount += parseFloat(sale.discount || 0);
        (sale.items || []).forEach(item => {
            const cat = item.category || "General";
            const name = item.name || "Unknown";
            const qty = parseFloat(item.cartQty || item.qty || 0);
            const revenue = parseFloat(item.price || 0) * qty;
            
            if (!categoryMap[cat]) categoryMap[cat] = {};
            if (!categoryMap[cat][name]) {
                categoryMap[cat][name] = { name, quantity: 0, revenue: 0 };
            }
            categoryMap[cat][name].quantity += qty;
            categoryMap[cat][name].revenue += revenue;
        });
    });

    const itemTableBody = [];
    let totalItemQty = 0;
    let totalItemRev = 0;

    // Calculate total quantity per category for sorting categories by performance
    const categoryPerformance = {};
    Object.keys(categoryMap).forEach(cat => {
        categoryPerformance[cat] = Object.values(categoryMap[cat]).reduce((sum, item) => sum + item.quantity, 0);
    });

    // Sort categories by total quantity (descending)
    const sortedCategories = Object.keys(categoryMap).sort((a, b) => categoryPerformance[b] - categoryPerformance[a]);

    sortedCategories.forEach((catName, catIdx) => {
        // Add Category Header Row with Serial Number
        itemTableBody.push([
            { content: `${catIdx + 1}. Category: ${catName}`, colSpan: 4, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
        ]);

        let catQty = 0;
        let catRev = 0;
        const categoryItems = Object.values(categoryMap[catName]).sort((a, b) => b.quantity - a.quantity);
        categoryItems.forEach((item, i) => {
            totalItemQty += item.quantity;
            totalItemRev += item.revenue;
            catQty += item.quantity;
            catRev += item.revenue;
            itemTableBody.push([
                i + 1,
                item.name,
                item.quantity,
                `Rs. ${item.revenue.toFixed(2)}`
            ]);
        });

        // Subtotal for Category
        itemTableBody.push([
            '',
            { content: `${catName} Total`, styles: { fontStyle: 'bold', textColor: [99, 102, 241] } },
            { content: catQty.toString(), styles: { fontStyle: 'bold', textColor: [99, 102, 241] } },
            { content: `Rs. ${catRev.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [99, 102, 241] } }
        ]);
    });

    const netTotal = totalItemRev - totalDiscount;

    // Row 1: Gross Total
    itemTableBody.push([
        '',
        { content: 'Gross Total', styles: { fontStyle: 'bold' } },
        { content: totalItemQty.toString(), styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalItemRev.toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);
    // Row 2: Less Discount
    itemTableBody.push([
        '',
        { content: 'Less: Discount', styles: { fontStyle: 'italic', textColor: [239, 68, 68] } },
        '',
        { content: `- Rs. ${totalDiscount.toFixed(2)}`, styles: { fontStyle: 'italic', textColor: [239, 68, 68] } }
    ]);
    // Row 3: Net Total
    itemTableBody.push([
        '',
        { content: 'Net Total (= Bill Total)', styles: { fontStyle: 'bold', textColor: [34, 197, 94] } },
        '',
        { content: `Rs. ${netTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [34, 197, 94] } }
    ]);

    doc.autoTable({
        head: [['Rank', 'Item Name', 'Qty Sold', 'Revenue']],
        body: itemTableBody,
        startY: itemStartY,
        margin: { left: margin, right: margin, bottom: margin + 10 },
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 9 }
    });

    const totalPagesCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesCount; i++) {
        doc.setPage(i);
        addFooter(doc, i);
    }

    if (typeof doc.putTotalPages === 'function') doc.putTotalPages('{totalPages}');
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

function generateExpensesReport(title, data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, margin, margin + 10);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, margin + 18);

    // Table Data
    const tableBody = data.map((e, i) => [
        i + 1,
        new Date(e.date).toLocaleDateString(),
        e.category || 'General',
        e.description || '-',
        e.payment_mode || 'CASH',
        `Rs. ${parseFloat(e.amount || 0).toFixed(2)}`
    ]);

    doc.autoTable({
        head: [['Sr.', 'Date', 'Category', 'Description', 'Mode', 'Amount']],
        body: tableBody,
        startY: margin + 25,
        margin: { left: margin, right: margin, top: margin, bottom: margin + 10 },
        styles: { fontSize: 9 },
        headStyles: { fillStyle: 'f', fillColor: [239, 68, 68] },
        didDrawPage: (data) => addFooter(doc, data.pageNumber)
    });

    const total = data.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const finalY = doc.lastAutoTable.finalY || 40;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Expenses: Rs. ${total.toFixed(2)}`, pageWidth - margin - 60, finalY + 10);

    if (typeof doc.putTotalPages === 'function') doc.putTotalPages('{totalPages}');
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

function addFooter(doc, pageNumber) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    doc.setFontSize(10);
    doc.setTextColor(150);
    
    // Format: page 1 of {totalPages}
    const pStr = `page ${pageNumber} of {totalPages}`;
    
    doc.text(pStr, pageWidth - margin, pageHeight - margin, { align: 'right' });
    
    // Bottom border line
    doc.setDrawColor(230);
    doc.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5);
}
