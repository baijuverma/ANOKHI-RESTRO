import { createSignal, Show } from "solid-js";
import PDFViewer from "@/components/PDFViewer";
import ChromePDFViewer from "@/components/ChromePDFViewer";
import PlaywrightPDFViewer from "@/components/PlaywrightPDFViewer";

export default function PDFViewerDemo() {
  const [activeViewer, setActiveViewer] = createSignal<"solid" | "chrome" | "playwright">("solid");
  const [samplePDF, setSamplePDF] = createSignal<string>("");
  const [sampleHTML, setSampleHTML] = createSignal<string>("");

  // Sample HTML for Playwright demo
  const sampleInvoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sample Invoice</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Sample Invoice</h1>
            <p>Generated with Playwright</p>
        </div>
        <div class="invoice-details">
            <div>
                <h3>Bill To:</h3>
                <p>Customer Name</p>
                <p>Address Line 1</p>
                <p>City, State 12345</p>
            </div>
            <div>
                <h3>Invoice Details:</h3>
                <p>Invoice #: INV-001</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <p>Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
        </div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Sample Service</td>
                    <td>1</td>
                    <td>$100.00</td>
                    <td>$100.00</td>
                </tr>
                <tr>
                    <td>Another Service</td>
                    <td>2</td>
                    <td>$50.00</td>
                    <td>$100.00</td>
                </tr>
            </tbody>
        </table>
        <div class="total">
            <p>Subtotal: $200.00</p>
            <p>Tax (10%): $20.00</p>
            <p><strong>Total: $220.00</strong></p>
        </div>
    </body>
    </html>
  `;

  // Initialize sample content
  setSampleHTML(sampleInvoiceHTML);

  // Sample PDF URL (you can replace with actual PDF URL)
  const samplePDFUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">PDF Viewer Demo</h1>
          <p class="text-gray-600">Compare different PDF viewing technologies in SolidJS</p>
        </div>

        {/* Viewer Selection */}
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Select PDF Viewer</h2>
          <div class="flex gap-4">
            <button
              onClick={() => setActiveViewer("solid")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeViewer() === "solid"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Solid PDF Viewer
            </button>
            <button
              onClick={() => setActiveViewer("chrome")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeViewer() === "chrome"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Chrome PDF Viewer
            </button>
            <button
              onClick={() => setActiveViewer("playwright")}
              class={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeViewer() === "playwright"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Playwright PDF Viewer
            </button>
          </div>
        </div>

        {/* PDF Viewer Display */}
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">
            <Show when={activeViewer() === "solid"}>Solid PDF Viewer (react-pdf)</Show>
            <Show when={activeViewer() === "chrome"}>Chrome PDF Viewer (iframe)</Show>
            <Show when={activeViewer() === "playwright"}>Playwright PDF Viewer (server-side generation)</Show>
          </h2>

          <Show when={activeViewer() === "solid"}>
            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Uses react-pdf library for client-side PDF rendering. Supports text selection, search, and custom annotations.
              </p>
              <PDFViewer file={samplePDFUrl} height={600} />
            </div>
          </Show>

          <Show when={activeViewer() === "chrome"}>
            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Uses native browser PDF viewer through iframe. Lightweight and reliable, works with Chrome, Firefox, and Safari.
              </p>
              <ChromePDFViewer url={samplePDFUrl} height={600} />
            </div>
          </Show>

          <Show when={activeViewer() === "playwright"}>
            <div class="space-y-4">
              <p class="text-sm text-gray-600">
                Uses Puppeteer for server-side PDF generation from HTML. Perfect for converting invoices, receipts, or any HTML content to PDF.
              </p>
              <PlaywrightPDFViewer htmlContent={sampleHTML} height={600} />
            </div>
          </Show>
        </div>

        {/* Feature Comparison */}
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Feature Comparison</h2>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-3 font-medium">Feature</th>
                  <th class="text-left p-3 font-medium">Solid PDF Viewer</th>
                  <th class="text-left p-3 font-medium">Chrome PDF Viewer</th>
                  <th class="text-left p-3 font-medium">Playwright PDF Viewer</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="p-3">Text Selection</td>
                  <td class="p-3 text-green-600">✓ Yes</td>
                  <td class="p-3 text-green-600">✓ Yes</td>
                  <td class="p-3 text-red-600">✗ No</td>
                </tr>
                <tr class="border-b">
                  <td class="p-3">Search</td>
                  <td class="p-3 text-green-600">✓ Yes</td>
                  <td class="p-3 text-green-600">✓ Yes</td>
                  <td class="p-3 text-red-600">✗ No</td>
                </tr>
                <tr class="border-b">
                  <td class="p-3">Custom Styling</td>
                  <td class="p-3 text-green-600">✓ Yes</td>
                  <td class="p-3 text-red-600">✗ No</td>
                  <td class="p-3 text-green-600">✓ Yes (via HTML)</td>
                </tr>
                <tr class="border-b">
                  <td class="p-3">Performance</td>
                  <td class="p-3 text-yellow-600">Medium</td>
                  <td class="p-3 text-green-600">Fast</td>
                  <td class="p-3 text-yellow-600">Slow (server-side)</td>
                </tr>
                <tr class="border-b">
                  <td class="p-3">Browser Support</td>
                  <td class="p-3 text-green-600">All</td>
                  <td class="p-3 text-green-600">All</td>
                  <td class="p-3 text-green-600">All</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
