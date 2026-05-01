"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Item, Restaurant } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Printer, Send, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { pdf } from '@react-pdf/renderer';
import { BillPDFDocument } from './BillPDFDocument';

interface PosInterfaceProps {
    initialItems: Item[];
    restaurant: Restaurant | null;
}

function getCategoryStyles(category: string) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('start') || cat.includes('snack') || cat.includes('chaat')) return "bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300";
    if (cat.includes('main') || cat.includes('curry') || cat.includes('sabji')) return "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300";
    if (cat.includes('bread') || cat.includes('roti') || cat.includes('naan') || cat.includes('paratha')) return "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300";
    if (cat.includes('rice') || cat.includes('biryani') || cat.includes('pulao')) return "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300";
    if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('mithai')) return "bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300";
    if (cat.includes('bev') || cat.includes('drink') || cat.includes('coffee') || cat.includes('chai') || cat.includes('tea')) return "bg-sky-50 border-sky-200 hover:bg-sky-100 hover:border-sky-300";
    if (cat.includes('thali') || cat.includes('combo') || cat.includes('platter')) return "bg-violet-50 border-violet-200 hover:bg-violet-100 hover:border-violet-300";
    if (cat.includes('chinese') || cat.includes('momos') || cat.includes('chowmein')) return "bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300";
    if (cat.includes('south') || cat.includes('dosa') || cat.includes('idli')) return "bg-lime-50 border-lime-200 hover:bg-lime-100 hover:border-lime-300";
    return "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300";
}

export function PosInterface({ initialItems, restaurant }: PosInterfaceProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [items, setItems] = useState(initialItems);
    const [loading, setLoading] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [discount, setDiscount] = useState("");
    const [amountPaid, setAmountPaid] = useState("");
    const [secondAmountPaid, setSecondAmountPaid] = useState("");
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'both'>('cash');
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const {
        items: cartItems,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        gstEnabled,
        setGstEnabled,
        customerName,
        customerPhone,
        setCustomerInfo
    } = useCartStore();

    useEffect(() => {
        // Default GST to unchecked as per user request
        setGstEnabled(false);
    }, [setGstEnabled]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is already typing in another input (like Customer Name/Phone/Amount Paid)
            const activeElement = document.activeElement;
            const isOtherInput = (
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement
            ) && activeElement !== searchInputRef.current;

            if (isOtherInput) return;

            // Don't trigger if modifiers like Ctrl/Alt/Meta are used
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            // Focus search if user types a letter, number or space
            if (e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key)) {
                if (document.activeElement !== searchInputRef.current) {
                    searchInputRef.current?.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gstAmount = gstEnabled ? (subtotal * (restaurant?.gst_percentage || 5)) / 100 : 0;
    const discountValue = parseFloat(discount) || 0;
    const discountAmount = discountType === 'percentage'
        ? ((subtotal + gstAmount) * discountValue / 100)
        : discountValue;

    const total = Math.max(0, (subtotal + gstAmount) - discountAmount);

    const paidAmount = (parseFloat(amountPaid) || 0) + (paymentMode === 'both' ? (parseFloat(secondAmountPaid) || 0) : 0);
    const balance = paidAmount - total;
    const isDue = balance < 0;

    const configured = isSupabaseConfigured();

    const handleCreateOrder = async (print: boolean, whatsapp: boolean) => {
        if (cartItems.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        if (!customerName.trim()) {
            toast.error("Please enter Customer Name");
            return;
        }

        if (customerPhone && customerPhone.length !== 10) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }

        setLoading(true);

        try {
            if (configured) {
                // Real Supabase mode
                const supabase = createClient();

                const orderData = {
                    restaurant_id: restaurant?.id,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    gst_enabled: gstEnabled,
                    subtotal,
                    gst_amount: gstAmount,
                    total, // Final total after discount
                    status: 'completed',
                    payment_mode: paymentMode,
                    // Assuming columns added via SQL script
                    discount: discountAmount,
                    amount_paid: paidAmount,
                };

                const { data: order, error } = await supabase
                    .from("orders")
                    .insert(orderData)
                    .select()
                    .single();

                if (error) throw error;

                const orderItemsList = cartItems.map(item => ({
                    order_id: order.id,
                    item_id: item.item_id,
                    item_name: item.item_name,
                    quantity: item.quantity,
                    price: item.price,
                    total_price: item.total_price
                }));

                const { error: itemsError } = await supabase
                    .from("order_items")
                    .insert(orderItemsList);

                if (itemsError) throw itemsError;

                // Handle WhatsApp
                if (whatsapp && customerPhone && restaurant) {
                    toast.info("Generating PDF and sending...");
                    const fullOrder = { ...order, items: orderItemsList };
                    const blob = await pdf(
                        <BillPDFDocument
                            order={order as any}
                            orderItems={orderItemsList as any}
                            restaurant={restaurant}
                        />
                    ).toBlob();

                    const fileName = `bills/${order.id}.pdf`;
                    const { error: uploadError } = await supabase.storage
                        .from('bills')
                        .upload(fileName, blob, {
                            contentType: 'application/pdf',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error("Upload error", uploadError);
                        toast.error("Failed to upload bill for WhatsApp");
                    } else {
                        const { data: { publicUrl } } = supabase.storage.from('bills').getPublicUrl(fileName);
                        const { error: funcError } = await supabase.functions.invoke('send-whatsapp', {
                            body: {
                                phone: customerPhone,
                                pdfUrl: publicUrl,
                                customerName: customerName,
                                restaurantName: restaurant.name,
                                totalAmount: formatCurrency(total)
                            }
                        });

                        if (funcError) {
                            console.error("Function error", funcError);
                            toast.error("Failed to send WhatsApp message");
                        } else {
                            toast.success("Sent on WhatsApp");
                        }
                    }
                }

                if (print) {
                    window.open(`/print/bill/${order.id}`, '_blank', 'width=400,height=600');
                }
            } else {
                // Demo mode - just show success, no API calls
                const demoBillNo = `DEMO-${Date.now().toString().slice(-6)}`;
                toast.success(`Order ${demoBillNo} created! (Demo Mode)`);

                if (print) {
                    toast.info("Print preview is available with Supabase configured.");
                }
                if (whatsapp) {
                    toast.info("WhatsApp sending requires Supabase configuration.");
                }
            }

            clearCart();
            setDiscount("");
            setAmountPaid("");
            setSecondAmountPaid("");
            setPaymentMode("cash");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Mobile Tab Toggle */}
            <div className="flex lg:hidden border-b bg-white sticky top-0 z-10">
                <button
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${!showCart
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground"
                        }`}
                    onClick={() => setShowCart(false)}
                >
                    🍽️ Menu ({filteredItems.length})
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${showCart
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground"
                        }`}
                    onClick={() => setShowCart(true)}
                >
                    🛒 Cart
                    {cartItems.length > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* Desktop Unified Sticky Header */}
            <div className="hidden lg:flex items-center justify-between gap-4 sticky top-[-1px] bg-background z-30 pb-3 pt-0.5 px-1">
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={searchInputRef}
                        type="search"
                        placeholder="Search items..."
                        className="pl-10 h-11 bg-white border-slate-200 shadow-sm focus:ring-primary/20 focus:border-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>



                <div className="flex items-center gap-2 lg:w-[380px] xl:w-[420px] shrink-0">
                    <Input
                        placeholder="Customer Name"
                        className="h-11 bg-white border-slate-200 shadow-sm focus:ring-primary/20 focus:border-primary transition-all flex-1"
                        value={customerName}
                        onChange={(e) => setCustomerInfo(e.target.value, customerPhone)}
                    />
                    <div className="relative w-[140px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 pointer-events-none select-none">+91</span>
                        <Input
                            placeholder="Mobile"
                            className="h-11 pl-10 bg-white border-slate-200 shadow-sm focus:ring-primary/20 focus:border-primary transition-all w-full"
                            value={customerPhone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                if (val.length <= 10) {
                                    setCustomerInfo(customerName, val);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-3 sm:gap-4 overflow-hidden">
                {/* Left: Menu Items */}
                <div className={`flex-1 flex flex-col gap-3 min-w-0 ${showCart ? "hidden lg:flex" : "flex"}`}>
                    {/* Mobile Search */}
                    <div className="lg:hidden relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search items..."
                            className="pl-8 h-10 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 overflow-y-auto pb-4 max-h-[calc(100vh-240px)] lg:max-h-[calc(100vh-200px)]">
                        {filteredItems.map((item) => {
                            const categoryStyle = getCategoryStyles(item.category);
                            const cartItem = cartItems.find((ci) => ci.item_id === item.id);
                            const quantity = cartItem ? cartItem.quantity : 0;
                            const isSelected = quantity > 0;

                            return (
                                <Card
                                    key={item.id}
                                    className={`relative cursor-pointer active:scale-[0.95] transition-all m-[1px] p-[11px] sm:p-[15px] flex flex-col justify-between h-[92px] sm:h-[124px] border shadow-sm 
                                        ${categoryStyle} 
                                        ${isSelected ? 'ring-2 ring-primary ring-offset-1 border-primary shadow-lg scale-[1.02] z-10' : 'hover:shadow-md'}
                                    `}
                                    onClick={() => {
                                        if (isSelected) {
                                            updateQuantity(item.id, quantity - 1);
                                            if (window.innerWidth < 1024) {
                                                toast.success(`${item.name} decreased`, { duration: 1000 });
                                            }
                                        } else {
                                            addItem(item);
                                            if (window.innerWidth < 1024) {
                                                toast.success(`${item.name} added`, { duration: 1000 });
                                            }
                                        }
                                    }}
                                >
                                    {isSelected && (
                                        <div className="absolute top-[-6px] right-[-6px] bg-primary text-primary-foreground w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md animate-in zoom-in duration-200 z-20 border-2 border-white">
                                            {quantity}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h3 className="font-semibold truncate text-xs sm:text-sm text-foreground" title={item.name}>{item.name}</h3>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate opacity-80">{item.category}</p>
                                    </div>
                                    <div className="mt-1 sm:mt-2 text-base sm:text-lg font-bold text-primary">
                                        {formatCurrency(item.price)}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile: Floating Cart Button (when viewing menu) */}
                {!showCart && cartItems.length > 0 && (
                    <button
                        className="lg:hidden fixed bottom-20 right-4 z-40 bg-primary text-primary-foreground rounded-full px-4 py-3 shadow-xl flex items-center gap-2 text-sm font-medium active:scale-95 transition-transform"
                        onClick={() => setShowCart(true)}
                    >
                        🛒 View Cart ({cartItems.reduce((sum, i) => sum + i.quantity, 0)}) · {formatCurrency(total)}
                    </button>
                )}

                {/* Right: Cart */}
                <div className={`w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-3 ${showCart ? "flex" : "hidden lg:flex"} lg:max-h-[calc(100vh-100px)]`}>

                    {/* Header & Inputs OUTSIDE Card */}
                    {/* Customer Inputs */}


                    {/* Cart Content Card */}
                    <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-sm">

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/30">
                            {cartItems.length === 0 ? (
                                <div className="text-center text-muted-foreground py-20 flex flex-col items-center justify-center h-full">
                                    <p className="text-4xl mb-3">🛒</p>
                                    <p className="font-medium">Cart is empty</p>
                                    <p className="text-sm mt-1">Tap items to add</p>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.item_id} className="flex items-center gap-3 border-b py-3 bg-white px-2 rounded-md shadow-sm border border-slate-100">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-base truncate text-foreground" title={item.item_name}>{item.item_name}</h4>
                                            <div className="text-sm text-muted-foreground mt-1 font-medium">
                                                {formatCurrency(item.price)} × {item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.item_id, item.quantity - 1)}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                type="number"
                                                className="h-8 w-12 text-center p-0 mx-1 font-bold bg-transparent"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val >= 0) {
                                                        updateQuantity(item.item_id, val);
                                                    }
                                                }}
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addItem({ id: item.item_id, name: item.item_name, price: item.price } as Item)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="font-bold text-base w-20 text-right shrink-0">
                                            {formatCurrency(item.total_price)}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0 hover:bg-destructive/10" onClick={() => removeItem(item.item_id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Section */}
                        <div className="p-4 bg-white border-t space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">GST [CGST+SGST] ({restaurant?.gst_percentage || 5}%)</span>
                                    <input
                                        type="checkbox"
                                        checked={gstEnabled}
                                        onChange={(e) => setGstEnabled(e.target.checked)}
                                        className="h-4 w-4 accent-primary cursor-pointer"
                                    />
                                </div>
                                <span>{formatCurrency(gstAmount)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Less (Discount)</span>
                                    <div className="flex border rounded overflow-hidden h-6 bg-white">
                                        <button
                                            className={`px-2 text-xs flex items-center transition-colors ${discountType === 'amount' ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                                            onClick={() => setDiscountType('amount')}
                                        >₹</button>
                                        <div className="w-[1px] bg-slate-200"></div>
                                        <button
                                            className={`px-2 text-xs flex items-center transition-colors ${discountType === 'percentage' ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-slate-100 text-slate-600'}`}
                                            onClick={() => setDiscountType('percentage')}
                                        >%</button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {discountType === 'percentage' && discount && (
                                        <span className="text-xs text-muted-foreground">({formatCurrency(discountAmount)})</span>
                                    )}
                                    <Input
                                        type="number"
                                        placeholder={discountType === 'amount' ? "0" : "0%"}
                                        className="h-8 w-24 text-right bg-slate-50"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between font-bold text-xl pt-2 border-t border-slate-100">
                                <span>Total</span>
                                <span className="text-primary">{formatCurrency(total)}</span>
                            </div>

                            {/* Payment Mode */}
                            {/* Payment Mode */}
                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-slate-700">Payment Mode</span>
                                    <label
                                        className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all duration-200 font-bold flex items-center justify-center gap-1.5 text-xs ${paymentMode === 'both'
                                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm ring-1 ring-purple-500'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            className="hidden"
                                            checked={paymentMode === 'both'}
                                            onChange={() => setPaymentMode('both')}
                                        />
                                        <span>↔️ Both</span>
                                    </label>
                                </div>

                                <label
                                    className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all duration-200 font-bold flex items-center justify-center gap-1.5 text-xs ${paymentMode === 'cash'
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-1 ring-emerald-500'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        className="hidden"
                                        checked={paymentMode === 'cash'}
                                        onChange={() => setPaymentMode('cash')}
                                    />
                                    <span>💵 Cash</span>
                                </label>

                                <label
                                    className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all duration-200 font-bold flex items-center justify-center gap-1.5 text-xs ${paymentMode === 'upi'
                                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-1 ring-blue-500'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        className="hidden"
                                        checked={paymentMode === 'upi'}
                                        onChange={() => setPaymentMode('upi')}
                                    />
                                    <span>📱 UPI</span>
                                </label>
                            </div>

                            {paymentMode === 'both' ? (
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span>Cash Amount</span>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-9 w-28 text-right bg-slate-50"
                                            value={amountPaid}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAmountPaid(val);
                                                if (val === '') {
                                                    setSecondAmountPaid(total.toString());
                                                    return;
                                                }
                                                const cashVal = parseFloat(val) || 0;
                                                const upiVal = Math.max(0, total - cashVal);
                                                setSecondAmountPaid(Number.isInteger(upiVal) ? upiVal.toString() : upiVal.toFixed(2));
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span>UPI Amount</span>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-9 w-28 text-right bg-slate-50"
                                            value={secondAmountPaid}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSecondAmountPaid(val);
                                                if (val === '') {
                                                    setAmountPaid(total.toString());
                                                    return;
                                                }
                                                const upiVal = parseFloat(val) || 0;
                                                const cashVal = Math.max(0, total - upiVal);
                                                setAmountPaid(Number.isInteger(cashVal) ? cashVal.toString() : cashVal.toFixed(2));
                                            }}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center text-sm pt-1">
                                    <span>Amount Paid ({paymentMode === 'cash' ? 'Cash' : 'UPI'})</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-9 w-28 text-right bg-slate-50"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="flex justify-between text-base font-bold pt-1 bg-slate-50 p-2 rounded">
                                <span>{isDue ? 'Due Amount' : 'Change Return'}</span>
                                <span className={isDue ? 'text-red-600' : 'text-green-600'}>
                                    {formatCurrency(Math.abs(balance))}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="secondary" className="h-11 px-2 text-xs sm:text-sm" onClick={() => handleCreateOrder(true, false)} disabled={loading}>
                                    {loading ? <Loader2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Printer className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />}
                                    Print
                                </Button>
                                <Button className="h-11 shadow-lg shadow-primary/20 px-2 text-xs sm:text-sm" onClick={() => handleCreateOrder(true, true)} disabled={loading}>
                                    {loading ? <Loader2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Send className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />}
                                    Bill & Send
                                </Button>
                            </div>




                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
