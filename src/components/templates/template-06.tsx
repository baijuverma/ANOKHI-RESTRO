import { createSignal } from "solid-js";

export default function Template06() {
    return (
        <div class="bg-white border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-orange-800">TEMPLATE 06</h2>
                <p class="text-sm text-orange-600">Restaurant Format 6</p>
            </div>
            <div class="bg-white rounded-lg p-4">
                <div class="flex items-center justify-center mb-3">
                    <div class="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center">
                        <span class="text-orange-800 font-bold">06</span>
                    </div>
                </div>
                <div class="text-center mb-3">
                    <p class="font-bold text-orange-700">DINING BILL</p>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Appetizers</span>
                        <span>₹150</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Main Course</span>
                        <span>₹250</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Beverages</span>
                        <span>₹100</span>
                    </div>
                </div>
                <div class="flex justify-between font-bold text-orange-800 mt-3">
                    <span>Total:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
