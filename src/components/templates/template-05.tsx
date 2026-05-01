import { createSignal } from "solid-js";

export default function Template05() {
    return (
        <div class="bg-white border-2 border-teal-200 rounded-lg p-6 bg-teal-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-teal-800">TEMPLATE 05</h2>
                <p class="text-sm text-teal-600">Restaurant Format 5</p>
            </div>
            <div class="bg-white rounded-lg p-4">
                <div class="border-b-2 border-teal-200 pb-2 mb-3">
                    <p class="text-center font-bold text-teal-700">RESTAURANT BILL</p>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <p class="text-xs text-teal-600">Order Time</p>
                        <p class="text-sm font-semibold">{new Date().toLocaleTimeString()}</p>
                    </div>
                    <div>
                        <p class="text-xs text-teal-600">Order Date</p>
                        <p class="text-sm font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Veg Items</span>
                        <span>₹200</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Non-Veg Items</span>
                        <span>₹300</span>
                    </div>
                </div>
                <div class="border-t-2 border-teal-200 pt-2 mt-3">
                    <div class="flex justify-between font-bold text-teal-800">
                        <span>Total Payable:</span>
                        <span>₹500.00</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
