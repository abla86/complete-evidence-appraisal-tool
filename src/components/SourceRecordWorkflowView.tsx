import React, { useMemo, useState } from 'react';
import { useStudioState } from '../state/StudioStateContext';
import type { SourceRecord } from '../domain/sourceRecord';
import { validateSourceRecord } from '../services/validateSourceRecord';
import { validateReference } from '../services/referenceIntegrityService';
import { appendAuditEntry } from '../services/auditTrailService';
import {
  intakeSourceRecord,
  linkRecordToScreeningBatch,
  transitionScreeningState,
  attachReviewedRecordToPico,
  type IntakeStore,
  type Actor,
  type AuditWriter,
} from '../services/sourceIntakeService';

const ACTOR: Actor = { id: 'test-group-user', role: 'reviewer' };

class MemoryStore implements IntakeStore {
  private records = new Map<string, SourceRecord>();
  getRecord(id: string) { return this.records.get(id); }
  saveRecord(record: SourceRecord) { this.records.set(record.recordId, structuredClone(record)); }
}

class TrailWriter implements AuditWriter {
  append(input: Parameters<typeof appendAuditEntry>[0]) {
    return appendAuditEntry(input);
  }
}

export const SourceRecordWorkflowView: React.FC = () => {
  const { articles, setArticles } = useStudioState();
  const [pico, setPico] = useState({ population: '', intervention: '', comparison: '', outcome: '' });
  const [json, setJson] = useState('');
  const [record, setRecord] = useState<SourceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [batchId, setBatchId] = useState('screening-batch-1');
  const [picoId, setPicoId] = useState('pico-1');
  const included = articles.filter(a => a.lifecycleStatus === 'FINALIZED' || a.overallVerdict === 'Inkluder').length;
  const excluded = articles.filter(a => a.overallVerdict === 'Ekskluder').length;
  const unresolved = Math.max(0, articles.length - included - excluded);
  const selected = articles.find(a => a.id === record?.recordId) || articles[0];

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'i') applyDecision('Inkluder');
      if (key === 'e') applyDecision('Ekskluder');
      if (key === 'u') applyDecision('Vurder videre');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const applyDecision = (decision: 'Inkluder' | 'Ekskluder' | 'Vurder videre') => {
    if (!selected) return;
    setArticles(current => current.map(article => article.id === selected.id ? { ...article, overallVerdict: decision, verdictNote: decision === 'Ekskluder' ? 'Ekskludert i screening; begrunnelse dokumenteres i audit trail.' : article.verdictNote } : article));
    setMessage('Screeningbeslutning registrert: ' + decision + '.');
  };
  const store = useMemo(() => new MemoryStore(), []);
  const auditWriter = useMemo(() => new TrailWriter(), []);

  const importRecord = async () => {
    setMessage('');
    try {
      const parsed = JSON.parse(json);
      const validation = validateSourceRecord(parsed);
      if (!validation.ok) {
        setMessage(`Import avvist: ${validation.errors.join(' ')}`);
        return;
      }
      const result = await intakeSourceRecord(parsed, ACTOR, store, auditWriter);
      if (!result.accepted) {
        setMessage(`Import avvist: ${result.reason}`);
        return;
      }
      setRecord(result.record);
      setMessage(`Importert. Status: ${result.record.referenceDraft.status.toUpperCase()} / ${result.record.intake.screeningState}`);
    } catch (error) {
      setMessage(`Importfeil: ${error instanceof Error ? error.message : 'ugyldig JSON'}`);
    }
  };

  const link = async () => {
    if (!record) return;
    const result = await linkRecordToScreeningBatch(record, batchId, ACTOR, auditWriter);
    setRecord(result.linked ? result.record : record);
    setMessage(result.linked ? 'Koblet til screening-batch.' : `Kobling avvist: ${result.reason}`);
  };

  const review = async () => {
    if (!record) return;
    const result = await transitionScreeningState(record, 'reviewed', ACTOR, auditWriter, 'Testgruppe-screening fullfÃ¸rt');
    setRecord(result.transitioned ? result.record : record);
    setMessage(result.transitioned ? 'Screeningstatus: reviewed.' : `Screening avvist: ${result.reason}`);
  };

  const attach = async () => {
    if (!record) return;
    const result = await attachReviewedRecordToPico(record, picoId, ACTOR, auditWriter);
    setMessage(result.attached ? `Knyttet til PICO ${result.picoEntityId}. Referanse er fortsatt ikke verifisert.` : `PICO-attach avvist: ${result.reason}`);
    if (result.attached) setRecord({ ...record, intake: { ...record.intake, screeningState: 'included' } });
  };

  const verifyReferenceLocally = () => {
    if (!record) return;
    const fields = record.metadata.fields ?? {};
    const result = validateReference({
      kind: 'JOURNAL_ARTICLE',
      authors: (Array.isArray(fields.authors) ? fields.authors : []).map(a => { const author = a && typeof a === 'object' ? a as Record<string, unknown> : {}; return `${String(author.family ?? '')}, ${String(author.given ?? '')}`.trim(); }).join('; '),
      year: typeof fields.publicationDate === 'string' ? fields.publicationDate.slice(0, 4) : undefined,
      title: typeof fields.title === 'string' ? fields.title : '',
      journal: typeof fields.journalTitle === 'string' ? fields.journalTitle : '',
      volume: typeof fields.volume === 'string' ? fields.volume : undefined,
      issue: typeof fields.issue === 'string' ? fields.issue : undefined,
      pages: [fields.firstPage, fields.lastPage].filter((value): value is string => typeof value === 'string' && Boolean(value)).join('-'),
      doi: record.identifiers.doi?.normalized,
      url: record.source.url,
    });
    setMessage(`Referansestatus: ${result.status}. Lokal validering er ikke det samme som kildeverifisering.`);
  };

  return (
    <section className="space-y-6">
      <header className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div><h2 className="text-2xl font-bold text-slate-900">Screening & PICO Studio</h2><p className="mt-1 text-sm text-slate-600">Levende screening av studiene i prosjekt-state. Beslutninger brukes videre i PRISMA- og synteseflyten.</p></div>
          <div className="grid grid-cols-3 gap-2 min-w-[20rem]">
            <Metric label="Screenet" value={articles.length - unresolved} />
            <Metric label="Inkludert" value={included} />
            <Metric label="Ekskludert" value={excluded} />
          </div>
        </div>
      </header>
      <div className="grid xl:grid-cols-2 gap-5">
        <article className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div><h3 className="font-bold">PICO-tagging</h3><p className="text-xs text-slate-500">Tagg problemstillingen eksplisitt fÃ¸r metodisk vurdering.</p></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1"><span className="text-xs font-semibold capitalize">population</span><input value={pico.population} onChange={e=>setPico(v=>({...v,population:e.target.value}))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Legg til tag..." /></label><label className="space-y-1"><span className="text-xs font-semibold capitalize">intervention</span><input value={pico.intervention} onChange={e=>setPico(v=>({...v,intervention:e.target.value}))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Legg til tag..." /></label><label className="space-y-1"><span className="text-xs font-semibold capitalize">comparison</span><input value={pico.comparison} onChange={e=>setPico(v=>({...v,comparison:e.target.value}))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Legg til tag..." /></label><label className="space-y-1"><span className="text-xs font-semibold capitalize">outcome</span><input value={pico.outcome} onChange={e=>setPico(v=>({...v,outcome:e.target.value}))} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" placeholder="Legg til tag..." /></label>
          </div>
          <div className="flex flex-wrap gap-2">{Object.entries(pico).filter(([,v])=>v.trim()).map(([k,v])=><span key={k} className={`text-[10px] px-2 py-1 rounded-full font-bold border ${k==='population'?'bg-blue-50 text-blue-900 border-blue-300':k==='intervention'?'bg-indigo-50 text-indigo-900 border-indigo-300':k==='comparison'?'bg-amber-50 text-amber-900 border-amber-300':'bg-emerald-50 text-emerald-900 border-emerald-300'}`}>{k}: {v}</span>)}</div>
        </article>
        <article className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
          <div><h3 className="font-bold">Hurtigscreening</h3><p className="text-xs text-slate-300">Valgt studie: {selected?.title || 'Ingen studie valgt'}</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={()=>applyDecision('Inkluder')} className="px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold text-sm">Inkluder (I)</button>
            <button type="button" onClick={()=>applyDecision('Ekskluder')} className="px-4 py-2 rounded-xl bg-rose-400 text-slate-950 font-bold text-sm">Ekskluder (E)</button>
            <button type="button" onClick={()=>applyDecision('Vurder videre')} className="px-4 py-2 rounded-xl bg-amber-300 text-slate-950 font-bold text-sm">Uavklart (U)</button>
          </div>
          <div className="text-xs text-slate-300">Bruk I/E/U i screeningarbeidet. Valget lagres i felles prosjekt-state.</div>
          {!selected && <div role="status" className="rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">Velg eller importer en studie fÃ¸r screening kan registreres.</div>}
        </article>
      </div>
      <header>
        <h2 className="text-2xl font-bold text-slate-900">SourceRecord â†’ Screening â†’ PICO</h2>
        <p className="mt-1 text-sm text-slate-600">Eksplisitt testflyt. Hver handling er separat og spores i canonical audit trail.</p>
      </header>
      <div className="grid xl:grid-cols-3 gap-5">
        <article className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <label className="text-xs font-bold text-slate-700">SourceRecord JSON</label>
          <textarea value={json} onChange={e => setJson(e.target.value)} className="w-full min-h-72 rounded-xl border border-slate-300 p-3 font-mono text-xs" placeholder="Lim inn SourceRecord JSON fra extensionen..." />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void importRecord()} className="px-4 py-2 rounded-xl bg-teal-800 text-white text-sm font-bold">Importer</button>
            <button onClick={verifyReferenceLocally} disabled={!record} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold disabled:opacity-40">Valider referanse lokalt</button>
          </div>
        </article>
        <article className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">Workflow</h3>
          <div className="text-xs space-y-2">
            <div>Reference: <strong>{record?.referenceDraft.status ?? 'â€”'}</strong></div>
            <div>Screening: <strong>{record?.intake.screeningState ?? 'â€”'}</strong></div>
            <div>Record ID: <strong>{record?.recordId ?? 'â€”'}</strong></div>
          </div>
          <input value={batchId} onChange={e => setBatchId(e.target.value)} className="w-full rounded-lg p-2 text-slate-900 text-sm" placeholder="Screening-batch" />
          <button onClick={() => void link()} disabled={!record} title={!record ? 'Importer en SourceRecord fÃ¸rst.' : 'Koble valgt SourceRecord til screening-batch.'} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-sm disabled:opacity-40">1. Koble batch</button>
          {!record && <p className="text-[11px] text-slate-300">Importer en SourceRecord fÃ¸rst for Ã¥ aktivere workflow-handlingene.</p>}
          <button onClick={() => void review()} disabled={!record} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-sm disabled:opacity-40">2. Marker reviewed</button>
          <input value={picoId} onChange={e => setPicoId(e.target.value)} className="w-full rounded-lg p-2 text-slate-900 text-sm" placeholder="PICO/PECO-id" />
          <button onClick={() => void attach()} disabled={!record} className="w-full px-3 py-2 rounded-lg bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-40">3. Koble til PICO</button>
        </article>
      </div>
      {message && <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{message}</div>}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
        <strong>Verifikasjonsregel:</strong> metadata-kompletthet eller lokal syntakskontroll oppgraderer ikke en kilde til <code>VALIDATED</code>. Egen, eksplisitt verifisering mÃ¥ fortsatt skje.
      </div>
    </section>
  );
};

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="text-xl font-bold">{value}</div></div>; }


