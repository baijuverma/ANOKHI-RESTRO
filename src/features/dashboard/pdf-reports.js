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

    window.downloadTodayDuesReport = () => {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : today.toDateString();
        
        const data = (window.salesHistory || []).filter(s => {
            const dVal = s.date || s.timestamp || s.created_at;
            const isToday = dVal && window.getDDMMYYYY && window.getDDMMYYYY(new Date(dVal)) === todayStr;
            return isToday && parseFloat(s.dues || 0) > 0;
        });

        generateSalesReport(`Today's Dues Report (${todayStr})`, data);
    };

    window.downloadTotalDuesReport = () => {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : today.toDateString();
        
        const data = (window.salesHistory || []).filter(s => parseFloat(s.dues || 0) > 0);

        generateSalesReport(`Total Dues Report (All Time as of ${todayStr})`, data);
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

    window.downloadGrossExpensesReport = () => {
        let filtered = [...(window.expensesHistory || [])];
        const searchVal = document.getElementById('expenses-search')?.value?.toLowerCase() || '';
        const startDateStr = document.getElementById('expenses-start-date')?.value;
        const endDateStr = document.getElementById('expenses-end-date')?.value;

        if (searchVal || startDateStr || endDateStr) {
            filtered = filtered.filter(exp => {
                if (searchVal) {
                    const cat = (exp.category || '').toLowerCase();
                    const subCat = (exp.subCategory || exp.sub_category || '').toLowerCase();
                    const reason = (exp.description || exp.reason || '').toLowerCase();
                    if (!cat.includes(searchVal) && !subCat.includes(searchVal) && !reason.includes(searchVal)) return false;
                }
                if (exp.date) {
                    const expDate = new Date(exp.date);
                    expDate.setHours(0, 0, 0, 0);
                    if (startDateStr) {
                        const start = new Date(startDateStr);
                        start.setHours(0, 0, 0, 0);
                        if (expDate < start) return false;
                    }
                    if (endDateStr) {
                        const end = new Date(endDateStr);
                        end.setHours(23, 59, 59, 999);
                        if (expDate > end) return false;
                    }
                }
                return true;
            });
        }

        const title = (startDateStr && endDateStr) 
            ? `Expenses Report (${startDateStr} to ${endDateStr})`
            : `Gross Expenses Report (${new Date().toLocaleDateString()})`;

        generateExpensesReport(title, filtered);
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

window.generateGrossReport = (title, sales, expenses, isFiltered = false) => {
        generateDetailedReport(title, sales, expenses, isFiltered, false);
    };
}

function generateDetailedReport(title, sales, expenses, isFiltered = false, hideTransactions = false) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 8.5;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, margin, margin + 10);
    
    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, '0')} ${String(d.getMonth() + 1).padStart(2, '0')} ${d.getFullYear()}`;
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${formatDate(d)} ${time}`;
    };

    doc.setFontSize(10);
    doc.text(`Generated on: ${formatDateTime(new Date())}`, margin, margin + 18);

    if (!hideTransactions) {
    // --- Section 1: Bill-wise Transactions ---
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const section1Title = isFiltered ? "Bill-wise Transactions" : "1. Bill-wise Transactions";
    doc.text(section1Title, margin, margin + 28);
    }
    
    let totalRevenue = 0, totalCash = 0, totalUPI = 0, totalDues = 0;
    const billTableBody = (sales || []).map((s, i) => {
        const total = parseFloat(s.total || 0);
        const sDues = parseFloat(s.dues || 0);
        const totalPaid = total - sDues;
        const split = s.split_amounts || s.splitAmounts;
        const pMode = (s.payment_mode || s.paymentMode || 'CASH').toUpperCase();
        let sCash = 0, sUpi = 0;

        if (pMode === 'UPI') {
            sUpi = totalPaid;
        } else if ((pMode === 'BOTH' || pMode === 'SPLIT') && split) {
            sCash = parseFloat(split.cash || 0);
            sUpi = parseFloat(split.upi || 0);
        } else {
            sCash = totalPaid;
        }

        const d = new Date(s.date);
        const dateStr = formatDate(d);
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const itemsStr = (s.items || []).map(item => `${item.name} (x${item.cartQty || item.qty || 0})`).join(', ');

        totalRevenue += total;
        totalCash += sCash;
        totalUPI += sUpi;
        totalDues += sDues;

        return [
            i + 1,
            s.id ? s.id.toString().slice(-6) : '-',
            `${dateStr}\n${timeStr}`,
            s.customer_name || s.customerName || s.customerPhone || 'Walk-in',
            itemsStr,
            (s.orderType || 'Counter').toUpperCase(),
            sCash > 0 ? `Rs. ${sCash.toFixed(2)}` : '-',
            sUpi > 0 ? `Rs. ${sUpi.toFixed(2)}` : '-',
            sDues > 0 ? `Rs. ${sDues.toFixed(2)}` : '-',
            `Rs. ${total.toFixed(2)}`
        ];
    });

    billTableBody.push([
        '',
        '',
        '',
        '',
        '',
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalCash.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalUPI.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalDues.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalRevenue.toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);

    if (!hideTransactions) {
    doc.autoTable({
        head: [['Sr.', 'Bill ID', 'Date & Time', 'Customer', 'Items Details', 'Type', 'Cash', 'UPI', 'Dues', 'Amount']],
        body: billTableBody,
        startY: margin + 32,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [99, 102, 241] }, // Indigo for bills
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 10 }, // Sr. No.
            2: { cellWidth: 22 }, // Date/Time
            3: { cellWidth: 25 }, // Customer
            4: { cellWidth: 45 }, // Items
            5: { cellWidth: 22 }, // Type
            8: { cellWidth: 15 }, // Dues
            9: { fontStyle: 'bold' } // Amount
        }
    });
    }

    const billY = (!hideTransactions && doc.lastAutoTable) ? (doc.lastAutoTable.finalY || 100) : (margin + 25);

    if (!isFiltered) {
    // --- Section 2: Order Type Summary & Grand Total ---
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    const typeTotals = (sales || []).reduce((acc, s) => {
        const type = (s.orderType || 'Counter').toUpperCase();
        acc[type] = (acc[type] || 0) + parseFloat(s.total || 0);
        return acc;
    }, {});
    
    let currentX = margin;
    let summaryY = billY + 12; 
    Object.entries(typeTotals).forEach(([type, val], idx) => {
        const text = `${type}: Rs. ${val.toFixed(2)}`;
        doc.text(text, currentX, summaryY);
        currentX += doc.getTextWidth(text) + 8; // Horizontal gap
    });

    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`Grand Total: Rs. ${totalRevenue.toFixed(2)}`, pageWidth - margin - 60, summaryY);
    doc.setTextColor(0); // Reset to black

    // --- Section 3: Item-wise Ranking Summary ---
    let itemStartY = billY + 28;
    if (itemStartY > 240) {
        doc.addPage();
        itemStartY = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const section2Title = hideTransactions ? "Item-wise Sales Ranking" : "2. Item-wise Sales Ranking";
    doc.text(section2Title, margin, itemStartY - 5);

    const categoryMap = {};
    let totalDiscount = 0;
    (sales || []).forEach(sale => {
        totalDiscount += parseFloat(sale.discount || 0);
        (sale.items || []).forEach(item => {
            let cat = item.category || "General";
            const name = item.name || "Unknown";
            
            let buyingPrice = 0;
            if (window.inventory && window.inventory.length > 0) {
                const invItem = window.inventory.find(i => String(i.id) === String(item.id) || i.name.toLowerCase() === name.toLowerCase());
                if (invItem) {
                    if (invItem.category) cat = invItem.category;
                    buyingPrice = parseFloat(invItem.buyingPrice || 0);
                }
            }

            // Smart Lookup: If no buying price in inventory, check latest purchase in Expenses History
            if (buyingPrice === 0 && window.expensesHistory && window.expensesHistory.length > 0) {
                const latestExp = window.expensesHistory.find(e => 
                    (e.sub_category || e.subCategory || '').trim().toLowerCase() === name.trim().toLowerCase() && 
                    (parseFloat(e.qty) > 0)
                );
                if (latestExp) {
                    buyingPrice = (parseFloat(latestExp.amount || 0) / parseFloat(latestExp.qty || 1));
                }
            }
            
            const qty = parseFloat(item.cartQty || item.qty || 0);
            const revenue = parseFloat(item.price || 0) * qty;
            const expense = buyingPrice * qty;
            
            if (!categoryMap[cat]) categoryMap[cat] = {};
            if (!categoryMap[cat][name]) {
                categoryMap[cat][name] = { name, quantity: 0, revenue: 0, expense: 0 };
            }
            categoryMap[cat][name].quantity += qty;
            categoryMap[cat][name].revenue += revenue;
            categoryMap[cat][name].expense += expense;
        });
    });

    const itemTableBody = [];
    let totalItemQty = 0;
    let totalItemRev = 0;
    let totalItemExp = 0;

    const categoryPerformance = {};
    Object.keys(categoryMap).forEach(cat => {
        categoryPerformance[cat] = Object.values(categoryMap[cat]).reduce((sum, item) => sum + item.quantity, 0);
    });

    const sortedCategories = Object.keys(categoryMap).sort((a, b) => categoryPerformance[b] - categoryPerformance[a]);

    sortedCategories.forEach((catName, catIdx) => {
        itemTableBody.push([
            { content: `${catIdx + 1}. Category: ${catName}`, colSpan: 6, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }
        ]);

        let catQty = 0;
        let catRev = 0;
        let catExp = 0;
        const categoryItems = Object.values(categoryMap[catName]).sort((a, b) => b.quantity - a.quantity);
        categoryItems.forEach((item, i) => {
            totalItemQty += item.quantity;
            totalItemRev += item.revenue;
            totalItemExp += item.expense;
            catQty += item.quantity;
            catRev += item.revenue;
            catExp += item.expense;
            const itemPL = item.revenue - item.expense;
            itemTableBody.push([
                i + 1,
                item.name,
                item.quantity,
                `Rs. ${item.revenue.toFixed(2)}`,
                { content: `Rs. ${item.expense.toFixed(2)}`, styles: { textColor: [239, 68, 68] } },
                { content: `Rs. ${itemPL.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: itemPL >= 0 ? [34, 197, 94] : [239, 68, 68] } }
            ]);
        });

        const catPL = catRev - catExp;
        itemTableBody.push([
            '',
            { content: `${catName} Total`, styles: { fontStyle: 'bold', textColor: [99, 102, 241] } },
            { content: catQty.toString(), styles: { fontStyle: 'bold', textColor: [99, 102, 241] } },
            { content: `Rs. ${catRev.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [99, 102, 241] } },
            { content: `Rs. ${catExp.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
            { content: `Rs. ${catPL.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [99, 102, 241] } }
        ]);
    });

    const netTotal = totalItemRev - totalDiscount;
    const grossPL = totalItemRev - totalItemExp;
    const netPL = netTotal - totalItemExp;

    itemTableBody.push([
        '',
        { content: 'Gross Total', styles: { fontStyle: 'bold' } },
        { content: totalItemQty.toString(), styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalItemRev.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalItemExp.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
        { content: `Rs. ${grossPL.toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);
    itemTableBody.push([
        '',
        { content: 'Less: Discount', styles: { fontStyle: 'italic', textColor: [239, 68, 68] } },
        '',
        { content: `- Rs. ${totalDiscount.toFixed(2)}`, styles: { fontStyle: 'italic', textColor: [239, 68, 68] } },
        '',
        { content: `- Rs. ${totalDiscount.toFixed(2)}`, styles: { fontStyle: 'italic', textColor: [239, 68, 68] } }
    ]);
    itemTableBody.push([
        '',
        { content: 'Net Total (= Bill Total)', styles: { fontStyle: 'bold', textColor: [34, 197, 94] } },
        '',
        { content: `Rs. ${netTotal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [34, 197, 94] } },
        '',
        { content: `Rs. ${netPL.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [34, 197, 94] } }
    ]);

    doc.autoTable({
        head: [['Rank', 'Item Name', 'Qty Sold', 'Selling Price', 'Expenses', 'Profit/Loss']],
        body: itemTableBody,
        startY: itemStartY,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [34, 197, 94] }, 
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 10 },
            2: { cellWidth: 15 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 }
        }
    });

    // --- Section 3: Category-wise Profit/Loss ---
    const finalYRank = doc.lastAutoTable.finalY || 200;
    let catSummaryY = finalYRank + 15;

    if (catSummaryY > 240) {
        doc.addPage();
        catSummaryY = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const section3Title = hideTransactions ? "Category-wise Profit/Loss" : "3. Category-wise Profit/Loss";
    doc.text(section3Title, margin, catSummaryY - 5);

    const categoryRevMap = {};
    Object.keys(categoryMap).forEach(cat => {
        categoryRevMap[cat] = Object.values(categoryMap[cat]).reduce((sum, item) => sum + item.revenue, 0);
    });

    const categoryExpMap = {};
    (expenses || []).forEach(exp => {
        const cat = exp.main_category || exp.category || 'General';
        categoryExpMap[cat] = (categoryExpMap[cat] || 0) + parseFloat(exp.amount || 0);
    });

    const allCats = Array.from(new Set([...Object.keys(categoryRevMap), ...Object.keys(categoryExpMap)])).sort();
    
    let totalCatRev = 0, totalCatExp = 0;
    const catReportBody = allCats.map((cat, i) => {
        const rev = categoryRevMap[cat] || 0;
        const exp = categoryExpMap[cat] || 0;
        const pl = rev - exp;
        totalCatRev += rev;
        totalCatExp += exp;
        return [
            i + 1,
            cat,
            `Rs. ${rev.toFixed(2)}`,
            { content: `Rs. ${exp.toFixed(2)}`, styles: { textColor: [239, 68, 68] } },
            { content: `Rs. ${pl.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: pl >= 0 ? [34, 197, 94] : [239, 68, 68] } }
        ];
    });

    catReportBody.push([
        '',
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalCatRev.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalCatExp.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
        { content: `Rs. ${(totalCatRev - totalCatExp).toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);

    catReportBody.push([
        '',
        { content: 'Less: Discount', styles: { fontStyle: 'italic', textColor: [239, 68, 68] } },
        { content: `- Rs. ${totalDiscount.toFixed(2)}`, styles: { fontStyle: 'italic', textColor: [239, 68, 68] } },
        '',
        ''
    ]);

    const finalPL = (totalCatRev - totalCatExp) - totalDiscount;
    catReportBody.push([
        '',
        { content: 'Net Profit / Loss', styles: { fontStyle: 'bold' } },
        '',
        '',
        { content: `Rs. ${finalPL.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: finalPL >= 0 ? [34, 197, 94] : [239, 68, 68] } }
    ]);

    doc.autoTable({
        head: [['Sr.', 'Category', 'Selling Price', 'Expenses', 'Profit / Loss']],
        body: catReportBody,
        startY: catSummaryY,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 9 }
    });

    // --- Section 4: Final Period Summary ---
    const finalYCat = doc.lastAutoTable.finalY || 200;
    let summaryPeriodY = finalYCat + 15;

    if (summaryPeriodY + 40 > 280) {
        doc.addPage();
        summaryPeriodY = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const section4Title = hideTransactions ? "Final Period Summary" : "4. Final Period Summary";
    doc.text(section4Title, margin, summaryPeriodY);

    const totalExp = (expenses || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const profitLoss = totalRevenue - totalExp;

    doc.autoTable({
        body: [
            ['Total Sale Value', `Rs. ${totalRevenue.toFixed(2)}`],
            ['Total Expenses', `Rs. ${totalExp.toFixed(2)}`],
            [{ content: 'Total Profit / Loss', styles: { fontStyle: 'bold' } }, { content: `Rs. ${profitLoss.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: profitLoss >= 0 ? [34, 197, 94] : [239, 68, 68] } }]
        ],
        startY: summaryPeriodY + 5,
        margin: { left: margin, right: margin },
        styles: { fontSize: 11, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { halign: 'right' }
        }
    });
    } // End if (!isFiltered)

    const totalPagesCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPagesCount; i++) {
        doc.setPage(i);
        addFooter(doc, i);
    }
    
    if (typeof doc.putTotalPages === 'function') doc.putTotalPages('{totalPages}');
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

function generateProfitReport(title, sales, expenses) {
    generateDetailedReport(title, sales, expenses, false, true);
}

function generateSalesReport(title, data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 8.5;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, margin, margin + 10);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, margin + 18);

    // Table Data
    let totalCash = 0, totalUPI = 0, totalDues = 0, totalRevenue = 0;
    const tableBody = data.map((s, i) => {
        const d = new Date(s.date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const total = parseFloat(s.total || 0);
        const sDues = parseFloat(s.dues || 0);
        const totalPaid = total - sDues;
        const split = s.split_amounts || s.splitAmounts;
        const pMode = (s.payment_mode || s.paymentMode || 'CASH').toUpperCase();
        let sCash = 0, sUpi = 0;

        if (pMode === 'UPI') {
            sUpi = totalPaid;
        } else if ((pMode === 'BOTH' || pMode === 'SPLIT') && split) {
            sCash = parseFloat(split.cash || 0);
            sUpi = parseFloat(split.upi || 0);
        } else {
            sCash = totalPaid;
        }

        const itemsStr = (s.items || []).map(item => `${item.name} (x${item.cartQty || item.qty || 0})`).join(', ');

        totalRevenue += total;
        totalCash += sCash;
        totalUPI += sUpi;
        totalDues += sDues;

        return [
            i + 1,
            s.orderId || s.id.substring(0, 8),
            `${dateStr}\n${timeStr}`,
            s.customer_name || s.customerName || s.customerPhone || 'Walk-in',
            itemsStr,
            (s.orderType || 'Counter').toUpperCase(),
            sCash > 0 ? `Rs. ${sCash.toFixed(2)}` : '-',
            sUpi > 0 ? `Rs. ${sUpi.toFixed(2)}` : '-',
            sDues > 0 ? `Rs. ${sDues.toFixed(2)}` : '-',
            `Rs. ${total.toFixed(2)}`
        ];
    });

    tableBody.push([
        '',
        '',
        '',
        '',
        '',
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalCash.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalUPI.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalDues.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalRevenue.toFixed(2)}`, styles: { fontStyle: 'bold' } }
    ]);

    doc.autoTable({
        head: [['Sr.', 'Order ID', 'Date & Time', 'Customer', 'Items Details', 'Type', 'Cash', 'UPI', 'Dues', 'Amount']],
        body: tableBody,
        startY: margin + 25,
        margin: { left: margin, right: margin, top: margin, bottom: margin + 10 },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillStyle: 'f', fillColor: [99, 102, 241] },
        columnStyles: {
            0: { cellWidth: 10 }, // Sr. No.
            2: { cellWidth: 22 }, // Date/Time
            3: { cellWidth: 25 }, // Customer
            4: { cellWidth: 45 }, // Items
            5: { cellWidth: 22 }, // Type
            8: { cellWidth: 15 }, // Dues
            9: { fontStyle: 'bold' } // Amount
        }
    });

    const total = data.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    const finalY = doc.lastAutoTable.finalY || 40;
    
    // Order Type Summary (Left of Total, Bold, No Header)
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    const typeTotals = data.reduce((acc, s) => {
        const type = (s.orderType || 'Counter').toUpperCase();
        acc[type] = (acc[type] || 0) + parseFloat(s.total || 0);
        return acc;
    }, {});
    
    let currentX = margin;
    let summaryY = finalY + 10;
    Object.entries(typeTotals).forEach(([type, val], idx) => {
        const text = `${type}: Rs. ${val.toFixed(2)}`;
        doc.text(text, currentX, summaryY);
        currentX += doc.getTextWidth(text) + 8; // Horizontal gap
    });

    doc.setFontSize(12);
    doc.setTextColor(34, 197, 94); // Green
    doc.text(`Grand Total: Rs. ${total.toFixed(2)}`, pageWidth - margin - 60, finalY + 10);
    doc.setTextColor(0); // Reset to black

    // --- Section 2: Item-wise Ranking Summary ---
    let itemStartY = finalY + 28;
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
            let cat = item.category || "General";
            const name = item.name || "Unknown";
            
            // Lookup current category from inventory if available
            if (window.inventory && window.inventory.length > 0) {
                const invItem = window.inventory.find(i => String(i.id) === String(item.id) || i.name.toLowerCase() === name.toLowerCase());
                if (invItem && invItem.category) {
                    cat = invItem.category;
                }
            }
            
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
    // Switch to Landscape to fit more columns beautifully
    const doc = new jsPDF('l', 'mm', 'a4');
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(239, 68, 68); // Red theme for Expenses
    doc.setFont(undefined, 'bold');
    doc.text(title, margin, margin + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${data.length}`, margin, margin + 18);

    // --- Table Data Calculation ---
    let totalGross = 0, totalDisc = 0, totalNet = 0;
    let totalCash = 0, totalUPI = 0, totalUdhar = 0;
    
    const categoryTotals = {}; // For category-wise summary

    const tableBody = data.map((e, i) => {
        const gross = parseFloat(e.gross_amount || 0);
        const net = parseFloat(e.net_amount || e.amount || 0);
        const disc = gross > 0 ? (gross - net) : 0;
        
        const cash = parseFloat(e.cash || 0);
        const upi = parseFloat(e.upi || 0);
        const udhar = parseFloat(e.udhar || 0);
        const sellPrice = parseFloat(e.selling_price || 0);

        totalGross += gross;
        totalDisc += disc;
        totalNet += net;
        totalCash += cash;
        totalUPI += upi;
        totalUdhar += udhar;

        // Track Category Totals
        const mainCat = e.main_category || e.category || 'General';
        categoryTotals[mainCat] = (categoryTotals[mainCat] || 0) + net;

        return [
            i + 1,
            new Date(e.date).toLocaleDateString('en-GB'),
            mainCat,
            e.sub_category || e.subCategory || '-',
            e.qty ? `${e.qty} ${e.unit || ''}` : '-',
            gross > 0 ? `Rs. ${gross.toFixed(2)}` : '-',
            disc > 0 ? `Rs. ${disc.toFixed(2)}` : '-',
            `Rs. ${net.toFixed(2)}`,
            sellPrice > 0 ? `Rs. ${sellPrice.toFixed(2)}` : '-',
            cash > 0 ? `Rs. ${cash.toFixed(2)}` : '-',
            upi > 0 ? `Rs. ${upi.toFixed(2)}` : '-',
            udhar > 0 ? `Rs. ${udhar.toFixed(2)}` : '-',
            e.description || e.reason || '-'
        ];
    });

    // Add Totals Row
    tableBody.push([
        '', '', '', '', 
        { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `Rs. ${totalGross.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalDisc.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalNet.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        '',
        { content: `Rs. ${totalCash.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalUPI.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        { content: `Rs. ${totalUdhar.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        ''
    ]);

    doc.autoTable({
        head: [['Sr.', 'Date', 'Category', 'Sub-Category', 'Qty', 'Gross', 'Disc.', 'Net Amt', 'Sell Price', 'Cash', 'UPI', 'Udhar', 'Reason']],
        body: tableBody,
        startY: margin + 25,
        margin: { left: margin, right: margin, top: margin, bottom: 20 },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 20 },
            7: { fontStyle: 'bold', textColor: [220, 38, 38] }, // Net Amt in Red-ish
            12: { cellWidth: 35 } // Reason
        },
        didDrawPage: (data) => addFooter(doc, data.pageNumber)
    });

    // --- Category-wise Summary ---
    let finalY = doc.lastAutoTable.finalY + 15;
    
    // Check if we need a new page for summary
    if (finalY + 50 > pageHeight) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.setFont(undefined, 'bold');
    doc.text("Category-wise Summary", margin, finalY);

    const summaryBody = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]) // Sort by amount descending
        .map(([cat, amt]) => [cat, `Rs. ${amt.toFixed(2)}`]);

    // Add Total Row to Summary
    summaryBody.push([
        { content: 'TOTAL EXPENSE', styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
        { content: `Rs. ${totalNet.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [239, 68, 68] } }
    ]);

    doc.autoTable({
        head: [['Main Category', 'Total Net Expense']],
        body: summaryBody,
        startY: finalY + 5,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [75, 85, 99] }, // Grey header for summary
        columnStyles: {
            1: { halign: 'right', fontStyle: 'bold' }
        }
    });

    if (typeof doc.putTotalPages === 'function') doc.putTotalPages('{totalPages}');
    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

function addFooter(doc, pageNumber) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8.5;

    doc.setFontSize(10);
    doc.setTextColor(150);
    
    // Format: page 1 of {totalPages}
    const pStr = `page ${pageNumber} of {totalPages}`;
    
    doc.text(pStr, pageWidth - margin, pageHeight - margin, { align: 'right' });
    
    // Bottom border line
    doc.setDrawColor(230);
    doc.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5);
}
