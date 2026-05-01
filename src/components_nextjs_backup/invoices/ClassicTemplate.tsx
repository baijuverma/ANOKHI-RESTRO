import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Order, OrderItem, Restaurant } from '@/types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 11,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    header: {
        marginBottom: 30,
        borderBottom: 3,
        borderBottomColor: '#2563eb',
        paddingBottom: 20,
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 8,
    },
    companyDetails: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 3,
    },
    invoiceTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textAlign: 'right',
        marginTop: -60,
    },
    billInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        marginTop: 20,
    },
    billInfoBox: {
        width: '48%',
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 5,
    },
    billInfoLabel: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    billInfoValue: {
        fontSize: 11,
        color: '#1e293b',
        fontWeight: 'bold',
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#2563eb',
        padding: 10,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 10,
        fontSize: 10,
    },
    colSr: { width: '8%' },
    colItem: { width: '42%' },
    colQty: { width: '15%', textAlign: 'center' },
    colPrice: { width: '17%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },
    totalsSection: {
        marginTop: 30,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        width: 250,
        justifyContent: 'space-between',
        paddingVertical: 5,
        paddingHorizontal: 15,
    },
    grandTotalRow: {
        flexDirection: 'row',
        width: 250,
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#2563eb',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
        marginTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 10,
        color: '#64748b',
        borderTop: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 15,
    },
});

interface ClassicTemplateProps {
    order: Order;
    orderItems: OrderItem[];
    restaurant: Restaurant;
}

export const ClassicTemplate = ({ order, orderItems, restaurant }: ClassicTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.companyName}>{restaurant.name}</Text>
                <Text style={styles.companyDetails}>{restaurant.address}</Text>
                <Text style={styles.companyDetails}>Phone: {restaurant.phone}</Text>
                {restaurant.gst_number && (
                    <Text style={styles.companyDetails}>GSTIN: {restaurant.gst_number}</Text>
                )}
                <Text style={styles.invoiceTitle}>INVOICE</Text>
            </View>

            <View style={styles.billInfo}>
                <View style={styles.billInfoBox}>
                    <Text style={styles.billInfoLabel}>Bill To</Text>
                    <Text style={styles.billInfoValue}>{order.customer_name || 'Walk-in Customer'}</Text>
                    {order.customer_phone && (
                        <Text style={styles.companyDetails}>Ph: {order.customer_phone}</Text>
                    )}
                </View>
                <View style={styles.billInfoBox}>
                    <Text style={styles.billInfoLabel}>Invoice Details</Text>
                    <Text style={styles.billInfoValue}>Bill #: {order.bill_number}</Text>
                    <Text style={styles.companyDetails}>
                        Date: {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </Text>
                    <Text style={styles.companyDetails}>
                        Payment: {order.payment_method.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colSr}>#</Text>
                    <Text style={styles.colItem}>Item Description</Text>
                    <Text style={styles.colQty}>Qty</Text>
                    <Text style={styles.colPrice}>Rate</Text>
                    <Text style={styles.colTotal}>Amount</Text>
                </View>
                {orderItems.map((item, i) => (
                    <View key={item.id} style={styles.tableRow}>
                        <Text style={styles.colSr}>{i + 1}</Text>
                        <Text style={styles.colItem}>{item.item_name}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={styles.colPrice}>₹{item.price.toFixed(2)}</Text>
                        <Text style={styles.colTotal}>₹{item.total_price.toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                    <Text>Subtotal:</Text>
                    <Text>₹{order.subtotal.toFixed(2)}</Text>
                </View>
                {order.gst_enabled && (
                    <View style={styles.totalRow}>
                        <Text>GST ({restaurant.gst_percentage}%):</Text>
                        <Text>₹{order.gst_amount.toFixed(2)}</Text>
                    </View>
                )}
                <View style={styles.grandTotalRow}>
                    <Text>GRAND TOTAL:</Text>
                    <Text>₹{order.total.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text>Thank you for your business!</Text>
                <Text style={{ fontSize: 8, marginTop: 5 }}>
                    This is a computer-generated invoice and does not require a signature.
                </Text>
            </View>
        </Page>
    </Document>
);
