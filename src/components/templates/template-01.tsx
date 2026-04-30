import { createSignal } from "solid-js";

export default function Template01() {
    return (
        <div class="bg-white border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-green-800">TEMPLATE 01</h2>
                <p class="text-sm text-green-600">Restaurant Format 1</p>
            </div>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="font-semibold text-green-700">Order #:</span>
                    <span>ORD-001</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold text-green-700">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div class="border-t border-green-200 pt-2">
                    <div class="space-y-1">
                        <div class="flex justify-between">
                            <span>Item 1</span>
                            <span>₹200.00</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Item 2</span>
                            <span>₹300.00</span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between font-bold text-green-800">
                    <span>Total:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
