import { createSignal } from "solid-js";

export default function Template08() {
    return (
        <div class="bg-white border-2 border-pink-200 rounded-lg p-6 bg-pink-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-pink-800">TEMPLATE 08</h2>
                <p class="text-sm text-pink-600">Restaurant Format 8</p>
            </div>
            <div class="bg-white rounded-lg p-4">
                <div class="text-center mb-3">
                    <div class="inline-block px-4 py-2 bg-pink-100 rounded-full">
                        <p class="font-bold text-pink-800">BILL RECEIPT</p>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 text-center mb-3">
                    <div class="bg-pink-50 rounded p-2">
                        <p class="text-xs">Order #</p>
                        <p class="text-sm font-semibold">008</p>
                    </div>
                    <div class="bg-pink-50 rounded p-2">
                        <p class="text-xs">Table</p>
                        <p class="text-sm font-semibold">T-08</p>
                    </div>
                    <div class="bg-pink-50 rounded p-2">
                        <p class="text-xs">Guests</p>
                        <p class="text-sm font-semibold">2</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Items Total</span>
                        <span>₹450</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Tax (10%)</span>
                        <span>₹45</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Service Charge</span>
                        <span>₹5</span>
                    </div>
                </div>
                <div class="flex justify-between font-bold text-pink-800 mt-3">
                    <span>Grand Total:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
