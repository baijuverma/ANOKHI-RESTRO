import { createSignal } from "solid-js";

export default function Template02() {
    return (
        <div class="bg-white border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <div class="text-center mb-4">
                <h2 class="text-xl font-bold text-purple-800">TEMPLATE 02</h2>
                <p class="text-sm text-purple-600">Restaurant Format 2</p>
            </div>
            <div class="bg-white rounded-lg p-4">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-xs font-semibold text-purple-600">CUSTOMER</p>
                        <p class="text-sm">Walk-in Customer</p>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-purple-600">TABLE</p>
                        <p class="text-sm">T-02</p>
                    </div>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Butter Chicken</span>
                        <span>₹280</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Naan</span>
                        <span>₹40</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Dal Makhani</span>
                        <span>₹180</span>
                    </div>
                </div>
                <hr class="border-purple-200 my-2" />
                <div class="flex justify-between font-bold text-purple-800">
                    <span>Total:</span>
                    <span>₹500.00</span>
                </div>
            </div>
        </div>
    );
}
