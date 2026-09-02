import React, { useMemo, useState } from 'react';
import type { ReferenceRecord, ReferenceAttachment } from '../services/referenceHubService';
import { createPdfAttachment } from '../services/pdfAttachmentService';

interface Props { references: ReferenceRecord[]; onChange: (records: ReferenceRecord[]) => void; }

export const PdfEvidenceWorkspace: React.FC<Props> = ({ references, onChange }) => {
  const [referenceId, setReferenceId] = useState(references[0]?.id ?? '');
  const [selectedFile, setSelectedFile] = useState('');
  const [message, setMessage] = useState('');

  const selected = useMemo(() => references.find(r => r.id === referenceId), [references, referenceId]);
  const pdfs = selected?.attachments.filter(a => a.kind === 'PDF') ?? [];

  const attach = async (file: File) => {
    if (!selected) { setMessage('Velg en referanse først.'); return; }
    try {
      const created = await createPdfAttachment(file, selected.id);
      const attachment: ReferenceAttachment = { id: created.id, kind: 'PDF', name: created.name, mimeType: created.mimeType, sha256: created.sha256, addedAt: created.addedAt };
      onChange(references.map(r => r.id === selected.id ? { ...r, attachments: [...r.attachments, attachment], updatedAt: new Date().toISOString() } : r));
      setSelectedFile(file.name);
      setMessage(`PDF koblet til «${selected.title}». SHA-256 er beregnet lokalt.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'PDF kunne ikke legges til.');
    }
  };

  return <section className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5">
    <div><div className="text-[10px] uppercase tracking-wide text-slate-500">Evidence Appraisal · Fulltekst</div><h2 className="text-xl font-bold font-serif">PDF → kilde</h2><p className="text-sm text-slate-600 mt-1">Velg referanse og legg til fulltekst. Filen knyttes til den kanoniske Reference Hub-posten.</p></div>
    <select value={referenceId} onChange={e => setReferenceId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="">Velg referanse</option>{references.map(r => <option key={r.id} value={r.id}>{r.title || 'Uten tittel'}</option>)}</select>
    <label className="block rounded-xl border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:bg-slate-50"><input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e => { const file = e.target.files?.[0]; if (file) void attach(file); }} /><div className="font-semibold">Last opp PDF</div><div className="text-xs text-slate-500 mt-1">Lagring og hash skjer lokalt i nettleseren.</div></label>
    {message && <div role="status" className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2 text-sm text-sky-900">{message}</div>}
    {selected && <div className="rounded-xl bg-slate-50 border border-slate-200 p-4"><div className="text-sm font-bold">{selected.title}</div><div className="text-xs text-slate-500 mt-1">PDF-er: {pdfs.length}{selectedFile ? ` · Sist lagt til: ${selectedFile}` : ''}</div><div className="space-y-2 mt-3">{pdfs.map(pdf => <div key={pdf.id} className="rounded-lg bg-white border border-slate-200 p-3 text-xs"><div className="font-semibold">{pdf.name}</div><div className="text-slate-500 mt-1">SHA-256: {pdf.sha256 || 'mangler'}</div></div>)}</div></div>}
  </section>;
};
