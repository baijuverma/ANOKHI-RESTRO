import { createSignal } from "solid-js";

export default function Template11() {
    return (
        <div class="bg-white p-4 max-w-sm mx-auto font-mono text-sm">
            {/* Header */}
            <div class="text-center mb-3">
                <h1 class="text-lg font-bold">Tasty Forks</h1>
                <p class="text-xs">123 Market Road, City</p>
                <p class="text-xs">GSTIN: 22AAAAA0000A1Z5</p>
                <p class="text-xs">Ph: +91 90000 00000</p>
            </div>
            
            <div class="border-b-2 border-dashed border-slate-400 mb-3"></div>
            
            {/* Bill Details */}
            <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                    <span class="font-semibold">Bill No:</span> TF-1047
                </div>
                <div>
                    <span class="font-semibold">Date:</span> 2026-02-06 19:32
                </div>
                <div>
                    <span class="font-semibold">Table:</span> 07
                </div>
                <div>
                    <span class="font-semibold">KOT No:</span> KOT-1021
                </div>
                <div>
                    <span class="font-semibold">Cashier:</span> Rita
                </div>
                <div>
                    <span class="font-semibold">Waiter:</span> Aman
                </div>
            </div>
            
            <div class="border-b-2 border-dashed border-slate-400 mb-3"></div>
            
            {/* Items Table Header */}
            <div class="grid grid-cols-4 gap-2 text-xs font-semibold mb-2">
                <div>Item</div>
                <div class="text-center">Qty</div>
                <div class="text-right">Rate</div>
                <div class="text-right">Amt</div>
            </div>
            
            <div class="border-b border-dashed border-slate-400 mb-2"></div>
            
            {/* Items */}
            <div class="space-y-1 text-xs mb-3">
                <div class="grid grid-cols-4 gap-2">
                    <div>Paneer Tikka</div>
                    <div class="text-center">2</div>
                    <div class="text-right">120.00</div>
                    <div class="text-right">240.00</div>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    <div>Butter Naan</div>
                    <div class="text-center">1</div>
                    <div class="text-right">90.00</div>
                    <div class="text-right">90.00</div>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    <div>Masala Chai</div>
                    <div class="text-center">2</div>
                    <div class="text-right">60.00</div>
                    <div class="text-right">120.00</div>
                </div>
            </div>
            
            <div class="border-b-2 border-dashed border-slate-400 mb-3"></div>
            
            {/* Summary */}
            <div class="space-y-1 text-xs mb-3">
                <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span>450.00</span>
                </div>
                <div class="flex justify-between">
                    <span>Discount:</span>
                    <span>0.00</span>
                </div>
                <div class="flex justify-between">
                    <span>Taxable Value:</span>
                    <span>450.00</span>
                </div>
                <div class="flex justify-between">
                    <span>CGST (2.5%):</span>
                    <span>11.25</span>
                </div>
                <div class="flex justify-between">
                    <span>SGST (2.5%):</span>
                    <span>11.25</span>
                </div>
                <div class="flex justify-between font-bold border-t border-dashed border-slate-400 pt-1">
                    <span>Grand Total:</span>
                    <span>472.50</span>
                </div>
            </div>
            
            <div class="border-b-2 border-dashed border-slate-400 mb-3"></div>
            
            {/* Payment Details */}
            <div class="space-y-1 text-xs mb-3">
                <div class="flex justify-between">
                    <span>Payment Mode:</span>
                    <span>UPI</span>
                </div>
                <div class="flex justify-between">
                    <span>Paid Amount:</span>
                    <span>450.00</span>
                </div>
                <div class="flex justify-between">
                    <span>Balance:</span>
                    <span>-22.50</span>
                </div>
            </div>
            
            <div class="border-b-2 border-dashed border-slate-400 mb-3"></div>
            
            {/* QR Code Section */}
            <div class="text-center mb-3">
                <p class="text-xs font-semibold mb-2">Scan & Pay</p>
                <div class="w-24 h-24 bg-slate-100 border-2 border-slate-300 mx-auto mb-2 flex items-center justify-center">
                    <div class="w-20 h-20 bg-slate-200 grid grid-cols-3 gap-0.5 p-1">
                        <div class="bg-slate-800"></div>
                        <div class="bg-slate-800"></div>
                        <div class="bg-slate-800"></div>
                        <div class="bg-slate-800"></div>
                        <div class="bg-white"></div>
                        <div class="bg-slate-800"></div>
                        <div class="bg-slate-800"></div>
                        <div class="bg-slate-800"></div>
                        <div class="bg-slate-800"></div>
                    </div>
                </div>
                <p class="text-xs">UPI ID: tastyforks@upi</p>
                <p class="text-xs">Name: Tasty Forks</p>
            </div>
            
            <div class="border-b-2 border-dashed border-slate-400 mb-3"></div>
            
            {/* Footer */}
            <div class="text-center text-xs">
                <p class="font-semibold mb-1">Thank you! Visit again.</p>
                <p class="text-slate-600">GST included as applicable</p>
            </div>
        </div>
    );
}
