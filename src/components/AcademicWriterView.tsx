import React, { useMemo, useState } from 'react';
import { createId } from '../utils/id';
import type { ReferenceRecord } from '../services/referenceHubService.ts';
import {
  auditAcademicProject,
  buildGroundedParagraph,
  createAcademicWritingProject,
  PHD_SECTIONS,
  MASTER_SECTIONS,
  type AcademicLevel,
  type ClaimLedgerEntry,
  type WritingMode,
} from '../services/academicWritingService.ts';

interface AcademicWriterViewProps {
  references: ReferenceRecord[];
}

const MODES: Array<{ value: WritingMode; label: string }> = [
  { value: 'WRITE_FROM_SOURCES', label: 'Skriv fra kilder' },
  { value: 'SYNTHESIZE_SOURCES', label: 'Syntetiser kilder' },
  { value: 'WRITE_FROM_PROJECT_DATA', label: 'Skriv fra prosjektdata' },
  { value: 'EDIT_ONLY', label: 'Kun sprÃ¥kvask' },
  { value: 'ARGUMENT_AUDIT', label: 'Argumentaudit' },
  { value: 'CITATION_AUDIT', label: 'Siteringsaudit' },
  { value: 'SUPERVISOR_REVIEW', label: 'Veiledergjennomgang' },
  { value: 'EXAMINER_REVIEW', label: 'Sensor-/eksamensgjennomgang' },
];

export const AcademicWriterView: React.FC<AcademicWriterViewProps> = ({ references }) => {
  const [level, setLevel] = useState<AcademicLevel>('MASTER');
  const [mode, setMode] = useState<WritingMode>('WRITE_FROM_SOURCES');
  const [title, setTitle] = useState('Nytt forskningsarbeid');
  const [question, setQuestion] = useState('');
  const [claims, setClaims] = useState<ClaimLedgerEntry[]>([]);
  const [draftClaim, setDraftClaim] = useState('');
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);

  const project = useMemo(() => createAcademicWritingProject({
    id: 'current-writing-project',
    title,
    academicLevel: level,
    writingMode: mode,
    researchQuestion: question,
    claims,
    referenceIds: selectedReferenceIds,
  }), [title, level, mode, question, claims, selectedReferenceIds]);

  const audit = useMemo(() => auditAcademicProject(project, references), [project, references]);
  const groundedPreview = useMemo(() => buildGroundedParagraph(claims, references), [claims, references]);
  const sections = level === 'PHD' ? PHD_SECTIONS : MASTER_SECTIONS;

  const addClaim = () => {
    const text = draftClaim.trim();
    if (!text) return;
    const id = createId('claim');
    setClaims(current => [...current, {
      id,
      text,
      type: 'AI_SUGGESTION',
      sourceRecordIds: [...selectedReferenceIds],
      evidenceLocations: [],
      supportState: selectedReferenceIds.length > 0 ? 'SOURCE_DETECTED' : 'UNSUPPORTED',
      uncertaintyNote: selectedReferenceIds.length > 0 ? 'Kilden mÃ¥ verifiseres og evidenssted mÃ¥ kobles fÃ¸r pÃ¥standen kan brukes som etablert faktum.' : 'Ingen kilde valgt.',
      researcherApproved: false,
    }]);
    setDraftClaim('');
  };

  const toggleReference = (id: string) => {
    setSelectedReferenceIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  return (
    <div className="space-y-6 pb-16">
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-violet-700 font-bold">Academic Writer</div>
            <h2 className="text-2xl font-bold font-serif text-slate-900">Master + PhD forskningsskriver</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">Skriving er koblet til Reference Hub. FaktapÃ¥stander uten tilstrekkelig stÃ¸tte blir stÃ¥ende som eksplisitte hull i stedet for Ã¥ fylles med oppdiktet informasjon.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={level} onChange={e => setLevel(e.target.value as AcademicLevel)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="MASTER">Master</option>
              <option value="PHD">PhD</option>
              <option value="ARTICLE">Forskningsartikkel</option>
              <option value="REVIEW">Review</option>
              <option value="PROTOCOL">Protokoll</option>
              <option value="REPORT">Forskningsrapport</option>
            </select>
            <select value={mode} onChange={e => setMode(e.target.value as WritingMode)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              {MODES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Prosjekt</h3>
          <label className="block text-sm"><span className="font-semibold">Tittel</span><input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm"><span className="font-semibold">ForskningsspÃ¸rsmÃ¥l</span><textarea value={question} onChange={e => setQuestion(e.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>

          <div>
            <div className="font-semibold text-sm mb-2">Koblede referanser</div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {references.length === 0 && <div className="text-xs text-slate-500">Reference Hub er tom.</div>}
              {references.map(reference => (
                <label key={reference.id} className="flex items-start gap-2 text-xs rounded-xl bg-slate-50 border border-slate-200 p-2">
                  <input type="checkbox" checked={selectedReferenceIds.includes(reference.id)} onChange={() => toggleReference(reference.id)} />
                  <span><strong>{reference.title || 'Uten tittel'}</strong><br />{reference.authors || 'Ukjent forfatter'} Â· {reference.year || 'u.Ã¥.'}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Claim ledger</h3><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${audit.readyForExport ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>{audit.readyForExport ? 'KLAR' : 'MÃ… KONTROLLERES'}</span></div>
          <textarea value={draftClaim} onChange={e => setDraftClaim(e.target.value)} rows={5} placeholder="Skriv inn en pÃ¥stand som skal vurderes mot valgte kilder..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" onClick={addClaim} className="w-full rounded-xl bg-violet-700 text-white py-2 text-sm font-bold">Legg pÃ¥stand i claim ledger</button>
          <div className="space-y-2 max-h-80 overflow-auto">
            {claims.length === 0 && <div className="text-xs text-slate-500">Ingen pÃ¥stander er registrert ennÃ¥.</div>}
            {claims.map(claim => <div key={claim.id} className="rounded-xl border border-slate-200 p-3"><div className="text-sm font-semibold">{claim.text}</div><div className="text-[11px] text-slate-500 mt-1">{claim.supportState} Â· {claim.sourceRecordIds.length} kilde(r) Â· {claim.evidenceLocations.length} evidenssted(er)</div></div>)}
          </div>
        </section>

        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Forskningsstruktur</h3>
          <div className="grid grid-cols-2 gap-2">{sections.map(section => <div key={section} className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs">{section}</div>)}</div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="font-bold text-amber-950 text-sm">Integritetsvakt</div>
            <div className="text-xs text-amber-900 mt-1">UstÃ¸ttede: {audit.unsupportedClaims.length} Â· Uverifiserte kilder: {audit.unverifiedSourceClaims.length} Â· Mangler evidenssted: {audit.missingEvidenceLocations.length}</div>
          </div>
          <div>
            <div className="font-semibold text-sm mb-2">Kildebasert forhÃ¥ndsvisning</div>
            <pre className="whitespace-pre-wrap text-xs bg-slate-950 text-slate-100 rounded-xl p-3 max-h-64 overflow-auto">{groundedPreview || 'Ingen pÃ¥stander lagt inn.'}</pre>
          </div>
        </section>
      </div>
    </div>
  );
};


