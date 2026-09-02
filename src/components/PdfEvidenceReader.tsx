import React, { useMemo, useState } from 'react';
import type { PdfAnnotation } from '../services/pdfAttachmentService';
import { annotationToEvidence, linkAnnotationToEvidence } from '../services/pdfEvidenceBridge';

interface Props {
  file: File;
  referenceId: string;
  reviewerId?: string;
  onEvidence?: (evidence: ReturnType<typeof annotationToEvidence>, link: ReturnType<typeof linkAnnotationToEvidence>) => void;
}

export const PdfEvidenceReader: React.FC<Props> = ({ file, referenceId, reviewerId = 'current-user', onEvidence }) => {
  const [page, setPage] = useState(1);
  const [selectedText, setSelectedText] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  React.useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const createHighlight = () => {
    const text = selectedText.trim();
    if (!text) {
      setMessage('Marker eller lim inn tekst fra PDF før du oppretter evidens.');
      return;
    }

    const annotation: PdfAnnotation = {
      id: crypto.randomUUID(),
      attachmentId: referenceId,
      page,
      type: 'HIGHLIGHT',
      text,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: reviewerId,
    };
    const evidence = annotationToEvidence(annotation, referenceId, reviewerId);
    const link = linkAnnotationToEvidence(annotation, evidence, reviewerId, 1, 'claim');
    setAnnotations(prev => [...prev, annotation]);
    onEvidence?.(evidence, link);
    setSelectedText('');
    setNote('');
    setMessage(`Evidens opprettet fra side ${page}.`);
  };

  return (
    <section className="grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-4 bg-white border border-slate-200 rounded-2xl p-4">
      <div className="min-h-[36rem] rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
        <object data={`${url}#page=${page}`} type="application/pdf" className="w-full h-[36rem]">
          <div className="p-6 text-sm">Nettleseren kan ikke vise PDF direkte. Bruk forhåndsvisning eller åpne filen i PDF-leser.</div>
        </object>
      </div>

      <aside className="space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">PDF → EVIDENCE</div>
          <h3 className="text-lg font-bold">Marker evidens</h3>
          <p className="text-xs text-slate-500 mt-1">Tekstutdrag lagres som evidens med sidereferanse. Forskerverifisering skjer separat.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold">Side<input type="number" min={1} value={page} onChange={e => setPage(Math.max(1, Number(e.target.value) || 1))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs"><div className="text-slate-400">Highlights</div><div className="text-lg font-bold">{annotations.length}</div></div>
        </div>
        <textarea value={selectedText} onChange={e => setSelectedText(e.target.value)} rows={6} placeholder="Lim inn det markerte tekstutdraget her" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Forskerens note" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        <button type="button" onClick={createHighlight} className="w-full rounded-xl bg-teal-800 text-white px-4 py-2 text-sm font-bold">Opprett evidens fra tekst</button>
        {message && <div role="status" className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-sm">{message}</div>}
        {annotations.length > 0 && <div className="space-y-2"><h4 className="text-xs font-bold">Opprettede highlights</h4>{annotations.map(annotation => <div key={annotation.id} className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs"><div className="font-bold">Side {annotation.page}</div><div className="mt-1">{annotation.text}</div></div>)}</div>}
      </aside>
    </section>
  );
};
