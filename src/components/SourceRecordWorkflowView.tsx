import React, { useMemo, useState } from 'react';
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
  const [json, setJson] = useState('');
  const [record, setRecord] = useState<SourceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [batchId, setBatchId] = useState('screening-batch-1');
  const [picoId, setPicoId] = useState('pico-1');

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
    const result = await transitionScreeningState(record, 'reviewed', ACTOR, auditWriter, 'Testgruppe-screening fullført');
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
    const fields = record.metadata.fields;
    const result = validateReference({
      kind: 'JOURNAL_ARTICLE',
      authors: fields.authors?.map(a => `${a.family}, ${a.given ?? ''}`.trim()).join('; '),
      year: fields.publicationDate?.slice(0, 4),
      title: fields.title ?? '',
      journal: fields.journalTitle ?? '',
      volume: fields.volume ?? undefined,
      issue: fields.issue ?? undefined,
      pages: [fields.firstPage, fields.lastPage].filter(Boolean).join('-'),
      doi: record.identifiers.doi?.normalized,
      url: record.source.url,
    });
    setMessage(`Referansestatus: ${result.status}. Lokal validering er ikke det samme som kildeverifisering.`);
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">SourceRecord → Screening → PICO</h2>
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
            <div>Reference: <strong>{record?.referenceDraft.status ?? '—'}</strong></div>
            <div>Screening: <strong>{record?.intake.screeningState ?? '—'}</strong></div>
            <div>Record ID: <strong>{record?.recordId ?? '—'}</strong></div>
          </div>
          <input value={batchId} onChange={e => setBatchId(e.target.value)} className="w-full rounded-lg p-2 text-slate-900 text-sm" placeholder="Screening-batch" />
          <button onClick={() => void link()} disabled={!record} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-sm disabled:opacity-40">1. Koble batch</button>
          <button onClick={() => void review()} disabled={!record} className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 font-bold text-sm disabled:opacity-40">2. Marker reviewed</button>
          <input value={picoId} onChange={e => setPicoId(e.target.value)} className="w-full rounded-lg p-2 text-slate-900 text-sm" placeholder="PICO/PECO-id" />
          <button onClick={() => void attach()} disabled={!record} className="w-full px-3 py-2 rounded-lg bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-40">3. Koble til PICO</button>
        </article>
      </div>
      {message && <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{message}</div>}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
        <strong>Verifikasjonsregel:</strong> metadata-kompletthet eller lokal syntakskontroll oppgraderer ikke en kilde til <code>VALIDATED</code>. Egen, eksplisitt verifisering må fortsatt skje.
      </div>
    </section>
  );
};
