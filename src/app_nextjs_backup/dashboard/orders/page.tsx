
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarIcon, Search, ArrowLeft, Loader2, XCircle, Printer, Download, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const DownloadReportButton = dynamic(
    () => import("@/components/reports/DownloadReportButton"),
    { ssr: false, loading: () => <Button disabled variant="outline">Loading PDF...</Button> }
);

const ORDERS_PER_PAGE = 20;

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [lastCursor, setLastCursor] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentModeFilter, setPaymentModeFilter] = useState("all");

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setOrders([]);
            setLastCursor(null);
            const supabase = createClient();
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: userProfile } = await supabase.from("users").select("restaurant_id").eq("id", user.id).single();
                const restaurantId = userProfile?.restaurant_id;

                if (restaurantId) {
                    let query = supabase
                        .from("orders")
                        .select(`
                            *,
                            items:order_items(count)
                        `)
                        .eq("restaurant_id", restaurantId)
                        .order("created_at", { ascending: false })
                        .limit(ORDERS_PER_PAGE + 1);

                    if (fromDate) {
                        const start = new Date(fromDate);
                        start.setHours(0, 0, 0, 0);
                        query = query.gte("created_at", start.toISOString());
                    }

                    if (toDate) {
                        const end = new Date(toDate);
                        end.setHours(23, 59, 59, 999);
                        query = query.lte("created_at", end.toISOString());
                    }

                    const { data: ordersData, error } = await query;

                    if (error) throw error;

                    const hasMoreData = (ordersData || []).length > ORDERS_PER_PAGE;
                    const displayData = hasMoreData ? ordersData!.slice(0, ORDERS_PER_PAGE) : (ordersData || []);

                    setOrders(displayData);
                    setHasMore(hasMoreData);
                    if (hasMoreData && displayData.length > 0) {
                        setLastCursor(displayData[displayData.length - 1].created_at);
                    }
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [fromDate, toDate]); // Re-fetch when date filter changes

    const loadMoreOrders = async () => {
        if (!lastCursor || loadingMore) return;

        setLoadingMore(true);
        const supabase = createClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userProfile } = await supabase.from("users").select("restaurant_id").eq("id", user.id).single();
            const restaurantId = userProfile?.restaurant_id;

            if (restaurantId) {
                let query = supabase
                    .from("orders")
                    .select(`
                        *,
                        items:order_items(count)
                    `)
                    .eq("restaurant_id", restaurantId)
                    .order("created_at", { ascending: false })
                    .lt("created_at", lastCursor)
                    .limit(ORDERS_PER_PAGE + 1);

                if (fromDate) {
                    const start = new Date(fromDate);
                    start.setHours(0, 0, 0, 0);
                    query = query.gte("created_at", start.toISOString());
                }

                if (toDate) {
                    const end = new Date(toDate);
                    end.setHours(23, 59, 59, 999);
                    query = query.lte("created_at", end.toISOString());
                }

                const { data: moreOrders, error } = await query;

                if (error) throw error;

                const hasMoreData = (moreOrders || []).length > ORDERS_PER_PAGE;
                const displayData = hasMoreData ? moreOrders!.slice(0, ORDERS_PER_PAGE) : (moreOrders || []);

                setOrders(prev => [...prev, ...displayData]);
                setHasMore(hasMoreData);
                if (hasMoreData && displayData.length > 0) {
                    setLastCursor(displayData[displayData.length - 1].created_at);
                } else {
                    setLastCursor(null);
                }
            }
        } catch (error) {
            console.error("Error loading more orders:", error);
            toast.error("Failed to load more orders");
        } finally {
            setLoadingMore(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to CANCEL this bill? It will be marked as cancelled but not deleted.")) return;

        const supabase = createClient();
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: 'cancelled' })
                .eq("id", orderId);

            if (error) throw error;

            setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
            toast.success("Bill cancelled successfully");
        } catch (error: any) {
            toast.error("Failed to cancel bill: " + error.message);
        }
    };

    // Client-side search filtering
    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.bill_number?.toString().includes(searchQuery) ||
            order.customer_phone?.includes(searchQuery);

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesPayment = paymentModeFilter === "all" || (order.payment_mode || 'cash').toLowerCase() === paymentModeFilter;

        return matchesSearch && matchesStatus && matchesPayment;
    });

    const activeOrders = filteredOrders.filter(o => o.status !== 'cancelled');
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');

    const totalOrders = activeOrders.length;

    const totalDuesOrders = activeOrders.filter(o => ['credit', 'due', 'unpaid'].includes((o.payment_mode || '').toLowerCase()));
    const totalDues = totalDuesOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalDuesCount = totalDuesOrders.length;

    const totalCashOrders = activeOrders.filter(o => {
        const mode = (o.payment_mode || 'cash').toLowerCase();
        return mode !== 'upi' && !['credit', 'due', 'unpaid'].includes(mode);
    });
    const totalCash = totalCashOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalCashCount = totalCashOrders.length;

    const totalUpiOrders = activeOrders.filter(o => (o.payment_mode || 'cash').toLowerCase() === 'upi');
    const totalUpi = totalUpiOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalUpiCount = totalUpiOrders.length;

    const netRevenue = totalCash + totalUpi + totalDues;

    const totalCancelledCount = cancelledOrders.length;
    const totalCancelledAmount = cancelledOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    return (
        <div className="space-y-6">


            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm items-center">
                <div className="relative w-full lg:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Bill No, Name..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <select
                        className="h-10 w-full sm:w-[130px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                        className="h-10 w-full sm:w-[130px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={paymentModeFilter}
                        onChange={(e) => setPaymentModeFilter(e.target.value)}
                    >
                        <option value="all">All Payment</option>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full lg:justify-end">
                    <div className="relative w-full sm:w-[180px]">
                        <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="date"
                            className="pl-9 pr-8 w-full"
                            value={fromDate}
                            max="9999-12-31"
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                        {fromDate && (
                            <X
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors z-10"
                                onClick={() => setFromDate('')}
                            />
                        )}
                    </div>
                    <span className="text-muted-foreground hidden sm:block">-</span>
                    <div className="relative w-full sm:w-[180px]">
                        <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-medium">To</span>
                        <Input
                            type="date"
                            className="pl-8 pr-8 w-full"
                            value={toDate}
                            max="9999-12-31"
                            onChange={(e) => setToDate(e.target.value)}
                        />
                        {toDate && (
                            <X
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-red-500 transition-colors z-10"
                                onClick={() => setToDate('')}
                            />
                        )}
                    </div>
                    {(fromDate || toDate || statusFilter !== 'all' || paymentModeFilter !== 'all') && (
                        <Button variant="ghost" onClick={() => { setFromDate(""); setToDate(""); setStatusFilter("all"); setPaymentModeFilter("all"); }}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary for Filtered View */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Card className="bg-green-50/50 border-green-100">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-green-800">Total Cash Sales</p>
                        <h3 className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalCash)}</h3>
                        <p className="text-xs text-green-600 mt-1">{totalCashCount} Cash Bills</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-blue-800">Total UPI Sales</p>
                        <h3 className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(totalUpi)}</h3>
                        <p className="text-xs text-blue-600 mt-1">{totalUpiCount} UPI Bills</p>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50/50 border-yellow-100">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-yellow-800">Total Dues</p>
                        <h3 className="text-2xl font-bold text-yellow-700 mt-1">{formatCurrency(totalDues)}</h3>
                        <p className="text-xs text-yellow-600 mt-1">{totalDuesCount} Pending Bills</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-muted-foreground">Net Revenue</p>
                        <h3 className="text-2xl font-bold mt-1">{formatCurrency(netRevenue)}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{totalOrders} Active Orders</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50/50 border-red-100">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-red-800">Cancelled Bills</p>
                        <h3 className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(totalCancelledAmount)}</h3>
                        <p className="text-xs text-red-600 mt-1">{totalCancelledCount} Bills Cancelled</p>
                    </CardContent>
                </Card>
            </div>

            {/* Orders Table */}
            <div className="rounded-md border bg-card">
                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[100px]">Date</TableHead>
                                    <TableHead>Bill No</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Payment Mode</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                                            No orders found matching your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id} className={order.status === 'cancelled' ? 'bg-muted/50' : ''}>
                                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                {formatDate(order.created_at)}
                                            </TableCell>
                                            <TableCell className="font-medium">#{order.bill_number}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="whitespace-nowrap">{order.customer_name || 'Guest'}</span>
                                                    <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{order.items?.[0]?.count || order.items?.length || 0} Items</TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'completed' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {order.payment_mode || 'cash'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                <span className={order.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}>
                                                    {formatCurrency(order.total)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => window.open(`/print/bill/${order.id}`, '_blank', 'width=400,height=600')}
                                                        title="Print Copy"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    {order.status !== 'cancelled' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            title="Cancel Bill"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Load More Button */}
            {hasMore && !loading && filteredOrders.length > 0 && (
                <div className="flex justify-center py-4">
                    <Button
                        onClick={loadMoreOrders}
                        disabled={loadingMore}
                        variant="outline"
                        className="min-w-[200px]"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More Orders'
                        )}
                    </Button>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <DownloadReportButton orders={filteredOrders} fromDate={fromDate} toDate={toDate} />
            </div>
        </div>
    );
}
