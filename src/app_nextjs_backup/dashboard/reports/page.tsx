import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WeeklySalesChart } from "@/components/reports/WeeklySalesChart";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { formatCurrency } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay, isValid, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

const parseDate = (dateString: string | undefined, defaultDate: Date) => {
    if (!dateString) return defaultDate;
    try {
        const date = parseISO(dateString);
        return isValid(date) ? date : defaultDate;
    } catch {
        return defaultDate;
    }
}

export default async function ReportsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    try {
        const isConfigured = isServerSupabaseConfigured();

        // Safely extract params handling arrays
        const getParam = (key: string) => {
            const val = searchParams?.[key];
            return Array.isArray(val) ? val[0] : val;
        };

        const fromParam = getParam('from');
        const toParam = getParam('to');
        const modeParam = getParam('mode');
        const statusParam = getParam('status');

        const endDate = toParam ? endOfDay(parseDate(toParam, new Date())) : endOfDay(new Date());
        const startDate = fromParam ? startOfDay(parseDate(fromParam, new Date())) : startOfDay(new Date());

        const dateRangeLabel = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;

        let chartData: { name: string; total: number }[] = [];
        let totalCash = 0;
        let totalUpi = 0;
        let totalDues = 0;
        let totalCancelled = 0;
        let activeOrdersCount = 0;
        let cancelledOrdersCount = 0;
        let totalCashCount = 0;
        let totalUpiCount = 0;
        let totalDuesCount = 0;

        if (isConfigured) {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: userProfile } = await supabase.from("users").select("restaurant_id").eq("id", user.id).maybeSingle();
                const restaurantId = userProfile?.restaurant_id;

                if (restaurantId) {
                    // Fetch orders in range
                    const { data: orders } = await supabase
                        .from("orders")
                        .select("*")
                        .eq("restaurant_id", restaurantId)
                        .gte("created_at", startDate.toISOString())
                        .lte("created_at", endDate.toISOString());

                    if (orders) {
                        try {
                            // Apply Status Filter
                            const filteredOrders = statusParam && statusParam !== 'all'
                                ? orders.filter(o => o.status === statusParam)
                                : orders;

                            // Process Cancelled vs Active
                            const activeOrders = filteredOrders.filter(o => o.status !== 'cancelled');
                            const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');

                            activeOrdersCount = activeOrders.length;
                            cancelledOrdersCount = cancelledOrders.length;

                            // Calculate Cancelled Amount
                            totalCancelled = cancelledOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

                            // Calculate Active Sales (Cash vs UPI vs Dues)
                            activeOrders.forEach(order => {
                                const mode = (order.payment_mode || 'cash').toLowerCase();
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
                            });

                            // Filter for Chart
                            const chartSourceOrders = modeParam && modeParam !== 'all'
                                ? activeOrders.filter(o => (o.payment_mode || 'cash').toLowerCase() === modeParam)
                                : activeOrders;

                            // Aggregate for Chart
                            const dayMap = new Map();
                            const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
                            const safeDaysDiff = Math.max(0, Math.min(daysDifference, 365)); // Ensure non-negative and capped

                            if (safeDaysDiff <= 31) {
                                // Initialize days
                                for (let i = 0; i <= safeDaysDiff; i++) {
                                    const d = new Date(startDate);
                                    d.setDate(d.getDate() + i);
                                    if (d > endDate) break;
                                    const name = format(d, 'MMM d');
                                    dayMap.set(name, 0);
                                }
                            }

                            chartSourceOrders.forEach(order => {
                                try {
                                    const d = new Date(order.created_at);
                                    if (isValid(d)) {
                                        const name = format(d, 'MMM d');
                                        const amount = Number(order.total || 0);
                                        if (safeDaysDiff <= 31) {
                                            if (dayMap.has(name)) {
                                                dayMap.set(name, dayMap.get(name) + amount);
                                            }
                                        } else {
                                            dayMap.set(name, (dayMap.get(name) || 0) + amount);
                                        }
                                    }
                                } catch (e) {
                                    // Ignore invalid dates
                                }
                            });

                            if (safeDaysDiff <= 31) {
                                chartData = Array.from(dayMap, ([name, total]) => ({ name, total }));
                            } else {
                                chartData = Array.from(dayMap, ([name, total]) => ({ name, total })).slice(0, 30);
                            }
                        } catch (err) {
                            console.error("Error processing report data internals:", err);
                        }
                    }
                }
            }
        } else {
            // Demo
            totalCash = 15000;
            totalUpi = 8500;
            totalDues = 2300;
            totalCancelled = 1200;
            activeOrdersCount = 45;
            cancelledOrdersCount = 3;

            chartData = [
                { name: "Mon", total: 1200 },
                { name: "Tue", total: 2100 },
                { name: "Wed", total: 800 },
                { name: "Thu", total: 1600 },
                { name: "Fri", total: 2400 },
                { name: "Sat", total: 3200 },
                { name: "Sun", total: 4500 },
            ];
        }

        // Final safety checks
        totalCash = Number(totalCash) || 0;
        totalUpi = Number(totalUpi) || 0;
        totalDues = Number(totalDues) || 0;
        totalCancelled = Number(totalCancelled) || 0;
        if (!Array.isArray(chartData)) chartData = [];

        return (
            <div className="space-y-6 animate-in fade-in duration-500">


                <ReportFilters />

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <Card className="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Total Cash Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalCash)}</div>
                            <p className="text-xs text-green-600/80 dark:text-green-400/80">{totalCashCount} Cash Bills</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total UPI Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalUpi)}</div>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">{totalUpiCount} UPI Bills</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-50/50 border-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Total Dues</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{formatCurrency(totalDues)}</div>
                            <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">{totalDuesCount} Pending Bills</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalCash + totalUpi + totalDues)}</div>
                            <p className="text-xs text-muted-foreground">{activeOrdersCount} Active Orders</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Cancelled Bills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{formatCurrency(totalCancelled)}</div>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80">{cancelledOrdersCount} Bills Cancelled</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Trend {modeParam && modeParam !== 'all' ? `(${modeParam.toUpperCase()})` : ''}</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[300px]">
                                <WeeklySalesChart data={chartData} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    } catch (error: any) {
        console.error("Critical Error in ReportsPage:", error);
        return (
            <div className="p-8 border rounded-lg bg-red-50 text-red-900 mx-auto max-w-2xl mt-10">
                <h2 className="text-2xl font-bold mb-2">Unavailable to Load Reports</h2>
                <p>There was a problem loading the report data. Please check your internet connection or try refreshing the page.</p>
                <p className="mt-2 text-sm opacity-70">Error Details: {error?.message || "Unknown error"}</p>
            </div>
        )
    }
}
