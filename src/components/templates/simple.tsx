import { createSignal } from "solid-js";

export default function SimpleTemplate() {
    return (
        <div class="bg-white border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-blue-800">RESTAURANT BILL</h2>
                <p class="text-sm text-blue-600">Simple Format</p>
            </div>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Restaurant:</span>
                    <span>Your Restaurant</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Table:</span>
                    <span>T-01</span>
                </div>
                <hr class="border-blue-200" />
                <div class="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
