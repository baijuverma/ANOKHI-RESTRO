import { createSignal } from "solid-js";

export default function PremiumTemplate() {
    return (
        <div class="bg-white border-2 border-amber-200 rounded-lg p-6 bg-amber-50">
            <div class="text-center mb-4">
                <h2 class="text-2xl font-serif text-amber-800">PREMIUM INVOICE</h2>
                <div class="w-32 h-0.5 bg-amber-400 mx-auto mt-2"></div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p class="text-sm font-semibold text-amber-700">Restaurant Details</p>
                    <p class="text-slate-700">Premium Restaurant</p>
                    <p class="text-slate-600 text-sm">123 Main Street</p>
                </div>
                <div>
                    <p class="text-sm font-semibold text-amber-700">Bill Details</p>
                    <p class="text-slate-700">Date: {new Date().toLocaleDateString()}</p>
                    <p class="text-slate-700">Time: {new Date().toLocaleTimeString()}</p>
                </div>
            </div>
            <div class="border-t border-amber-200 pt-2">
                <div class="flex justify-between font-bold text-amber-800">
                    <span>Total Amount:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
