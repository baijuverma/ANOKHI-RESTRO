import { createSignal } from "solid-js";

export default function Template07() {
    return (
        <div class="bg-white border-2 border-cyan-200 rounded-lg p-6 bg-cyan-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-cyan-800">TEMPLATE 07</h2>
                <p class="text-sm text-cyan-600">Restaurant Format 7</p>
            </div>
            <div class="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg p-4">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-white rounded p-3">
                        <p class="text-xs font-semibold text-cyan-600">BILL TO</p>
                        <p class="text-sm">Customer</p>
                        <p class="text-xs text-slate-500">Table: T-07</p>
                    </div>
                    <div class="bg-white rounded p-3">
                        <p class="text-xs font-semibold text-cyan-600">BILL DATE</p>
                        <p class="text-sm">{new Date().toLocaleDateString()}</p>
                        <p class="text-xs text-slate-500">{new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between bg-white rounded px-2 py-1">
                        <span>Food</span>
                        <span>₹350</span>
                    </div>
                    <div class="flex justify-between bg-white rounded px-2 py-1">
                        <span>Service</span>
                        <span>₹150</span>
                    </div>
                </div>
                <div class="flex justify-between font-bold text-cyan-800 mt-3">
                    <span>Total Amount:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
