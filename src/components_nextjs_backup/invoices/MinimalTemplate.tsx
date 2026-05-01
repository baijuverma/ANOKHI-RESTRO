import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Order, OrderItem, Restaurant } from '@/types';

const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    header: {
        marginBottom: 40,
        paddingBottom: 15,
        borderBottom: 1,
        borderBottomColor: '#000000',
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    detail: {
        fontSize: 9,
        color: '#4b5563',
        marginBottom: 2,
    },
    invoiceTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 20,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 5,
        fontSize: 9,
    },
    label: {
        width: 100,
        color: '#6b7280',
    },
    value: {
        flex: 1,
        color: '#111827',
    },
    table: {
        marginTop: 30,
        marginBottom: 30,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#d1d5db',
        paddingVertical: 8,
        fontSize: 9,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 8,
        marginBottom: 8,
        fontSize: 9,
        fontWeight: 'bold',
    },
    colSr: { width: '10%' },
    colItem: { width: '50%' },
    colQty: { width: '10%', textAlign: 'right' },
    colPrice: { width: '15%', textAlign: 'right' },
    colTotal: { width: '15%', textAlign: 'right' },
    totals: {
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        width: 200,
        justifyContent: 'space-between',
        paddingVertical: 4,
        fontSize: 9,
    },
    grandTotal: {
        flexDirection: 'row',
        width: 200,
        justifyContent: 'space-between',
        paddingVertical: 8,
        fontSize: 11,
        fontWeight: 'bold',
        borderTop: 2,
        borderTopColor: '#000000',
        marginTop: 5,
    },
});

interface MinimalTemplateProps {
    order: Order;
    orderItems: OrderItem[];
    restaurant: Restaurant;
}

export const MinimalTemplate = ({ order, orderItems, restaurant }: MinimalTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.companyName}>{restaurant.name}</Text>
                <Text style={styles.detail}>{restaurant.address}</Text>
                <Text style={styles.detail}>{restaurant.phone}</Text>
                {restaurant.gst_number && (
                    <Text style={styles.detail}>GSTIN: {restaurant.gst_number}</Text>
                )}
            </View>

            <Text style={styles.invoiceTitle}>Invoice</Text>

            <View style={{ marginBottom: 30 }}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Invoice Number</Text>
                    <Text style={styles.value}>{order.bill_number}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Customer</Text>
                    <Text style={styles.value}>{order.customer_name || 'Walk-in Customer'}</Text>
                </View>
                {order.customer_phone && (
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.value}>{order.customer_phone}</Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Payment Method</Text>
                    <Text style={styles.value}>{order.payment_method.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colSr}>#</Text>
                    <Text style={styles.colItem}>Item</Text>
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
                    <Text>Total</Text>
                    <Text>₹{order.total.toFixed(2)}</Text>
                </View>
            </View>
        </Page>
    </Document>
);
