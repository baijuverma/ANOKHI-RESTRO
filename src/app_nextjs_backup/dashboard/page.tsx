
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { DashboardDateFilter } from "@/components/dashboard/DashboardDateFilter";

const StatsPieChart = dynamic(() => import('@/components/reports/StatsPieChart'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Chart...</div>
});

// Demo data for when Supabase is not configured
const DEMO_ORDERS = [
    { id: "1", bill_number: "BILL-001", customer_name: "Rajesh Kumar", total: 1250, gst_amount: 225, status: "completed", payment_mode: "cash", created_at: new Date().toISOString() },
    { id: "2", bill_number: "BILL-002", customer_name: "Priya Sharma", total: 2100, gst_amount: 378, status: "completed", payment_mode: "upi", created_at: new Date().toISOString() },
    { id: "3", bill_number: "BILL-003", customer_name: "Amit Patel", total: 850, gst_amount: 153, status: "completed", payment_mode: "cash", created_at: new Date().toISOString() },
    { id: "4", bill_number: "BILL-004", customer_name: "Sneha Gupta", total: 3200, gst_amount: 576, status: "pending", payment_mode: "credit", amount_paid: 1000, created_at: new Date().toISOString() },
    { id: "5", bill_number: "BILL-005", customer_name: "Walk-in Customer", total: 5050, gst_amount: 909, status: "completed", payment_mode: "upi", amount_paid: 5050, created_at: new Date().toISOString() },
];

const parseDate = (dateString: string | undefined, defaultDate: Date) => {
    if (!dateString) return defaultDate;
    try {
        const date = parseISO(dateString);
        return isValid(date) ? date : defaultDate;
    } catch {
        return defaultDate;
    }
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const isConfigured = isServerSupabaseConfigured();

    // Parse Dates
    const getParam = (key: string) => {
        const val = searchParams?.[key];
        return Array.isArray(val) ? val[0] : val;
    };

    const fromParam = getParam('from');
    const toParam = getParam('to');

    const startDate = fromParam ? startOfDay(parseDate(fromParam, new Date())) : startOfDay(new Date());
    const endDate = toParam ? endOfDay(parseDate(toParam, new Date())) : endOfDay(new Date());

    let dailyOrders: any[] = [];

    if (isConfigured) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: userProfile } = await supabase
                .from("users")
                .select("restaurant_id")
                .eq("id", user.id)
                .maybeSingle();

            const restaurantId = userProfile?.restaurant_id;

            if (restaurantId) {
                // Fetch orders in range
                const { data: orders } = await supabase
                    .from("orders")
                    .select("*")
                    .eq("restaurant_id", restaurantId)
                    .gte("created_at", startDate.toISOString())
                    .lte("created_at", endDate.toISOString());

                dailyOrders = orders || [];
            }
        }
    } else {
        // Demo mode
        dailyOrders = DEMO_ORDERS;
    }

    // Calculate Aggregates
    let totalCash = 0;
    let totalUpi = 0;
    let totalDues = 0;
    let totalCancelled = 0;
    let totalCashCount = 0;
    let totalUpiCount = 0;
    let totalDuesCount = 0;
    let cancelledOrdersCount = 0;
    let activeOrdersCount = 0;

    dailyOrders.forEach((order: any) => {
        if (order.status === 'cancelled') {
            totalCancelled += Number(order.total || 0);
            cancelledOrdersCount++;
            return;
        }

        // Robust classification
        let mode = (order.payment_mode || '').toLowerCase();
        if (!mode) {
            // Fallback if payment_mode is missing
            mode = (order.status === 'pending' || order.status === 'unpaid') ? 'due' : 'cash';
        }

        const amount = Number(order.total || 0);

        if (mode === 'upi') {
            totalUpi += amount;
            totalUpiCount++;
        } else if (['credit', 'due', 'unpaid'].includes(mode)) {
            totalDues += amount;
            totalDuesCount++;
        } else {
            totalCash += amount;
            totalCashCount++;
        }
        activeOrdersCount++;
    });

    const netRevenue = totalCash + totalUpi + totalDues;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Chart */}
                <div className="lg:col-span-1 bg-card rounded-lg border shadow-sm p-4 flex flex-col justify-center min-h-[400px]">
                    <h3 className="text-lg font-semibold mb-4 text-center">Sales Distribution</h3>
                    <StatsPieChart data={{ totalCash, totalUpi, totalDues }} />
                </div>

                {/* Right: Filters & Cards */}
                <div className="lg:col-span-2 space-y-4">
                    <DashboardDateFilter />

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {/* Cash */}
                        <Card className="bg-emerald-50 border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-emerald-900">Total Cash Sales</p>
                                <h3 className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalCash)}</h3>
                                <p className="text-xs text-emerald-600 mt-1 font-medium">{totalCashCount} Cash Bills</p>
                            </CardContent>
                        </Card>
                        {/* UPI */}
                        <Card className="bg-sky-50 border-sky-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-sky-900">Total UPI Sales</p>
                                <h3 className="text-2xl font-bold text-sky-700 mt-1">{formatCurrency(totalUpi)}</h3>
                                <p className="text-xs text-sky-600 mt-1 font-medium">{totalUpiCount} UPI Bills</p>
                            </CardContent>
                        </Card>
                        {/* Dues */}
                        <Card className="bg-amber-50 border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-amber-900">Total Dues</p>
                                <h3 className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(totalDues)}</h3>
                                <p className="text-xs text-amber-600 mt-1 font-medium">{totalDuesCount} Pending Bills</p>
                            </CardContent>
                        </Card>
                        {/* Net Revenue */}
                        <Card className="bg-violet-50 border-violet-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-violet-900">Net Revenue</p>
                                <h3 className="text-2xl font-bold text-violet-700 mt-1">{formatCurrency(netRevenue)}</h3>
                                <p className="text-xs text-violet-600 mt-1 font-medium">{activeOrdersCount} Active Orders</p>
                            </CardContent>
                        </Card>
                        {/* Cancelled */}
                        <Card className="bg-rose-50 border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-rose-900">Cancelled Bills</p>
                                <h3 className="text-2xl font-bold text-rose-700 mt-1">{formatCurrency(totalCancelled)}</h3>
                                <p className="text-xs text-rose-600 mt-1 font-medium">{cancelledOrdersCount} Bills Cancelled</p>
                            </CardContent>
                        </Card>
                        {/* Total Orders */}
                        <Card className="bg-slate-50 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <p className="text-sm font-medium text-slate-900">Total Orders</p>
                                <h3 className="text-2xl font-bold text-slate-700 mt-1">{dailyOrders.length}</h3>
                                <p className="text-xs text-slate-600 mt-1 font-medium">All Statuses</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bill No</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyOrders.slice(0, 5).map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell>{order.bill_number}</TableCell>
                                            <TableCell>{order.customer_name || 'N/A'}</TableCell>
                                            <TableCell>{formatCurrency(order.total)}</TableCell>
                                            <TableCell>{order.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Items (Coming Soon)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">Top selling items will appear here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
