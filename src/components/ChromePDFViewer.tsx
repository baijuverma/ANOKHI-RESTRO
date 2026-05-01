import { createSignal, onMount, Show } from "solid-js";

interface ChromePDFViewerProps {
  url?: string;
  file?: File;
  width?: number;
  height?: number;
}

export default function ChromePDFViewer(props: ChromePDFViewerProps) {
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string>("");
  const [pdfUrl, setPdfUrl] = createSignal<string>("");

  onMount(async () => {
    try {
      if (props.file) {
        // Convert File to URL
        const url = URL.createObjectURL(props.file);
        setPdfUrl(url);
      } else if (props.url) {
        setPdfUrl(props.url);
      } else {
        setError("No PDF file or URL provided");
      }
      setLoading(false);
    } catch (err) {
      setError("Failed to load PDF");
      setLoading(false);
    }
  });

  return (
    <div class="w-full bg-white rounded-lg shadow-lg border border-slate-200">
      {/* Header */}
      <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-blue-600 rounded-sm"></div>
          <span class="text-sm font-medium text-slate-700">Chrome PDF Viewer</span>
        </div>
        <div class="text-sm text-slate-500">
          Embedded Viewer
        </div>
      </div>

      {/* PDF Content */}
      <div class="relative" style={`height: ${props.height || "600px"};`}>
        <Show when={loading()}>
          <div class="flex items-center justify-center h-full">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p class="text-slate-500">Loading PDF...</p>
            </div>
          </div>
        </Show>

        <Show when={error()}>
          <div class="flex items-center justify-center h-full">
            <div class="text-center text-red-500">
              <p class="font-bold">Error loading PDF</p>
              <p class="text-sm">{error()}</p>
            </div>
          </div>
        </Show>

        <Show when={!loading() && !error() && pdfUrl()}>
          <iframe
            src={`${pdfUrl()}#toolbar=1&navpanes=1&scrollbar=1`}
            class="w-full h-full border-0"
            title="PDF Viewer"
            onLoad={() => setLoading(false)}
            onError={() => setError("Failed to load PDF in iframe")}
          />
        </Show>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
        <div class="text-xs text-slate-500">
          Native PDF Viewer
        </div>
        <div class="text-xs text-slate-400">
          Chrome/Firefox/Safari Compatible
        </div>
      </div>
    </div>
  );
}
