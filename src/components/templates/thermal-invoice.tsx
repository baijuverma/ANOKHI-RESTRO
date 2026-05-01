import { For } from "solid-js";

const ThermalInvoice = (props: any) => {
  // Sample Data (Aap ise props se pass kar sakte hain)
  const items = [
    { name: "Paneer Tikka", qty: 2, rate: 120.0, amt: 240.0 },
    { name: "Butter Naan", qty: 1, rate: 90.0, amt: 90.0 },
    { name: "Masala Chai", qty: 2, rate: 60.0, amt: 120.0 },
  ];

  const subtotal = 450.0;
  const gst = 11.25; // 2.5% CGST + 2.5% SGST each
  const grandTotal = 472.50;

  return (
    <div class="bg-gray-100 p-4 min-h-screen flex justify-center items-start">
      {/* Invoice Container */}
      <div id="printable-invoice" class="bg-white w-[80mm] p-4 shadow-lg font-mono text-[12px] leading-tight text-black">
        
        {/* Header */}
        <div class="text-center mb-4">
          <h1 class="text-[18px] font-bold uppercase">Tasty Forks</h1>
          <p>123 Market Road, City</p>
          <p>GSTIN: 22AAAAA0000A1Z5</p>
          <p>Phone: +91 90000 00000</p>
        </div>

        <div class="border-t border-dashed border-black my-2"></div>

        {/* Bill Info */}
        <div class="flex justify-between">
          <span>Bill No: TF-1047</span>
          <span>Table: 07</span>
        </div>
        <div class="flex justify-between">
          <span>Date: 2026-02-06</span>
          <span>19:32</span>
        </div>
        <div class="flex justify-between">
          <span>Cashier: Rita</span>
          <span>Waiter: Aman</span>
        </div>

        <div class="border-t border-dashed border-black my-2"></div>

        {/* Table Header */}
        <div class="flex font-bold border-b border-black pb-1 mb-1">
          <span class="w-1/2 text-left">Item</span>
          <span class="w-[10%] text-right">Qty</span>
          <span class="w-[20%] text-right">Rate</span>
          <span class="w-[20%] text-right">Amt</span>
        </div>

        {/* Items List */}
        <For each={items}>
          {(item) => (
            <div class="flex py-1">
              <span class="w-1/2 text-left truncate">{item.name}</span>
              <span class="w-[10%] text-right">{item.qty}</span>
              <span class="w-[20%] text-right">{item.rate.toFixed(2)}</span>
              <span class="w-[20%] text-right font-bold">{item.amt.toFixed(2)}</span>
            </div>
          )}
        </For>

        <div class="border-t border-dashed border-black my-2"></div>

        {/* Calculation Summary */}
        <div class="space-y-1">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>CGST (2.5%)</span>
            <span>{gst.toFixed(2)}</span>
          </div>
          <div class="flex justify-between border-b border-black pb-1">
            <span>SGST (2.5%)</span>
            <span>{gst.toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-[14px] font-bold pt-1">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div class="border-t border-dashed border-black my-2"></div>

        {/* Payment & QR */}
        <div class="text-center space-y-2">
          <p class="font-bold">Scan & Pay</p>
          <div class="flex justify-center">
             {/* Replace with your dynamic QR code generator */}
            <div class="w-24 h-24 bg-gray-200 border border-black flex items-center justify-center">
              <span class="text-[10px]">QR CODE</span>
            </div>
          </div>
          <p class="text-[10px]">UPI ID: tastyforks@upi</p>
        </div>

        <div class="border-t border-dashed border-black my-4"></div>

        <div class="text-center italic">
          <p>Thank you! Visit again.</p>
          <p class="text-[9px] mt-1">** Computer Generated Bill **</p>
        </div>
      </div>

      {/* CSS for Print Optimization */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            box-shadow: none;
            margin: 0;
            padding: 5mm;
          }
        }
      `}</style>
    </div>
  );
};

export default ThermalInvoice;
