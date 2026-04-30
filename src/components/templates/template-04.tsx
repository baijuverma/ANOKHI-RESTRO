import { createSignal } from "solid-js";

export default function Template04() {
    return (
        <div class="bg-white border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-indigo-800">TEMPLATE 04</h2>
                <p class="text-sm text-indigo-600">Restaurant Format 4</p>
            </div>
            <div class="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4">
                <div class="grid grid-cols-3 gap-2 text-center mb-3">
                    <div class="bg-white rounded p-2">
                        <p class="text-xs font-semibold">Table</p>
                        <p class="text-sm">T-04</p>
                    </div>
                    <div class="bg-white rounded p-2">
                        <p class="text-xs font-semibold">Guests</p>
                        <p class="text-sm">4</p>
                    </div>
                    <div class="bg-white rounded p-2">
                        <p class="text-xs font-semibold">Staff</p>
                        <p class="text-sm">John</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Starter</span>
                        <span>₹120</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Main Course</span>
                        <span>₹280</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Dessert</span>
                        <span>₹100</span>
                    </div>
                </div>
                <div class="flex justify-between font-bold text-indigo-800 mt-3">
                    <span>Total Amount:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
