import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Order, OrderItem, Restaurant } from '@/types';

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    colorBar: {
        height: 15,
        backgroundColor: '#10b981',
    },
    content: {
        padding: 40,
    },
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    companyInfo: {
        width: '55%',
    },
    companyName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 10,
    },
    companyDetail: {
        fontSize: 9,
        color: '#6b7280',
        marginBottom: 3,
    },
    invoiceBox: {
        width: '40%',
        backgroundColor: '#ecfdf5',
        padding: 15,
        borderRadius: 8,
    },
    invoiceLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 10,
    },
    invoiceDetail: {
        fontSize: 9,
        color: '#374151',
        marginBottom: 4,
    },
    customerSection: {
        backgroundColor: '#f9fafb',
        padding: 15,
        marginBottom: 25,
        borderLeft: 4,
        borderLeftColor: '#10b981',
    },
    customerLabel: {
        fontSize: 9,
        color: '#6b7280',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    customerName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        padding: 12,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 9,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        padding: 12,
        fontSize: 10,
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        padding: 12,
        fontSize: 10,
        backgroundColor: '#f9fafb',
    },
    colSr: { width: '8%' },
    colItem: { width: '45%' },
    colQty: { width: '12%', textAlign: 'center' },
    colPrice: { width: '17%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right', fontWeight: 'bold' },
    summarySection: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    summaryBox: {
        width: 280,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#10b981',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#9ca3af',
    },
});

interface ModernTemplateProps {
    order: Order;
    orderItems: OrderItem[];
    restaurant: Restaurant;
}

export const ModernTemplate = ({ order, orderItems, restaurant }: ModernTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.colorBar} />

            <View style={styles.content}>
                <View style={styles.headerSection}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{restaurant.name}</Text>
                        <Text style={styles.companyDetail}>{restaurant.address}</Text>
                        <Text style={styles.companyDetail}>📞 {restaurant.phone}</Text>
                        {restaurant.gst_number && (
                            <Text style={styles.companyDetail}>GSTIN: {restaurant.gst_number}</Text>
                        )}
                    </View>

                    <View style={styles.invoiceBox}>
                        <Text style={styles.invoiceLabel}>INVOICE</Text>
                        <Text style={styles.invoiceDetail}>Invoice #: {order.bill_number}</Text>
                        <Text style={styles.invoiceDetail}>
                            Date: {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </Text>
                        <Text style={styles.invoiceDetail}>
                            Payment: {order.payment_method.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.customerSection}>
                    <Text style={styles.customerLabel}>Bill To</Text>
                    <Text style={styles.customerName}>{order.customer_name || 'Walk-in Customer'}</Text>
                    {order.customer_phone && (
                        <Text style={styles.companyDetail}>Phone: {order.customer_phone}</Text>
                    )}
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colSr}>#</Text>
                        <Text style={styles.colItem}>Description</Text>
                        <Text style={styles.colQty}>Qty</Text>
                        <Text style={styles.colPrice}>Price</Text>
                        <Text style={styles.colTotal}>Total</Text>
                    </View>
                    {orderItems.map((item, i) => (
                        <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                            <Text style={styles.colSr}>{i + 1}</Text>
                            <Text style={styles.colItem}>{item.item_name}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>₹{item.price.toFixed(2)}</Text>
                            <Text style={styles.colTotal}>₹{item.total_price.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summarySection}>
                    <View style={styles.summaryBox}>
                        <View style={styles.summaryRow}>
                            <Text>Subtotal</Text>
                            <Text>₹{order.subtotal.toFixed(2)}</Text>
                        </View>
                        {order.gst_enabled && (
                            <View style={styles.summaryRow}>
                                <Text>GST ({restaurant.gst_percentage}%)</Text>
                                <Text>₹{order.gst_amount.toFixed(2)}</Text>
                            </View>
                        )}
                        <View style={styles.totalRow}>
                            <Text>TOTAL</Text>
                            <Text>₹{order.total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>Thank you for your business! We appreciate your patronage.</Text>
                </View>
            </View>
        </Page>
    </Document>
);
