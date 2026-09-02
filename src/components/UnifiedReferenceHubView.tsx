import React, { useMemo, useRef, useState } from 'react';
import { BookOpen, Download, FileUp, Search, ShieldCheck, Tag } from 'lucide-react';
import type { ArticleAppraisal } from '../types';
import {
  createHubSnapshot,
  createReferenceRecord,
  markReferenceVerified,
  updateReferenceRecord,
  type ReferenceRecord,
} from '../services/referenceHubService.ts';
import { exportReferences, type ReferenceExportFormat } from '../services/referenceFormatService.ts';
import { importReferences, type ReferenceImportFormat } from '../services/referenceImportService.ts';

interface UnifiedReferenceHubViewProps {
  articles: ArticleAppraisal[];
  onUpdateArticles: (articles: ArticleAppraisal[]) => void;
}

function articleToReference(article: ArticleAppraisal): ReferenceRecord {
  return createReferenceRecord({
    id: article.id,
    kind: 'JOURNAL_ARTICLE',
    title: article.title || 'Uten tittel',
    authors: article.authors || 'Ukjent forfatter',
    year: article.year,
    journal: article.journal,
    volume: article.volumeIssue?.split('(')[0]?.trim(),
    issue: article.volumeIssue?.match(/\((.*?)\)/)?.[1],
    pages: article.pages,
    doi: article.doi,
    url: article.sourceUrl || undefined,
    tags: [],
    collections: [],
    attachments: [],
    annotations: [],
  });
}

function referenceToArticle(reference: ReferenceRecord, article: ArticleAppraisal): ArticleAppraisal {
  return {
    ...article,
    title: reference.title,
    authors: reference.authors,
    year: reference.year || article.year,
    journal: reference.journal || article.journal,
    volumeIssue: reference.volume ? `${reference.volume}${reference.issue ? `(${reference.issue})` : ''}` : article.volumeIssue,
    pages: reference.pages || article.pages,
    doi: reference.doi || article.doi,
    doiUrl: reference.doi ? `https://doi.org/${reference.doi}` : article.doiUrl,
    sourceUrl: reference.url || article.sourceUrl,
  };
}

function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export const UnifiedReferenceHubView: React.FC<UnifiedReferenceHubViewProps> = ({ articles, onUpdateArticles }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'review'>('all');
  const [selectedId, setSelectedId] = useState('');
  const [importFormat, setImportFormat] = useState<ReferenceImportFormat>('RIS');
  const [exportFormat, setExportFormat] = useState<ReferenceExportFormat>('RIS');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const records = useMemo(() => articles.map(articleToReference), [articles]);
  const snapshot = useMemo(() => createHubSnapshot(records), [records]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('nb-NO');
    return records.filter(record => {
      const haystack = [
        record.title,
        record.authors,
        record.journal,
        record.doi,
        record.pmid,
      ].filter(Boolean).join(' ').toLocaleLowerCase('nb-NO');
      const matchesQuery = !q || haystack.includes(q);
      const matchesFilter = filter === 'all'
        || (filter === 'verified' && record.verification === 'VALIDATED')
        || (filter === 'review' && record.verification === 'VALIDATION_REQUIRED');
      return matchesQuery && matchesFilter;
    });
  }, [records, query, filter]);

  const selected = records.find(record => record.id === selectedId) || filtered[0];

  const updateReference = (record: ReferenceRecord): void => {
    const source = articles.find(article => article.id === record.id);
    if (!source) return;
    onUpdateArticles(articles.map(article => article.id === record.id ? referenceToArticle(record, article) : article));
  };

  const handleVerify = (): void => {
    if (!selected) return;
    updateReference(markReferenceVerified(selected, 'Forsker'));
    setMessage('Referansen er eksplisitt merket som verifisert.');
  };

  const handleTag = (): void => {
    if (!selected) return;
    const tag = window.prompt('Ny tag');
    if (!tag?.trim()) return;
    updateReference(updateReferenceRecord(selected, { tags: [...new Set([...selected.tags, tag.trim()])] }));
  };

  const handleImport = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = importReferences(String(reader.result || ''), importFormat);
      if (result.errors.length) {
        setMessage(result.errors.join(' '));
        return;
      }
      const newArticles = result.references.map((record, index) => ({
        id: record.id || `ref-import-${Date.now()}-${index}`,
        instrumentId: 'jbi-qualitative-2017',
        instrumentVersion: '2017',
        lifecycleStatus: 'DRAFT',
        title: record.title || 'Importert referanse',
        authors: record.authors || 'Ukjent forfatter',
        shortCitation: `${record.authors?.[0] || 'Ukjent'} (${record.year || 'u.å.'})`,
        year: record.year || new Date().getFullYear(),
        doi: record.doi || '',
        doiUrl: record.doi ? `https://doi.org/${record.doi}` : '',
        sourceUrl: record.url || '',
        sourceName: `Reference Hub (${importFormat})`,
        journal: record.journal || '',
        studyContext: 'Importert referanse',
        design: 'Ikke vurdert',
        dataCollection: 'Ikke vurdert',
        participants: 'Ikke vurdert',
        analyticMethod: 'Ikke vurdert',
        summaryScore: { ja: 0, uklart: 10, nei: 0, total: 10 },
        overallVerdict: 'Vurder videre',
        verdictNote: 'Importert via samlet Reference Hub',
        keyStrength: 'Metadata importert',
        mainLimitation: 'Metodisk vurdering ikke gjennomført',
        apaReference: '',
        items: [],
        auditTrail: [],
      } as ArticleAppraisal));
      onUpdateArticles([...newArticles, ...articles]);
      setMessage(`${newArticles.length} referanse(r) importert. Duplikater er markert for manuell vurdering.`);
    };
    reader.readAsText(file);
  };

  const handleExport = (): void => {
    const content = exportReferences(records, exportFormat);
    const extension = exportFormat === 'ENDNOTE_XML'
      ? 'xml'
      : exportFormat === 'CSL_JSON' || exportFormat === 'JSON'
        ? 'json'
        : exportFormat.toLowerCase();
    const mime = exportFormat === 'CSV'
      ? 'text/csv'
      : exportFormat === 'RIS' || exportFormat === 'BIBTEX'
        ? 'text/plain'
        : 'application/json';
    downloadText(content, `evidence-reference-library.${extension}`, mime);
  };

  return (
    <div className="space-y-6 pb-16">
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-700" />
              <h2 className="text-xl font-bold font-serif">Reference Hub</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 border border-teal-200 text-teal-900">Én referansemotor</span>
            </div>
            <p className="text-sm text-slate-600 mt-1">EndNote, Zotero, Mendeley og Paperpile samles her som interoperabilitet, ikke som parallelle databaser.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-slate-500">Referanser</div><div className="font-bold text-lg">{records.length}</div></div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-slate-500">Duplikatforslag</div><div className="font-bold text-lg">{snapshot.duplicateCandidates.length}</div></div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-slate-500">Verifisert</div><div className="font-bold text-lg">{records.filter(r => r.verification === 'VALIDATED').length}</div></div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-slate-500">Til kontroll</div><div className="font-bold text-lg">{records.filter(r => r.verification === 'VALIDATION_REQUIRED').length}</div></div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Søk tittel, forfatter, DOI, journal..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm" />
            </div>
            <button type="button" onClick={() => setFilter('all')} className={`px-3 py-2 rounded-xl text-xs font-semibold ${filter === 'all' ? 'bg-teal-800 text-white' : 'bg-slate-100'}`}>Alle</button>
            <button type="button" onClick={() => setFilter('review')} className={`px-3 py-2 rounded-xl text-xs font-semibold ${filter === 'review' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}>Til kontroll</button>
            <button type="button" onClick={() => setFilter('verified')} className={`px-3 py-2 rounded-xl text-xs font-semibold ${filter === 'verified' ? 'bg-emerald-700 text-white' : 'bg-slate-100'}`}>Verifisert</button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <input ref={fileRef} type="file" hidden accept=".ris,.bib,.bibtex,.json,.xml,.txt,.csv" onChange={e => { const file = e.target.files?.[0]; if (file) handleImport(file); e.currentTarget.value = ''; }} />
            <select value={importFormat} onChange={e => setImportFormat(e.target.value as ReferenceImportFormat)} className="text-xs border border-slate-300 rounded-lg px-2 py-2">
              <option value="RIS">RIS</option><option value="BIBTEX">BibTeX</option><option value="CSL_JSON">CSL JSON</option><option value="JSON">JSON</option>
            </select>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold"><FileUp className="w-4 h-4" />Importer</button>
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value as ReferenceExportFormat)} className="text-xs border border-slate-300 rounded-lg px-2 py-2">
              <option value="RIS">RIS</option><option value="BIBTEX">BibTeX</option><option value="CSL_JSON">CSL JSON</option><option value="ENDNOTE_XML">EndNote XML</option><option value="CSV">CSV</option><option value="JSON">JSON</option>
            </select>
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-800 text-white text-xs font-semibold"><Download className="w-4 h-4" />Eksporter</button>
          </div>

          {message && <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sm text-sky-900">{message}</div>}

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {filtered.length === 0 && <div className="p-8 text-center text-sm text-slate-500">Ingen referanser matcher søket.</div>}
            {filtered.map(record => (
              <button type="button" key={record.id} onClick={() => setSelectedId(record.id)} className={`w-full text-left p-4 hover:bg-slate-50 ${selected?.id === record.id ? 'bg-teal-50/50' : 'bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{record.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{record.authors} {record.year ? `(${record.year})` : ''} {record.journal ? `· ${record.journal}` : ''}</div>
                    <div className="flex flex-wrap gap-1 mt-2">{record.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">#{tag}</span>)}</div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${record.verification === 'VALIDATED' ? 'bg-emerald-100 text-emerald-900' : record.verification === 'INVALID' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-900'}`}>{record.verification}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-[11px] uppercase tracking-wide text-slate-500">Referanse</div><h3 className="font-bold text-lg font-serif">{selected.title}</h3></div>
                <ShieldCheck className="w-5 h-5 text-teal-700" />
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">Forfattere:</span> {selected.authors}</div>
                <div><span className="font-semibold">DOI:</span> {selected.doi || '—'}</div>
                <div><span className="font-semibold">Status:</span> {selected.verification}</div>
                <div><span className="font-semibold">Kilde:</span> {selected.importedFrom.join(', ')}</div>
                {selected.url && <a className="text-teal-800 underline" href={selected.url} target="_blank" rel="noreferrer">Åpne kilde</a>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleVerify} className="px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold inline-flex gap-1.5 items-center"><ShieldCheck className="w-4 h-4" />Merk som verifisert</button>
                <button type="button" onClick={handleTag} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold inline-flex gap-1.5 items-center"><Tag className="w-4 h-4" />Tag</button>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="font-semibold text-sm mb-2">Duplikatforslag</div>
                {snapshot.duplicateCandidates.filter(d => d.recordId === selected.id || d.candidateId === selected.id).length === 0
                  ? <div className="text-xs text-slate-500">Ingen duplikatforslag for denne referansen.</div>
                  : snapshot.duplicateCandidates.filter(d => d.recordId === selected.id || d.candidateId === selected.id).map(d => (
                    <div key={`${d.recordId}-${d.candidateId}`} className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">Mulig duplikat ({d.reason}) · {Math.round(d.confidence * 100)}%. Vurder manuelt.</div>
                  ))}
              </div>
              <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">Ingen referanse slettes automatisk ved duplikatfunn.</div>
            </div>
          ) : (
            <div className="h-full min-h-64 flex items-center justify-center text-sm text-slate-500">Biblioteket er tomt.</div>
          )}
        </section>
      </div>
    </div>
  );
};
