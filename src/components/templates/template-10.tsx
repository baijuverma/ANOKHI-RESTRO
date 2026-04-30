import { createSignal } from "solid-js";

export default function Template10() {
    return (
        <div class="bg-white border-2 border-emerald-200 rounded-lg p-6 bg-emerald-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-emerald-800">TEMPLATE 10</h2>
                <p class="text-sm text-emerald-600">Restaurant Format 10</p>
            </div>
            <div class="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg p-4">
                <div class="bg-white rounded-lg p-3 mb-3">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold text-emerald-800">FINAL BILL</p>
                            <p class="text-xs text-emerald-600">Thank you visit again</p>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-bold text-emerald-800">₹500</p>
                            <p class="text-xs text-emerald-600">Total Amount</p>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-white rounded p-2">
                        <p class="text-xs font-semibold text-emerald-600">Order Details</p>
                        <p class="text-xs">Table: T-10</p>
                        <p class="text-xs">Staff: Manager</p>
                    </div>
                    <div class="bg-white rounded p-2">
                        <p class="text-xs font-semibold text-emerald-600">Payment</p>
                        <p class="text-xs">Mode: Cash</p>
                        <p class="text-xs">Status: Paid</p>
                    </div>
                </div>
                <div class="mt-3 text-center">
                    <p class="text-xs text-emerald-600 font-semibold">Items: 5 | Qty: 8 | Time: 45min</p>
                </div>
            </div>
        </div>
    );
}
