
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function DuesPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalDues, setTotalDues] = useState(0);

    useEffect(() => {
        const fetchDues = async () => {
            const supabase = createClient();
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: userProfile } = await supabase.from("users").select("restaurant_id").eq("id", user.id).single();
                const restaurantId = userProfile?.restaurant_id;

                if (restaurantId) {
                    const { data: allOrders, error } = await supabase
                        .from("orders")
                        .select("*")
                        .eq("restaurant_id", restaurantId)
                        .order("created_at", { ascending: false });

                    if (error) throw error;

                    const pendingOrders = (allOrders || [])
                        .filter((order: any) => {
                            const total = order.total || 0;
                            const paid = order.amount_paid || 0;
                            // Consider due if paid is less than total (and margin of error for float)
                            return paid < (total - 0.1);
                        })
                        .map((order: any) => ({
                            ...order,
                            due_amount: (order.total || 0) - (order.amount_paid || 0)
                        }));

                    setOrders(pendingOrders);
                    setTotalDues(pendingOrders.reduce((sum: number, order: any) => sum + order.due_amount, 0));
                }
            } catch (error) {
                console.error("Error fetching dues:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDues();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pending Dues Report</h1>
                    <p className="text-sm text-muted-foreground">List of all unpaid or partially paid bills</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-red-50 border-red-100 col-span-1 md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Total Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDues)}</div>
                        <p className="text-xs text-red-600/80 mt-1">From {orders.length} customers</p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Bill No</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Bill Amount</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Due Balance</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                                    No pending dues found! Everyone has paid. 🎉
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(order.created_at)}
                                    </TableCell>
                                    <TableCell className="font-medium">#{order.bill_number}</TableCell>
                                    <TableCell className="font-medium">{order.customer_name || 'Guest'}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{order.customer_phone || '-'}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(order.amount_paid || 0)}</TableCell>
                                    <TableCell className="text-right font-bold text-red-600 bg-red-50/50">
                                        {formatCurrency(order.due_amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/orders?id=${order.id}`} className="text-xs text-blue-600 hover:underline">
                                            View Order
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
