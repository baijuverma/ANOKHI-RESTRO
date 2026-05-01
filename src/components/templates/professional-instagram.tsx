import { For } from "solid-js";

const ProfessionalInvoice = () => {
  // Sample Data: Isse aap props ya API se replace kar sakte hain
  const items = [
    { id: 1, desc: "Digital Marketing", hsn: "45346", qty: 3, rate: 7062.0, taxRate: "18%", amt: 21186.0 },
    { id: 2, desc: "Logo Designing", hsn: "9983", qty: 1, rate: 5000.0, taxRate: "18%", amt: 5000.0 },
    { id: 3, desc: "Professional Fee", hsn: "9985", qty: 1, rate: 1694.92, taxRate: "18%", amt: 1694.92 },
  ];

  return (
    <div class="bg-gray-200 p-8 min-h-screen flex justify-center">
      {/* Invoice Container */}
      <div id="full-invoice" class="bg-white w-[210mm] min-h-[297mm] p-10 shadow-2xl font-sans text-gray-800 relative">
        
        {/* Pink Accent Line (Instagram Style) */}
        <div class="absolute top-0 left-0 w-full h-1 bg-pink-600"></div>

        {/* Header Section */}
        <div class="flex justify-between items-start mb-8">
          <div>
            <div class="flex items-center gap-2 mb-2">
               {/* Placeholder for Logo */}
               <div class="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-lg"></div>
               <h1 class="text-2xl font-bold tracking-tight">Instagram</h1>
            </div>
            <p class="text-xs font-bold uppercase text-gray-500">Tax Invoice</p>
          </div>
          <div class="text-right text-xs">
            <h2 class="font-bold text-lg">Instagram</h2>
            <p>GSTIN: 36ABCCS2942R1ZR</p>
            <p>Block 3, Indira Nagar, Gachibowli</p>
            <p>Hyderabad, TELANGANA, 500032</p>
          </div>
        </div>

        <hr class="border-gray-100 mb-6" />

        {/* Billing Info Grid */}
        <div class="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <p class="text-pink-600 font-bold mb-1">Bill To:</p>
            <p class="font-bold text-base">Adam Mosseri</p>
            <p>GSTIN: 27ABCCS2942R1ZR</p>
            <p>Survey 115/1, ISB Rd, Financial District</p>
            <p>Hyderabad, TELANGANA, 500032</p>
          </div>
          <div class="text-right space-y-1">
            <p><strong>Invoice #:</strong> INV-001</p>
            <p><strong>Date:</strong> 10 March 2026</p>
            <p><strong>Place of Supply:</strong> 36-TELANGANA</p>
          </div>
        </div>

        {/* Table Section */}
        <table class="w-full text-left border-collapse mb-6">
          <thead>
            <tr class="bg-pink-600 text-white text-xs uppercase">
              <th class="p-3">#</th>
              <th class="p-3">Description</th>
              <th class="p-3">HSN/SAC</th>
              <th class="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <For each={items}>
              {(item, i) => (
                <tr class="border-b border-gray-100">
                  <td class="p-3 w-10">{i() + 1}</td>
                  <td class="p-3">
                    <p class="font-bold text-gray-900">{item.desc}</p>
                    <p class="text-xs text-gray-500 italic">Services rendered for monthly campaign</p>
                  </td>
                  <td class="p-3 text-gray-500">{item.hsn}</td>
                  <td class="p-3 text-right font-medium">₹{item.amt.toLocaleString()}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>

        {/* Total Calculation Area */}
        <div class="flex justify-end mb-8">
          <div class="w-64 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Taxable Amount:</span>
              <span class="font-medium">₹27,880.92</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">CGST (9%):</span>
              <span class="font-medium">₹2,509.28</span>
            </div>
            <div class="flex justify-between border-b pb-2">
              <span class="text-gray-500">SGST (9%):</span>
              <span class="font-medium">₹2,509.28</span>
            </div>
            <div class="flex justify-between text-lg font-bold text-pink-600 pt-1">
              <span>Total:</span>
              <span>₹32,899.48</span>
            </div>
          </div>
        </div>

        {/* Payment & Terms Section */}
        <div class="grid grid-cols-2 gap-10 mt-12 border-t pt-8">
          <div class="text-[10px] text-gray-500 leading-relaxed">
            <p class="font-bold text-gray-700 mb-2">Terms & Conditions:</p>
            <ol class="list-decimal ml-4">
              <li>Goods once sold cannot be taken back or exchanged.</li>
              <li>Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</li>
              <li>All disputes are subject to local Jurisdiction.</li>
            </ol>
          </div>
          <div class="flex flex-col items-end">
            <div class="w-32 h-32 bg-gray-100 flex items-center justify-center border border-gray-200 mb-2">
              <span class="text-[8px] text-gray-400 italic">QR CODE FOR UPI</span>
            </div>
            <p class="text-[10px] font-bold uppercase text-gray-400">Authorized Signatory</p>
          </div>
        </div>

        {/* Footer Note */}
        <div class="absolute bottom-10 left-10 right-10 text-center text-[10px] text-gray-400 border-t pt-4">
          This is a digitally signed document. Generated by your SaaS Tool.
        </div>
      </div>

      {/* Print Specific Styles */}
      <style>{`
        @media print {
          body { background: white; padding: 0; }
          .bg-gray-200 { background: white !important; padding: 0 !important; }
          #full-invoice { 
            box-shadow: none !important; 
            margin: 0 !important; 
            width: 100% !important;
            padding: 10mm !important;
          }
          .bg-pink-600 { background-color: #db2777 !important; -webkit-print-color-adjust: exact; }
          button { display: none; }
        }
      `}</style>
    </div>
  );
};

export default ProfessionalInvoice;
