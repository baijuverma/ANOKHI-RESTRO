
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Order, OrderItem, Restaurant } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 5,
    },
    section: {
        margin: 10,
        padding: 10,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingVertical: 5,
    },
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingVertical: 5,
        fontWeight: 'bold',
    },
    colSr: { width: '10%', textAlign: 'center' },
    colItem: { width: '40%' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '20%', textAlign: 'right' },
    colTotal: { width: '20%', textAlign: 'right' },
    totalSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        paddingVertical: 3,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        paddingRight: 10,
    },
    totalValue: {
        width: 80,
        textAlign: 'right',
    },
});

interface BillPDFProps {
    order: Order;
    orderItems: OrderItem[];
    restaurant: Restaurant;
}

export const BillPDFDocument = ({ order, orderItems, restaurant }: BillPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>{restaurant.name}</Text>
                <Text style={styles.subtitle}>{restaurant.address}</Text>
                <Text style={styles.subtitle}>Phone: {restaurant.phone}</Text>
                <Text style={styles.subtitle}>GSTIN: {restaurant.gst_number}</Text>
            </View>

            <View style={styles.section}>
                <Text>Bill No: {order.bill_number}</Text>
                <Text>Date: {formatDate(order.created_at)}</Text>
                <Text>Customer: {order.customer_name}</Text>
            </View>

            <View style={styles.section}>
                <View style={styles.headerRow}>
                    <Text style={styles.colSr}>SR</Text>
                    <Text style={styles.colItem}>Item</Text>
                    <Text style={styles.colQty}>Qty</Text>
                    <Text style={styles.colPrice}>Price</Text>
                    <Text style={styles.colTotal}>Total</Text>
                </View>
                {orderItems.map((item, i) => (
                    <View key={item.id} style={styles.row}>
                        <Text style={styles.colSr}>{i + 1}</Text>
                        <Text style={styles.colItem}>{item.item_name}</Text>
                        <Text style={styles.colQty}>{item.quantity}</Text>
                        <Text style={styles.colPrice}>{item.price.toFixed(2)}</Text>
                        <Text style={styles.colTotal}>{item.total_price.toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>{order.subtotal.toFixed(2)}</Text>
                </View>
                {order.gst_enabled && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>GST ({restaurant.gst_percentage}%):</Text>
                        <Text style={styles.totalValue}>{order.gst_amount.toFixed(2)}</Text>
                    </View>
                )}
                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>Total:</Text>
                    <Text style={[styles.totalValue, { fontWeight: 'bold' }]}>{order.total.toFixed(2)}</Text>
                </View>
            </View>

            <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center' }}>
                <Text>Thank you for visiting!</Text>
            </View>
        </Page>
    </Document>
);
