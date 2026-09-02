import React, { useMemo, useState } from 'react';
import {
  createHubSnapshot,
  markReferenceVerified,
  REFERENCE_COMPATIBILITY_CAPABILITIES,
  SUPPORTED_REFERENCE_KINDS,
  type ReferenceRecord,
  type ReferenceImportFormat,
} from '../services/referenceHubService';

interface ReferenceHubViewProps {
  records?: ReferenceRecord[];
  onChange?: (records: ReferenceRecord[]) => void;
}

const FORMAT_LABELS: ReferenceImportFormat[] = ['RIS', 'BIBTEX', 'ENDNOTE_XML', 'CSL_JSON', 'CSV', 'JSON', 'MANUAL'];

export const ReferenceHubView: React.FC<ReferenceHubViewProps> = ({ records = [], onChange }) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [filter, setFilter] = useState<'all' | 'validation' | 'duplicates'>('all');

  const snapshot = useMemo(() => createHubSnapshot(records), [records]);
  const duplicateIds = useMemo(() => {
    const set = new Set<string>();
    snapshot.duplicateCandidates.forEach(d => {
      set.add(d.recordId);
      set.add(d.candidateId);
    });
    return set;
  }, [snapshot.duplicateCandidates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshot.records.filter(record => {
      const matchesQuery = !q || [record.title, record.authors, record.journal, record.doi, ...record.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
      const matchesFilter = filter === 'all'
        || (filter === 'validation' && record.verification !== 'VALIDATED')
        || (filter === 'duplicates' && duplicateIds.has(record.id));
      return matchesQuery && matchesFilter;
    });
  }, [snapshot.records, query, filter, duplicateIds]);

  const selected = snapshot.records.find(record => record.id === selectedId) ?? filtered[0] ?? null;

  const verifySelected = () => {
    if (!selected) return;
    const updated = markReferenceVerified(selected, 'current-user');
    onChange?.(records.map(record => record.id === updated.id ? updated : record));
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-serif">Reference Hub</h2>
        <p className="text-sm text-slate-500 max-w-3xl">
          Én felles referansemotor for hele Evidence-systemet. EndNote, Zotero, Mendeley og Paperpile håndteres som kompatibilitets- og import/eksportformater.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Referanser" value={snapshot.records.length} />
        <Metric label="Krever verifikasjon" value={snapshot.records.filter(r => r.verification !== 'VALIDATED').length} />
        <Metric label="Duplikatkandidater" value={snapshot.duplicateCandidates.length} />
        <Metric label="Med PDF" value={snapshot.records.filter(r => r.attachments.some(a => a.kind === 'PDF')).length} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Søk etter tittel, forfatter, tidsskrift, DOI eller tag…" className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-600" />
          <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Alle</option>
            <option value="validation">Krever verifikasjon</option>
            <option value="duplicates">Duplikatkandidater</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 text-xs font-bold bg-slate-50 border-b border-slate-200">Bibliotek</div>
            <div className="max-h-[34rem] overflow-auto">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">Ingen referanser matcher filteret.</div>
              ) : filtered.map(record => (
                <button type="button" key={record.id} onClick={() => setSelectedId(record.id)} className={`w-full text-left p-3 border-b border-slate-100 last:border-0 ${selected?.id === record.id ? 'bg-teal-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">{record.title || 'Uten tittel'}</div>
                      <div className="text-xs text-slate-500 truncate">{record.authors || 'Ukjent forfatter'} · {record.year || 'Ukjent år'}</div>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full border ${record.verification === 'VALIDATED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                      {record.verification === 'VALIDATED' ? 'VALIDERT' : 'KONTROLLER'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            {selected ? (
              <>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Detaljer</div>
                  <h3 className="font-bold text-slate-900 mt-1">{selected.title || 'Uten tittel'}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selected.authors || 'Ukjent forfatter'} · {selected.year || 'Ukjent år'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Detail label="Type" value={selected.kind} />
                  <Detail label="DOI" value={selected.doi || '—'} />
                  <Detail label="Tidsskrift" value={selected.journal || '—'} />
                  <Detail label="Kilde" value={selected.importedFrom.join(', ')} />
                  <Detail label="PDF" value={String(selected.attachments.filter(a => a.kind === 'PDF').length)} />
                  <Detail label="Annotasjoner" value={String(selected.annotations.length)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map(tag => <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700">#{tag}</span>)}
                  {duplicateIds.has(selected.id) && <span className="text-[10px] px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Duplikatkandidat</span>}
                </div>
                {selected.verification !== 'VALIDATED' && (
                  <button type="button" onClick={verifySelected} className="w-full px-3 py-2 rounded-xl bg-teal-800 text-white text-xs font-bold">Marker som eksplisitt verifisert</button>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">Velg en referanse.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <h3 className="font-bold text-slate-900">Kompatibilitet</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {Object.entries(REFERENCE_COMPATIBILITY_CAPABILITIES).map(([name, capabilities]) => (
            <div key={name} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-[11px] text-slate-500 mt-1">{capabilities.join(' · ')}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FORMAT_LABELS.map(format => <span key={format} className="text-[10px] px-2 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200">{format}</span>)}
          <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">{SUPPORTED_REFERENCE_KINDS.length} kildetyper</span>
        </div>
      </div>
    </section>
  );
};

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="bg-white border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="text-xl font-bold text-slate-900 mt-1">{value}</div></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-2"><div className="text-[10px] text-slate-400">{label}</div><div className="text-xs font-medium text-slate-800 break-words mt-0.5">{value}</div></div>;
}
