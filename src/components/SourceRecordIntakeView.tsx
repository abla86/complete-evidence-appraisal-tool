import React, { useMemo, useState } from 'react';
import type { SourceRecord } from '../domain/sourceRecord';
import { AuditTrailService } from '../services/auditTrailService';
import { importSourceRecordJson } from '../services/sourceRecordIntakeAdapter';

const actor = { id: 'test-reviewer', role: 'reviewer' as const };

export const SourceRecordIntakeView: React.FC = () => {
  const [json, setJson] = useState('');
  const [record, setRecord] = useState<SourceRecord | null>(null);
  const [message, setMessage] = useState('');
  const [audit] = useState(() => new AuditTrailService());
  const [stored, setStored] = useState<SourceRecord[]>([]);

  const store = useMemo(() => ({
    getRecord: (id: string) => stored.find((item) => item.recordId === id),
    saveRecord: (next: SourceRecord) => setStored((prev) => [...prev, next]),
  }), [stored]);

  const handleImport = async () => {
    setMessage('');
    const result = await importSourceRecordJson(json, actor, store, audit);
    if (!result.accepted) {
      setRecord(null);
      setMessage(`Import avvist: ${result.errors.join(' | ')}`);
      return;
    }
    setRecord(result.record);
    setMessage(`Kilde mottatt. Screeningstatus: ${result.record.intake?.screeningState ?? 'unassigned'}`);
  };

  const handleDemo = () => {
    const demo: SourceRecord = {
      schemaVersion: '1.0.0',
      recordId: crypto.randomUUID(),
      source: { url: 'https://example.org/article', capturedAt: new Date().toISOString() },
      metadata: {
        sourceUrl: 'https://example.org/article', detectedAt: new Date().toISOString(), detectedFrom: ['manual'],
        status: 'COMPLETE', missingFields: [], title: 'Eksempelstudie', authors: ['Doe, J.'],
        journal: 'Example Journal', publicationDate: '2026', volume: '1', issue: '1'
      },
      identifiers: { doi: null },
      referenceDraft: { apa7: 'Doe, J. (2026). Eksempelstudie. Example Journal.', status: 'complete', note: 'Draft – detected metadata, not verified against source' },
      legalReference: null,
      privacy: { sourceUrl: 'https://example.org/article', analyzedAt: new Date().toISOString(), externalResourceCount: 0, externalHosts: [], trackingIndicatorCount: 0, trackingHosts: [], signals: [], localOnlyAnalysis: true, localOnly: true },
      provenance: { tool: 'superprogram-demo', toolVersion: '1.0.0', collectedLocally: true, externalRequestsMade: false, collectedAt: new Date().toISOString() }
    };
    setJson(JSON.stringify(demo, null, 2));
    setMessage('Eksempel lastet. Trykk Â«Importer kildepostÂ».');
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900">SourceRecord Intake</h2>
        <p className="text-sm text-slate-600 mt-1">Motta, valider og registrer Ã©n kildepost fÃ¸r den kobles til screening og PICO/PECO.</p>
      </header>

      <div className="flex gap-2">
        <button type="button" onClick={handleDemo} className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-sm font-semibold">Last eksempel</button>
        <button type="button" onClick={handleImport} className="px-3 py-2 rounded-lg bg-teal-800 text-white text-sm font-semibold">Importer kildepost</button>
      </div>

      <textarea value={json} onChange={(e) => setJson(e.target.value)} className="w-full min-h-80 border border-slate-300 rounded-xl p-3 font-mono text-xs" placeholder="Lim inn SourceRecord JSON" aria-label="SourceRecord JSON" />

      {message && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">{message}</div>}

      {record && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-2">
          <div><strong>recordId:</strong> {record.recordId}</div>
          <div><strong>Kilde:</strong> {record.source.url}</div>
          <div><strong>Metadata:</strong> {record.metadata.status}</div>
          <div><strong>Referanse:</strong> {record.referenceDraft.status} â€” ikke verifisert</div>
          <div><strong>Screening:</strong> {record.intake?.screeningState}</div>
          <div><strong>Audit events:</strong> {audit.list().length}</div>
        </div>
      )}
    </section>
  );
};


