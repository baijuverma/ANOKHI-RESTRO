import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Order, OrderItem, Restaurant } from '@/types';

const styles = StyleSheet.create({
    page: { padding: 45, fontSize: 10, fontFamily: 'Helvetica', backgroundColor: '#fafafa' },
    header: { marginBottom: 35, textAlign: 'center', paddingBottom: 20, borderBottom: 2, borderBottomColor: '#8b5cf6' },
    companyName: { fontSize: 28, fontWeight: 'bold', color: '#6d28d9', marginBottom: 10, letterSpacing: 1.5 },
    detail: { fontSize: 9, color: '#6b7280', marginBottom: 3 },
    invoiceTitle: { fontSize: 16, color: '#8b5cf6', marginBottom: 25, textAlign: 'center', letterSpacing: 3 },
    infoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    infoBox: { width: '48%', backgroundColor: '#FFFFFF', padding: 15, borderRadius: 5, borderLeft: 3, borderLeftColor: '#8b5cf6' },
    infoLabel: { fontSize: 8, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: 10, color: '#111827', marginBottom: 3 },
    table: { marginTop: 20, backgroundColor: '#FFFFFF', padding: 15 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f3e8ff', padding: 10, fontSize: 9, fontWeight: 'bold', color: '#6d28d9' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', padding: 10, fontSize: 9 },
    colSr: { width: '8%' },
    colItem: { width: '47%' },
    colQty: { width: '12%', textAlign: 'center' },
    colPrice: { width: '16%', textAlign: 'right' },
    colTotal: { width: '17%', textAlign: 'right' },
    totals: { marginTop: 25, alignItems: 'flex-end' },
    totalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 5, fontSize: 9 },
    grandTotal: { flexDirection: 'row', width: 220, justifyContent: 'space-between', paddingVertical: 10, fontSize: 12, fontWeight: 'bold', backgroundColor: '#8b5cf6', color: '#FFFFFF', paddingHorizontal: 15, marginTop: 8 },
    footer: { position: 'absolute', bottom: 35, left: 45, right: 45, textAlign: 'center', fontSize: 8, color: '#9ca3af', fontStyle: 'italic' },
});

interface ElegantTemplateProps {
    order: Order;
    orderItems: OrderItem[];
    restaurant: Restaurant;
}

export const ElegantTemplate = ({ order, orderItems, restaurant }: ElegantTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.companyName}>{restaurant.name}</Text>
                <Text style={styles.detail}>{restaurant.address}</Text>
                <Text style={styles.detail}>{restaurant.phone}</Text>
                {restaurant.gst_number && <Text style={styles.detail}>GSTIN: {restaurant.gst_number}</Text>}
            </View>

            <Text style={styles.invoiceTitle}>INVOICE</Text>

            <View style={styles.infoSection}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Billed To</Text>
                    <Text style={styles.infoValue}>{order.customer_name || 'Walk-in Customer'}</Text>
                    {order.customer_phone && <Text style={styles.detail}>Ph: {order.customer_phone}</Text>}
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Invoice Details</Text>
                    <Text style={styles.infoValue}>Invoice #: {order.bill_number}</Text>
                    <Text style={styles.detail}>Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</Text>
                    <Text style={styles.detail}>Payment: {order.payment_method.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colSr}>#</Text>
                    <Text style={styles.colItem}>Description</Text>
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

            <View style={styles.totals}>
                <View style={styles.totalRow}>
                    <Text>Subtotal</Text>
                    <Text>₹{order.subtotal.toFixed(2)}</Text>
                </View>
                {order.gst_enabled && (
                    <View style={styles.totalRow}>
                        <Text>GST ({restaurant.gst_percentage}%)</Text>
                        <Text>₹{order.gst_amount.toFixed(2)}</Text>
                    </View>
                )}
                <View style={styles.grandTotal}>
                    <Text>TOTAL</Text>
                    <Text>₹{order.total.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text>Thank you for choosing {restaurant.name}. We appreciate your business!</Text>
            </View>
        </Page>
    </Document>
);
