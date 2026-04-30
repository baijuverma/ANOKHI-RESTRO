import { createSignal, Show } from "solid-js";

// --- Sub-Component: Thermal Receipt (80mm) ---
const ThermalTemplate = () => (
  <div class="bg-white w-[80mm] p-4 shadow-md font-mono text-[12px] text-black border border-gray-200 mx-auto">
    <div class="text-center mb-2">
      <h2 class="text-lg font-bold">TASTY FORKS</h2>
      <p>123 Market Road, City</p>
      <p class="text-[10px]">GSTIN: 22AAAAA0000A1Z5</p>
    </div>
    <div class="border-t border-dashed border-black my-2"></div>
    <div class="flex justify-between text-[10px]">
      <span>Bill: TF-1047</span>
      <span>Table: 07</span>
    </div>
    <div class="border-t border-dashed border-black my-2"></div>
    <div class="space-y-1">
      <div class="flex justify-between font-bold border-b pb-1">
        <span class="w-1/2">Item</span>
        <span>Qty</span>
        <span>Amt</span>
      </div>
      <div class="flex justify-between">
        <span class="w-1/2 truncate">Paneer Tikka</span>
        <span>2</span>
        <span>240.00</span>
      </div>
      <div class="flex justify-between">
        <span class="w-1/2 truncate">Butter Naan</span>
        <span>1</span>
        <span>90.00</span>
      </div>
    </div>
    <div class="border-t border-dashed border-black my-2 pt-1 text-right">
      <p>Subtotal: 330.00</p>
      <p>GST (5%): 16.50</p>
      <p class="font-bold text-sm mt-1 border-t border-black pt-1">Total: ₹346.50</p>
    </div>
    <div class="text-center mt-4">
      <div class="w-20 h-20 bg-gray-100 border mx-auto mb-1 flex items-center justify-center text-[8px]">QR CODE</div>
      <p class="italic text-[10px]">Thank You! Visit Again</p>
    </div>
  </div>
);

// --- Sub-Component: Professional A4 Invoice ---
const A4Template = () => (
  <div class="bg-white w-[210mm] min-h-[140mm] p-8 shadow-md font-sans text-sm text-gray-800 mx-auto border border-gray-200">
    <div class="flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-6">
      <div>
        <h1 class="text-2xl font-black text-blue-600">INVOICE</h1>
        <p class="font-bold">BIG BAZAAR Retail</p>
      </div>
      <div class="text-right text-xs">
        <p>Invoice #: INV-2026-001</p>
        <p>Date: 11 March 2026</p>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 mb-6 text-xs">
      <div>
        <p class="text-gray-500 font-bold uppercase">Bill To:</p>
        <p class="text-sm font-bold">Ramdeep Prasad Yadav</p>
        <p>Gaya, Bihar, India</p>
      </div>
      <div class="text-right">
        <p class="text-gray-500 font-bold uppercase">Ship From:</p>
        <p>Main Warehouse, Bangalore</p>
        <p>GSTIN: 27ABCCT2727Q1ZX</p>
      </div>
    </div>
    <table class="w-full mb-6">
      <thead>
        <tr class="bg-gray-100 text-left border-b">
          <th class="p-2">Description</th>
          <th class="p-2">Qty</th>
          <th class="p-2 text-right">Rate</th>
          <th class="p-2 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b">
          <td class="p-2">SaaS Subscription (Annual)</td>
          <td class="p-2">1</td>
          <td class="p-2 text-right">9,000.00</td>
          <td class="p-2 text-right">9,000.00</td>
        </tr>
      </tbody>
    </table>
    <div class="flex justify-end">
      <div class="w-1/3 space-y-2 border-t pt-2">
        <div class="flex justify-between"><span>Subtotal:</span><span>9,000.00</span></div>
        <div class="flex justify-between text-blue-600 font-bold text-lg"><span>Grand Total:</span><span>₹9,000.00</span></div>
      </div>
    </div>
  </div>
);

// --- Main Demo Dashboard ---
export default function InvoiceDemo() {
  const [view, setView] = createSignal("thermal");

  return (
    <div class="bg-gray-50 min-h-screen p-6 font-sans">
      {/* Control Panel */}
      <div class="max-w-4xl mx-auto mb-10 bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-800">Invoice Template Demo</h1>
          <p class="text-sm text-gray-500">SolidJS + Tailwind CSS Pixel Perfect Designs</p>
        </div>
        <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setView("thermal")}
            class={`px-4 py-2 rounded-md text-sm font-medium transition ${view() === 'thermal' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
          >
            Thermal (80mm)
          </button>
          <button 
            onClick={() => setView("a4")}
            class={`px-4 py-2 rounded-md text-sm font-medium transition ${view() === 'a4' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
          >
            A4 Professional
          </button>
        </div>
        <button 
          onClick={() => window.print()}
          class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          Print Demo
        </button>
      </div>

      {/* Viewport */}
      <div class="flex justify-center overflow-auto pb-20">
        <Show when={view() === "thermal"} fallback={<A4Template />}>
          <ThermalTemplate />
        </Show>
      </div>

      {/* Footer Branding */}
      <div class="fixed bottom-0 left-0 w-full bg-white border-t p-3 text-center text-xs text-gray-400">
        Created for Your Restaurant SaaS Project | Scale to Millions
      </div>
    </div>
  );
}
