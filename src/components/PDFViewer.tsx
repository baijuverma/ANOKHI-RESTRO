import { createSignal, onMount, Show } from "solid-js";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string | File | ArrayBuffer;
  width?: number;
  height?: number;
}

export default function PDFViewer(props: PDFViewerProps) {
  const [numPages, setNumPages] = createSignal<number>(0);
  const [pageNumber, setPageNumber] = createSignal<number>(1);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string>("");

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: any) => {
    setError("Failed to load PDF document");
    setLoading(false);
    console.error("PDF loading error:", error);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages());
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  return (
    <div class="w-full bg-white rounded-lg shadow-lg border border-slate-200">
      {/* Header Controls */}
      <div class="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div class="flex items-center gap-2">
          <button
            onClick={previousPage}
            disabled={pageNumber() <= 1}
            class="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span class="text-sm font-medium text-slate-700">
            Page {pageNumber()} of {numPages()}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber() >= numPages()}
            class="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
        <div class="text-sm text-slate-500">
          PDF Viewer
        </div>
      </div>

      {/* PDF Content */}
      <div class="relative overflow-auto" style={{ height: props.height || "600px" }}>
        <Show when={loading()}>
          <div class="flex items-center justify-center h-96">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p class="text-slate-500">Loading PDF...</p>
            </div>
          </div>
        </Show>

        <Show when={error()}>
          <div class="flex items-center justify-center h-96">
            <div class="text-center text-red-500">
              <p class="font-bold">Error loading PDF</p>
              <p class="text-sm">{error()}</p>
            </div>
          </div>
        </Show>

        <Show when={!loading() && !error()}>
          <div class="flex justify-center p-4">
            <Document
              file={props.file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div>Loading...</div>}
              error={<div>Failed to load PDF</div>}
            >
              <Page
                pageNumber={pageNumber()}
                width={props.width}
                className="shadow-md"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <div class="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
        <div class="flex gap-2">
          <button
            onClick={() => setPageNumber(1)}
            disabled={pageNumber() === 1}
            class="px-2 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => setPageNumber(numPages())}
            disabled={pageNumber() === numPages()}
            class="px-2 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Last
          </button>
        </div>
        <div class="text-xs text-slate-400">
          Powered by PDF.js
        </div>
      </div>
    </div>
  );
}
