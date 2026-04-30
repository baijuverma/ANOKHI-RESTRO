import { createSignal } from "solid-js";

export default function Template03() {
    return (
        <div class="bg-white border-2 border-red-200 rounded-lg p-6 bg-red-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-red-800">TEMPLATE 03</h2>
                <p class="text-sm text-red-600">Restaurant Format 3</p>
            </div>
            <div class="bg-white rounded p-4">
                <div class="text-center mb-3">
                    <p class="font-bold text-red-700">BILL RECEIPT</p>
                </div>
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Bill No:</span>
                        <span>BN-003</span>
                    </div>
                </div>
                <hr class="border-red-200 my-2" />
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between">
                        <span>Food Items</span>
                        <span>₹450</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Beverages</span>
                        <span>₹50</span>
                    </div>
                </div>
                <div class="flex justify-between font-bold text-red-800 mt-2">
                    <span>Grand Total:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
