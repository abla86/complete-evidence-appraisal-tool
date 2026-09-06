import React
import { createId } from '../utils/id';, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Database, ExternalLink, Plus, Check, Clock, BookOpen, Filter, AlertCircle,
  Download, RefreshCw, Sparkles, FileText, BookmarkPlus, Globe2, Lock, Unlock,
  Building, Quote, Layers, ArrowRight, FileCheck
} from 'lucide-react';
import { ArticleAppraisal } from '../types';
import { Apa7CitationService } from '../services/apa7CitationService';
import { OpenResearchApiService, OpenResearchRecord, OPEN_DATABASES, SearchDatabaseOption } from '../services/openResearchApiService';
import { useToast } from './Toast';

export interface SearchHistoryEntry { id: string; query: string; source: string; timestamp: string; resultsCount: number; }
interface ResearchSearchProps { onImportArticle: (article: Partial<ArticleAppraisal>) => void; existingArticles: ArticleAppraisal[]; }

export const ResearchSearchView: React.FC<ResearchSearchProps> = ({ onImportArticle, existingArticles }) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState<string>('');
  const [selectedDb, setSelectedDb] = useState<string>('universal');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<OpenResearchRecord[]>([]);
  const [filterNorwegianOnly, setFilterNorwegianOnly] = useState<boolean>(false);
  const [filterOpenAccessOnly, setFilterOpenAccessOnly] = useState<boolean>(false);
  const [verificationByDoi, setVerificationByDoi] = useState<Record<string, any>>({});
  const [verifyingDoi, setVerifyingDoi] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryEntry[]>(() => {
    const saved = localStorage.getItem('evidence_appraisal_search_history_v2');
    if (saved) { try { return JSON.parse(saved); } catch { return []; } }
    return [];
  });
  const [importedIds, setImportedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    existingArticles.forEach(a => { if (a.doi) set.add(a.doi.toLowerCase().trim()); if (a.title) set.add(a.title.toLowerCase().trim()); });
    return set;
  });

  useEffect(() => { localStorage.setItem('evidence_appraisal_search_history_v2', JSON.stringify(history)); }, [history]);

  const handleSearch = async (overrideQuery?: string, overrideDb?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    const db = overrideDb || selectedDb;
    if (!q) { showToast('Angi et sÃ¸keord, tittel, forfatter, tematikk eller DOI', 'warning'); return; }
    setIsLoading(true);
    try {
      let fetched: OpenResearchRecord[] = [];
      const dbConfig = OPEN_DATABASES.find(d => d.id === db) || OPEN_DATABASES[0];
      if (db === 'universal') fetched = await OpenResearchApiService.searchUniversal(q);
      else if (db === 'openalex') fetched = await OpenResearchApiService.searchOpenAlex(q, false, 15);
      else if (db === 'norwegian') fetched = await OpenResearchApiService.searchOpenAlex(q, true, 15);
      else if (db === 'europepmc') fetched = await OpenResearchApiService.searchEuropePmc(q, 15);
      else if (db === 'crossref') fetched = await OpenResearchApiService.searchCrossref(q, 15);
      else if (db === 'pubmed') fetched = await OpenResearchApiService.searchPubMed(q, 15);
      else if (db === 'semanticscholar') fetched = await OpenResearchApiService.searchSemanticScholar(q, 15);
      else if (db === 'doaj') fetched = await OpenResearchApiService.searchDOAJ(q, 15);
      else if (db === 'preprints') fetched = await OpenResearchApiService.searchEuropePmc(`${q} AND (SRC:PPR OR HAS_BOOK:N)`, 15);
      setResults(fetched);
      const histItem: SearchHistoryEntry = { id: createId('hist'), query: q, source: dbConfig.name, timestamp: new Date().toISOString(), resultsCount: fetched.length };
      setHistory(prev => [histItem, ...prev.filter(h => h.query !== q).slice(0, 19)]);
      showToast(fetched.length === 0 ? `Ingen Ã¥pne artikler funnet i ${dbConfig.name} for "${q}"` : `Fant ${fetched.length} treff i ${dbConfig.name}. Treffene er ikke automatisk klassifisert som fagfellevurderte.`, fetched.length === 0 ? 'info' : 'success');
    } catch (err: unknown) { console.error('Search error:', err); showToast(`SÃ¸kefeil: ${err.message || 'Kunne ikke kontakte databasen'}`, 'error'); }
    finally { setIsLoading(false); }
  };

  const filteredResults = useMemo(() => results.filter(rec => {
    if (filterNorwegianOnly && !rec.isNorwegianResearch && !rec.institutionAffiliation?.toLowerCase().includes('norway')) return false;
    if (filterOpenAccessOnly && !rec.isOpenAccess && !rec.openAccessPdfUrl) return false;
    return true;
  }), [results, filterNorwegianOnly, filterOpenAccessOnly]);

  const handleVerifyDoi = async (doi: string) => {
    const cleanDoi = doi.trim(); if (!cleanDoi) return;
    setVerifyingDoi(cleanDoi);
    try {
      const response = await fetch('/api/evidence/verify-doi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doi: cleanDoi }) });
      const data = await response.json();
      setVerificationByDoi(prev => ({ ...prev, [cleanDoi.toLowerCase()]: data }));
      showToast(data.success ? (data.verification?.isRetracted ? 'Kritisk varsel: Crossref har registrert en retraction-relasjon.' : 'DOI verifisert mot Crossref. Fagfellevurdering er ikke konkludert automatisk.') : 'Ingen verifiserbar Crossref-post funnet. Dette betyr ikke automatisk at publikasjonen er ugyldig.', data.success ? (data.verification?.isRetracted ? 'warning' : 'success') : 'info');
    } catch (err: unknown) { showToast(`Kildeverifisering feilet: ${err.message || 'ukjent feil'}`, 'error'); }
    finally { setVerifyingDoi(null); }
  };

  const handleImport = (rec: OpenResearchRecord) => {
    const formattedApa = Apa7CitationService.formatApa7({ title: rec.title, authors: rec.authors, journal: rec.journal, year: rec.year, doi: rec.doi });
    onImportArticle({ title: rec.title, authors: rec.authors, journal: rec.journal, publicationYear: Number.isInteger(Number.parseInt(rec.year, 10)) ? Number.parseInt(rec.year, 10) : undefined, year: Number.isInteger(Number.parseInt(rec.year, 10)) ? Number.parseInt(rec.year, 10) : undefined, doi: rec.doi || '', doiUrl: rec.doi ? `https://doi.org/${Apa7CitationService.cleanDoi(rec.doi)}` : undefined, shortCitation: formattedApa.shortCitation, apaReference: formattedApa.plainText, abstract: rec.abstract || undefined, methodology: undefined, studyDesign: rec.studyTypeHint || undefined, epistemology: undefined, overallVerdict: 'Vurder videre', instrumentId: undefined });
    if (rec.doi) setImportedIds(prev => new Set(prev).add(rec.doi!.toLowerCase().trim()));
    setImportedIds(prev => new Set(prev).add(rec.title.toLowerCase().trim()));
    showToast(`"${rec.title.slice(0, 45)}..." er importert til hvelvet med full APA 7th referanse!`, 'success');
  };

  const isAlreadyImported = (rec: OpenResearchRecord) => Boolean((rec.doi && importedIds.has(rec.doi.toLowerCase().trim())) || importedIds.has(rec.title.toLowerCase().trim()));

  return (
    <div id="research-search-workspace" className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div id="search-header" className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-3"><div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal-500/30"><Globe2 className="w-3.5 h-3.5" />Ã…pne Norske & Internasjonale Forskningsdatabaser</div><h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">SÃ¸k i Globale & Norske Ã…pne Forskningspublikasjoner</h1><p className="text-sm text-slate-300 leading-relaxed">Direkte sÃ¸k i Ã¥pne vitenskapelige databaser. Treff importeres som uverifiserte kilder og mÃ¥ vurderes videre.</p></div>
      </div>
      <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Velg Kildedatabase / Ã…pent Arkiv:</label><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">{OPEN_DATABASES.map(db => { const isSelected = selectedDb === db.id; return <button key={db.id} type="button" onClick={() => { setSelectedDb(db.id); if (query.trim()) handleSearch(query, db.id); }} className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${isSelected ? 'bg-teal-900/10 border-teal-600 shadow-xs ring-2 ring-teal-600/20' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'}`}><div className="flex items-center justify-between gap-2 mb-1"><span className={`text-xs font-bold ${isSelected ? 'text-teal-950' : 'text-slate-900'}`}>{db.name}</span><span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">{db.badge}</span></div><p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{db.description}</p></button>; })}</div></div>
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4"><form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" /><input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="SÃ¸k pÃ¥ tittel, emneord, forfatter eller DOI..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition-colors" /></div><button type="submit" disabled={isLoading} className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50">{isLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />SÃ¸ker...</> : <><Search className="w-4 h-4" />SÃ¸k</>}</button></form>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100"><span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" />HurtigsÃ¸k:</span>{['grounded theory palliative care','fastlege samhandling','10.1186/'].map(s => <button key={s} type="button" onClick={() => { setQuery(s); handleSearch(s); }} className="px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-700 hover:bg-slate-200">{s}</button>)}</div>
      </div>
      <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={filterNorwegianOnly} onChange={e => setFilterNorwegianOnly(e.target.checked)} />Norske treff</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={filterOpenAccessOnly} onChange={e => setFilterOpenAccessOnly(e.target.checked)} />Open access</label><span className="text-xs text-slate-500">{filteredResults.length} treff</span></div>
      {filteredResults.length > 0 && <div className="space-y-3">{filteredResults.map(rec => { const key = rec.doi?.toLowerCase() || rec.title.toLowerCase(); const verification = verificationByDoi[key]; const imported = isAlreadyImported(rec); return <article key={key} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex flex-col md:flex-row md:items-start justify-between gap-4"><div className="min-w-0"><h2 className="font-bold text-slate-900">{rec.title}</h2><p className="text-xs text-slate-600 mt-1">{rec.authors} Â· {rec.year} Â· {rec.journal}</p>{rec.abstract && <p className="text-sm text-slate-600 mt-3 line-clamp-4">{rec.abstract}</p>}</div><div className="flex flex-wrap gap-2 shrink-0"><button type="button" disabled={imported} onClick={() => handleImport(rec)} className="px-3 py-2 rounded-lg bg-teal-800 text-white text-xs font-semibold disabled:opacity-40">{imported ? 'Importert' : 'Importer'}</button>{rec.doi && <button type="button" disabled={verifyingDoi === rec.doi} onClick={() => handleVerifyDoi(rec.doi!)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">{verifyingDoi === rec.doi ? 'Verifiserer...' : 'Verifiser DOI'}</button>}</div></div>{verification && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{verification.verification?.isRetracted ? 'Retraction-relasjon funnet.' : verification.success ? 'Crossref-post verifisert.' : 'Ikke verifisert.'}</div>}</article>; })}</div>}
      {filteredResults.length === 0 && !isLoading && <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-500">Ingen sÃ¸keresultater.</div>}
    </div>
  );
};

export default ResearchSearchView;


