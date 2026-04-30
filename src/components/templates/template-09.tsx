import { createSignal } from "solid-js";

export default function Template09() {
    return (
        <div class="bg-white border-2 border-lime-200 rounded-lg p-6 bg-lime-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-lime-800">TEMPLATE 09</h2>
                <p class="text-sm text-lime-600">Restaurant Format 9</p>
            </div>
            <div class="bg-white rounded-lg p-4">
                <div class="bg-lime-100 rounded p-3 mb-3">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold text-lime-800">RESTAURANT</p>
                            <p class="text-sm text-lime-600">Fine Dining</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold">Bill #009</p>
                            <p class="text-xs text-lime-600">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Breakfast</span>
                        <span>₹120</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Lunch</span>
                        <span>₹230</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Beverages</span>
                        <span>₹150</span>
                    </div>
                </div>
                <div class="flex justify-between font-bold text-lime-800 mt-3">
                    <span>Total Amount:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
