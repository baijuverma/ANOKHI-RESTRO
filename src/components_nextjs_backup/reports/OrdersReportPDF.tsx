
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register a font if needed, relying on default for now to avoid load issues
// standard fonts are Helvetica, Times-Roman, Courier

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#666666',
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        minHeight: 24,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#F9FAFB',
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 5,
        fontSize: 10,
    },
    colDate: { width: '15%' },
    colBill: { width: '15%' },
    colCust: { width: '25%' },
    colMode: { width: '15%' }, // Added Payment Mode
    colStatus: { width: '15%' },
    colTotal: { width: '15%', textAlign: 'right' },

    summary: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    summaryText: {
        fontSize: 12,
        marginBottom: 4,
    },
    bold: {
        fontWeight: 'bold',
    },
});

interface Order {
    id: string;
    created_at: string;
    bill_number: number;
    customer_name: string;
    total: number;
    status: string;
    payment_mode?: string;
}

interface OrdersReportPDFProps {
    orders: Order[];
    fromDate?: string;
    toDate?: string;
}

export const OrdersReportPDF = ({ orders, fromDate, toDate }: OrdersReportPDFProps) => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');

    const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalCancelled = cancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const dateRangeText = fromDate && toDate
        ? `${format(new Date(fromDate), 'MMM d, yyyy')} - ${format(new Date(toDate), 'MMM d, yyyy')}`
        : `Generated on ${format(new Date(), 'MMM d, yyyy')}`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Orders Report</Text>
                    <Text style={styles.subtitle}>{dateRangeText}</Text>
                </View>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.colDate, styles.bold]}>Date</Text>
                        <Text style={[styles.tableCell, styles.colBill, styles.bold]}>Bill No</Text>
                        <Text style={[styles.tableCell, styles.colCust, styles.bold]}>Customer</Text>
                        <Text style={[styles.tableCell, styles.colMode, styles.bold]}>Mode</Text>
                        <Text style={[styles.tableCell, styles.colStatus, styles.bold]}>Status</Text>
                        <Text style={[styles.tableCell, styles.colTotal, styles.bold]}>Amount</Text>
                    </View>

                    {orders.map((order) => (
                        <View key={order.id} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colDate]}>
                                {format(new Date(order.created_at), 'MMM d HH:mm')}
                            </Text>
                            <Text style={[styles.tableCell, styles.colBill]}>#{order.bill_number}</Text>
                            <Text style={[styles.tableCell, styles.colCust]}>{order.customer_name || 'Guest'}</Text>
                            <Text style={[styles.tableCell, styles.colMode, { textTransform: 'capitalize' }]}>
                                {order.payment_mode || 'cash'}
                            </Text>
                            <Text style={[styles.tableCell, styles.colStatus, { color: order.status === 'cancelled' ? 'red' : 'black' }]}>
                                {order.status}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>
                                {order.total?.toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summary}>
                    <Text style={styles.summaryText}>Total Orders: <Text style={styles.bold}>{orders.length}</Text></Text>
                    <Text style={styles.summaryText}>Net Revenue: <Text style={styles.bold}>{totalRevenue.toFixed(2)}</Text></Text>
                    <Text style={[styles.summaryText, { color: 'red' }]}>Cancelled Amount: <Text style={styles.bold}>{totalCancelled.toFixed(2)}</Text></Text>
                </View>
            </Page>
        </Document>
    );
};
