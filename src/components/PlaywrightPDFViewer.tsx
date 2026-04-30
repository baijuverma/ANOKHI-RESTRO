import { createSignal, onMount, Show } from "solid-js";
import puppeteer from "puppeteer";

interface PlaywrightPDFViewerProps {
  htmlContent?: string;
  url?: string;
  width?: number;
  height?: number;
}

export default function PlaywrightPDFViewer(props: PlaywrightPDFViewerProps) {
  const [loading, setLoading] = createSignal<boolean>(false);
  const [pdfUrl, setPdfUrl] = createSignal<string>("");
  const [error, setError] = createSignal<string>("");

  const generatePDF = async () => {
    setLoading(true);
    setError("");

    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      if (props.htmlContent) {
        // Set content and generate PDF
        await page.setContent(props.htmlContent);
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });

        // Convert buffer to blob URL
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else if (props.url) {
        // Navigate to URL and generate PDF
        await page.goto(props.url, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });

        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }

      await browser.close();
      setLoading(false);
    } catch (err) {
      setError("Failed to generate PDF with Playwright");
      setLoading(false);
      console.error("Playwright PDF generation error:", err);
    }
  };

  onMount(() => {
    generatePDF();
  });

  return (
    <div class="w-full bg-white rounded-lg shadow-lg border border-slate-200">
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-purple-600 rounded-sm"></div>
          <span class="text-sm font-medium text-slate-700">Playwright PDF Viewer</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            onClick={generatePDF}
            disabled={loading()}
            class="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading() ? "Generating..." : "Regenerate PDF"}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div class="relative" style={`height: ${props.height || "600px"};`}>
        <Show when={loading()}>
          <div class="flex items-center justify-center h-full">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p class="text-slate-500">Generating PDF with Playwright...</p>
              <p class="text-xs text-slate-400 mt-2">This may take a few seconds</p>
            </div>
          </div>
        </Show>

        <Show when={error()}>
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-red-500">
              <p class="font-bold">PDF Generation Error</p>
              <p class="text-sm">{error()}</p>
              <button
                onClick={generatePDF}
                class="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </Show>

        <Show when={!loading() && !error() && pdfUrl()}>
          <iframe
            src={`${pdfUrl()}#toolbar=1&navpanes=1&scrollbar=1`}
            class="w-full h-full border-0"
            title="Generated PDF"
          />
        </Show>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
        <div class="text-xs text-slate-500">
          Server-side PDF Generation
        </div>
        <div class="text-xs text-slate-400">
          Powered by Puppeteer
        </div>
      </div>
    </div>
  );
}
