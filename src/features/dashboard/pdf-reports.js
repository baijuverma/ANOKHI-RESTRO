/**
 * Service for generating Dashboard PDF reports using jsPDF.
 */

export function initPdfReports() {
    window.downloadTodaySalesReport = () => {
        const today = new Date();
        const todayStr = window.getDDMMYYYY ? window.getDDMMYYYY(today) : today.toDateString();
        
        const data = (window.salesHistory || []).filter(s => {
            return window.getDDMMYYYY && window.getDDMMYYYY(new Date(s.date)) === todayStr;
        });

        generateSalesReport(`Today's Sales Report (${todayStr})`, data);
    };

    window.downloadMonthSalesReport = () => {
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        const currentMonth = now.getMonth();

        const data = (window.salesHistory || []).filter(s => {
            const d = new Date(s.date);
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
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === year;
        });

        generateExpensesReport(`Monthly Expenses Report (${monthName} ${year})`, data);
    };
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
        headStyles: { fillStyle: 'f', fillColor: [99, 102, 241] },
        didDrawPage: (data) => addFooter(doc, data.pageNumber)
    });

    const total = data.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    const finalY = doc.lastAutoTable.finalY || 40;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Grand Total: Rs. ${total.toFixed(2)}`, pageWidth - margin - 60, finalY + 10);

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

    doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

function addFooter(doc, pageNumber) {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    doc.setFontSize(10);
    doc.setTextColor(150);
    
    // Format: page 01-01
    const pStr = `page ${String(pageNumber).padStart(2, '0')}-${String(pageCount).padStart(2, '0')}`;
    
    doc.text(pStr, pageWidth / 2, pageHeight - margin, { align: 'center' });
    
    // Bottom border line
    doc.setDrawColor(230);
    doc.line(margin, pageHeight - margin - 5, pageWidth - margin, pageHeight - margin - 5);
}
