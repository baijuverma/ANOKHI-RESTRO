import { For } from "solid-js";

const GSTInvoice = () => {
  // Dynamic Data (Props ya API se connect kar sakte hain)
  const billingInfo = {
    invoiceNo: "GST/2026/1024",
    date: "11 March 2026",
    state: "Bihar (10)",
    reverseCharge: "No",
  };

  const items = [
    { name: "SaaS Billing Software - Pro", hsn: "9973", qty: 1, rate: 12000, disc: 1000, taxRate: 18 },
    { name: "Server Setup & Cloud Config", hsn: "9987", qty: 1, rate: 5000, disc: 0, taxRate: 18 },
  ];

  // Calculations
  const calculateTaxable = (item: any) => (item.qty * item.rate) - item.disc;
  const calculateGST = (taxable: any, rate: any) => (taxable * rate) / 100;

  const totalTaxable = items.reduce((acc, item) => acc + calculateTaxable(item), 0);
  const totalGST = items.reduce((acc, item) => acc + calculateGST(calculateTaxable(item), item.taxRate), 0);
  const grandTotal = totalTaxable + totalGST;

  return (
    <div class="bg-gray-100 p-10 min-h-screen flex justify-center font-sans">
      {/* A4 Page Container */}
      <div id="gst-invoice" class="bg-white w-[210mm] min-h-[297mm] p-12 shadow-xl border border-gray-300 text-gray-800">
        
        {/* Top Header */}
        <div class="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-4">
          <div>
            <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tighter">Tax Invoice</h1>
            <p class="text-xs text-gray-500 font-bold uppercase mt-1 tracking-widest">Original for Recipient</p>
          </div>
          <div class="text-right">
            <h2 class="text-xl font-bold uppercase">Aapka SaaS Business</h2>
            <p class="text-sm">Gaya, Bihar - 823001</p>
            <p class="text-sm font-bold">GSTIN: 10ABCCX1234Z1Z1</p>
          </div>
        </div>

        {/* Invoice Info Grid */}
        <div class="grid grid-cols-2 gap-10 mb-8 border border-gray-200 p-4 rounded">
          <div class="space-y-1 text-sm">
            <p><span class="text-gray-500 font-bold uppercase text-[10px]">Invoice No:</span> <span class="font-bold">{billingInfo.invoiceNo}</span></p>
            <p><span class="text-gray-500 font-bold uppercase text-[10px]">Date:</span> {billingInfo.date}</p>
            <p><span class="text-gray-500 font-bold uppercase text-[10px]">Place of Supply:</span> {billingInfo.state}</p>
          </div>
          <div class="text-sm border-l pl-10">
            <p class="text-gray-500 font-bold uppercase text-[10px] mb-1">Bill To:</p>
            <p class="font-black text-base uppercase">Ramdeep Prasad Yadav</p>
            <p>Gaya, Bihar, India</p>
            <p class="font-bold mt-1">GSTIN: (Unregistered)</p>
          </div>
        </div>

        {/* Items Table */}
        <table class="w-full border-collapse mb-8 text-xs">
          <thead>
            <tr class="bg-gray-800 text-white uppercase tracking-wider">
              <th class="border border-gray-600 p-2">#</th>
              <th class="border border-gray-600 p-2 text-left">Description</th>
              <th class="border border-gray-600 p-2">HSN/SAC</th>
              <th class="border border-gray-600 p-2">Qty</th>
              <th class="border border-gray-600 p-2">Rate</th>
              <th class="border border-gray-600 p-2">Discount</th>
              <th class="border border-gray-600 p-2">Taxable Value</th>
              <th class="border border-gray-600 p-2">GST %</th>
            </tr>
          </thead>
          <tbody>
            <For each={items}>
              {(item, i) => (
                <tr>
                  <td class="border p-2 text-center">{i() + 1}</td>
                  <td class="border p-2 font-bold">{item.name}</td>
                  <td class="border p-2 text-center">{item.hsn}</td>
                  <td class="border p-2 text-center">{item.qty}</td>
                  <td class="border p-2 text-right">{item.rate.toFixed(2)}</td>
                  <td class="border p-2 text-right">{item.disc.toFixed(2)}</td>
                  <td class="border p-2 text-right font-bold">{calculateTaxable(item).toFixed(2)}</td>
                  <td class="border p-2 text-center">{item.taxRate}%</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>

        {/* Calculation Summary */}
        <div class="flex justify-between items-start">
          <div class="w-1/2">
             <div class="border p-3 text-[10px] bg-gray-50 rounded">
                <p class="font-bold border-b mb-1 uppercase">Bank Details:</p>
                <p>Bank: YES BANK | A/c No: 66789999222445</p>
                <p>IFSC: YESBBIN4567 | Branch: Kodihalli</p>
             </div>
             <p class="text-[10px] mt-4 italic text-gray-500 uppercase">Amount in words: INR Seventeen Thousand Seven Hundred Only</p>
          </div>
          <div class="w-1/3 text-sm font-medium space-y-1">
            <div class="flex justify-between"><span>Total Taxable:</span><span>₹{totalTaxable.toFixed(2)}</span></div>
            <div class="flex justify-between"><span>CGST (9%):</span><span>₹{(totalGST/2).toFixed(2)}</span></div>
            <div class="flex justify-between border-b-2 border-gray-200 pb-2"><span>SGST (9%):</span><span>₹{(totalGST/2).toFixed(2)}</span></div>
            <div class="flex justify-between text-lg font-black pt-2"><span>Grand Total:</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Footer */}
        <div class="mt-20 border-t pt-10 flex justify-between items-end">
          <div class="text-[10px] text-gray-400 space-y-1">
            <p>1. Payments are due within 15 days.</p>
            <p>2. This is a computer generated invoice and requires no signature.</p>
          </div>
          <div class="text-center">
            <div class="w-32 h-10 border-b-2 border-dotted border-gray-400 mb-2"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">Authorized Signatory</p>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          body { background: white !important; padding: 0 !important; }
          .bg-gray-100 { background: white !important; padding: 0 !important; }
          #gst-invoice { 
            box-shadow: none !important; 
            border: none !important;
            width: 100% !important; 
            margin: 0 !important;
            padding: 10mm !important;
          }
          .bg-gray-800 { background-color: #1f2937 !important; color: white !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default GSTInvoice;
