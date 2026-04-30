import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Order, OrderItem, Restaurant } from '@/types';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
    headerBar: { backgroundColor: '#1e293b', padding: 20, marginBottom: 30, color: '#FFFFFF' },
    companyName: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    tagline: { fontSize: 9, color: '#cbd5e1' },
    headerInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, fontSize: 9 },
    invoiceTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    gridBox: { width: '48%', padding: 12, backgroundColor: '#f8fafc', border: 1, borderColor: '#e2e8f0' },
    boxTitle: { fontSize: 8, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', fontWeight: 'bold' },
    boxContent: { fontSize: 10, color: '#0f172a', marginBottom: 3 },
    table: { marginTop: 15 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#334155', color: '#FFFFFF', padding: 10, fontSize: 9, fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 10, fontSize: 9 },
    colSr: { width: '8%' },
    colItem: { width: '45%' },
    colQty: { width: '12%', textAlign: 'center' },
    colPrice: { width: '17%', textAlign: 'right' },
    colTotal: { width: '18%', textAlign: 'right' },
    summarySection: { marginTop: 25, flexDirection: 'row', justifyContent: 'space-between' },
    notes: { width: '50%', fontSize: 8, color: '#64748b' },
    totalsBox: { width: '45%' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', fontSize: 10 },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#1e293b', color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: 1, borderTopColor: '#e2e8f0', paddingTop: 15, fontSize: 8, color: '#64748b', textAlign: 'center' },
});

interface ProfessionalTemplateProps {
    order: Order;
    orderItems: OrderItem[];
    restaurant: Restaurant;
}

export const ProfessionalTemplate = ({ order, orderItems, restaurant }: ProfessionalTemplateProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.headerBar}>
                <Text style={styles.companyName}>{restaurant.name}</Text>
                <Text style={styles.tagline}>Quality Service & Excellence</Text>
                <View style={styles.headerInfo}>
                    <Text>{restaurant.address}</Text>
                    <Text>Phone: {restaurant.phone}</Text>
                    {restaurant.gst_number && <Text>GSTIN: {restaurant.gst_number}</Text>}
                </View>
            </View>

            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>

            <View style={styles.grid}>
                <View style={styles.gridBox}>
                    <Text style={styles.boxTitle}>Customer Information</Text>
                    <Text style={styles.boxContent}>{order.customer_name || 'Walk-in Customer'}</Text>
                    {order.customer_phone && <Text style={styles.boxContent}>Phone: {order.customer_phone}</Text>}
                </View>
                <View style={styles.gridBox}>
                    <Text style={styles.boxTitle}>Invoice Information</Text>
                    <Text style={styles.boxContent}>Invoice #: {order.bill_number}</Text>
                    <Text style={styles.boxContent}>Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</Text>
                    <Text style={styles.boxContent}>Payment: {order.payment_method.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colSr}>SR</Text>
                    <Text style={styles.colItem}>ITEM DESCRIPTION</Text>
                    <Text style={styles.colQty}>QTY</Text>
                    <Text style={styles.colPrice}>RATE</Text>
                    <Text style={styles.colTotal}>AMOUNT</Text>
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

            <View style={styles.summarySection}>
                <View style={styles.notes}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Terms & Conditions:</Text>
                    <Text>• Payment is due upon receipt</Text>
                    <Text>• All disputes subject to local jurisdiction</Text>
                </View>
                <View style={styles.totalsBox}>
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
                    <View style={styles.grandTotalRow}>
                        <Text>GRAND TOTAL</Text>
                        <Text>₹{order.total.toFixed(2)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text>This is a computer-generated invoice. For queries, contact {restaurant.phone}</Text>
            </View>
        </Page>
    </Document>
);
