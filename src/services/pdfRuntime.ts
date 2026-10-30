/**
 * One place that loads and configures PDF.js for every PDF feature.
 * - Web edition: the worker is a separate cached asset (runs off the main thread).
 * - Offline edition (single HTML file opened from disk): browsers block worker files on file://,
 *   so the worker code is bundled and PDF.js runs it on the main thread.
 * PDFs are always parsed on the user's device; nothing is uploaded.
 */
type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

let loading: Promise<PdfJs> | null = null;

export function loadPdfjs(): Promise<PdfJs> {
  loading ??= (async () => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (typeof window !== 'undefined') {
      if (import.meta.env?.MODE === 'offline') {
        const worker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
        (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = worker;
      } else if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();
      }
    }
    return pdfjs;
  })();
  return loading;
}
