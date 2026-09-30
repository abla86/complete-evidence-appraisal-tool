import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type PDFPageProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PdfAnnotationCoordinates } from '../services/evidenceLinkService';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export interface PdfSelection {
  page: number;
  quote: string;
  coordinates: PdfAnnotationCoordinates[];
}

interface Props {
  file: File;
  initialPage?: number;
  onSelection?: (selection: PdfSelection) => void;
}

interface RenderedPage {
  page: number;
  viewportWidth: number;
  viewportHeight: number;
  text: TextItem[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  layerRef: React.RefObject<HTMLDivElement | null>;
}

const isTextItem = (item: unknown): item is TextItem =>
  !!item && typeof item === 'object' && 'str' in item && 'transform' in item;

export const PdfEvidenceViewer: React.FC<Props> = ({ file, initialPage = 1, onSelection }) => {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [error, setError] = useState<string | null>(null);
  const renderToken = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError(null);
      setPages([]);
      try {
        const data = new Uint8Array(await file.arrayBuffer());
        const loaded = await getDocument({ data }).promise;
        if (cancelled) {
          return;
        }
        setPdf(loaded);
        const next: RenderedPage[] = [];
        for (let pageNumber = 1; pageNumber <= loaded.numPages; pageNumber += 1) {
          const page = await loaded.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.25 });
          const content = await page.getTextContent();
          next.push({
            page: pageNumber,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            text: content.items.filter(isTextItem),
            canvasRef: React.createRef<HTMLCanvasElement>(),
            layerRef: React.createRef<HTMLDivElement>(),
          });
        }
        if (!cancelled) setPages(next);
        else return;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'PDF kunne ikke vises.');
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!pdf || pages.length === 0) return;
    const token = ++renderToken.current;
    const render = async () => {
      for (const entry of pages) {
        if (token !== renderToken.current) return;
        const page: PDFPageProxy = await pdf.getPage(entry.page);
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = entry.canvasRef.current;
        if (!canvas) continue;
        const context = canvas.getContext('2d');
        if (!context) continue;
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      }
    };
    void render();
  }, [pdf, pages]);

  const emitSelection = () => {
    if (!onSelection) return;
    const entry = pages.find(item => item.page === selectedPage);
    const layer = entry?.layerRef.current;
    if (!entry || !layer) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    if (!layer.contains(selection.anchorNode) || !layer.contains(selection.focusNode)) return;

    const quote = selection.toString().trim();
    if (!quote) return;

    const layerRect = layer.getBoundingClientRect();
    const coordinates = Array.from(selection.getRangeAt(0).getClientRects())
      .map(rect => ({
        x: (rect.left - layerRect.left) / layerRect.width,
        y: (rect.top - layerRect.top) / layerRect.height,
        width: rect.width / layerRect.width,
        height: rect.height / layerRect.height,
      }))
      .filter(rect => rect.width > 0 && rect.height > 0 && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite));

    if (coordinates.length > 0) onSelection({ page: selectedPage, quote, coordinates });
  };

  const pageOptions = useMemo(() => pages.map(page => page.page), [pages]);

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">PDF-visning feilet: {error}</div>;
  }

  if (!pdf) {
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">Laster PDF-renderer …</div>;
  }

  const active = pages.find(page => page.page === selectedPage);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-700" htmlFor="pdf-evidence-page">Side</label>
        <select
          id="pdf-evidence-page"
          value={selectedPage}
          onChange={event => setSelectedPage(Number(event.target.value))}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
        >
          {pageOptions.map(page => <option key={page} value={page}>{page}</option>)}
        </select>
        <button
          type="button"
          onMouseUp={emitSelection}
          className="text-xs font-semibold text-teal-700 hover:underline"
        >
          Bruk markert tekst som evidens
        </button>
      </div>

      {active && (
        <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-300 bg-slate-100 p-4">
          <div
            ref={active.layerRef}
            className="relative mx-auto bg-white shadow-sm"
            style={{ width: active.viewportWidth, height: active.viewportHeight }}
            onMouseUp={emitSelection}
          >
            <canvas ref={active.canvasRef} className="absolute inset-0 block" />
            <div className="absolute inset-0 select-text" aria-label={`PDF side ${active.page}`}>
              {active.text.map((item, index) => {
                const [a, b, c, d, e, f] = item.transform;
                const fontSize = Math.max(4, Math.hypot(a, b));
                const left = e;
                const top = active.viewportHeight - f - fontSize;
                const scaleX = Math.max(0.2, Math.hypot(c, d) / Math.max(fontSize, 1));
                return (
                  <span
                    key={`${active.page}-${index}`}
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      fontSize,
                      lineHeight: 1,
                      whiteSpace: 'pre',
                      transform: `scaleX(${scaleX})`,
                      transformOrigin: 'left top',
                    }}
                  >
                    {item.str}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
