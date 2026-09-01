import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Database, 
  ExternalLink, 
  Plus, 
  Check, 
  Clock, 
  BookOpen, 
  Filter, 
  AlertCircle, 
  Download, 
  RefreshCw,
  Sparkles,
  FileText,
  BookmarkPlus,
  Globe2,
  Lock,
  Unlock,
  Building,
  Quote,
  Layers,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { ArticleAppraisal } from '../types';
import { Apa7CitationService } from '../services/apa7CitationService';
import { 
  OpenResearchApiService, 
  OpenResearchRecord, 
  OPEN_DATABASES, 
  SearchDatabaseOption 
} from '../services/openResearchApiService';
import { useToast } from './Toast';

export interface SearchHistoryEntry {
  id: string;
  query: string;
  source: string;
  timestamp: string;
  resultsCount: number;
}

interface ResearchSearchProps {
  onImportArticle: (article: Partial<ArticleAppraisal>) => void;
  existingArticles: ArticleAppraisal[];
}

export const ResearchSearchView: React.FC<ResearchSearchProps> = ({
  onImportArticle,
  existingArticles
}) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState<string>('');
  const [selectedDb, setSelectedDb] = useState<string>('universal');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<OpenResearchRecord[]>([]);
  const [filterNorwegianOnly, setFilterNorwegianOnly] = useState<boolean>(false);
  const [filterOpenAccessOnly, setFilterOpenAccessOnly] = useState<boolean>(false);\n  const [verificationByDoi, setVerificationByDoi] = useState<Record<string, any>>({});\n  const [verifyingDoi, setVerifyingDoi] = useState<string | null>(null);
  
  const [history, setHistory] = useState<SearchHistoryEntry[]>(() => {
    const saved = localStorage.getItem('evidence_appraisal_search_history_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: 'hist-1',
        query: 'qualitative primary care interprofessional collaboration',
        source: 'Føderert Multi-Søk',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        resultsCount: 18
      },
      {
        id: 'hist-2',
        query: 'fastlege samhandling barnevern helsetjeneste',
        source: 'Norske Forskningsarkiv (NVA/Cristin)',
        timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
        resultsCount: 9
      },
      {
        id: 'hist-3',
        query: 'grounded theory clinical nursing methodology',
        source: 'OpenAlex (Global & Norsk)',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        resultsCount: 14
      }
    ];
  });

  const [importedIds, setImportedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    existingArticles.forEach(a => {
      if (a.doi) set.add(a.doi.toLowerCase().trim());
      if (a.title) set.add(a.title.toLowerCase().trim());
    });
    return set;
  });

  useEffect(() => {
    localStorage.setItem('evidence_appraisal_search_history_v2', JSON.stringify(history));
  }, [history]);

  const handleSearch = async (overrideQuery?: string, overrideDb?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    const db = overrideDb || selectedDb;

    if (!q) {
      showToast('Angi et søkeord, tittel, forfatter, tematikk eller DOI', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      let fetched: OpenResearchRecord[] = [];
      const dbConfig = OPEN_DATABASES.find(d => d.id === db) || OPEN_DATABASES[0];

      if (db === 'universal') {
        fetched = await OpenResearchApiService.searchUniversal(q);
      } else if (db === 'openalex') {
        fetched = await OpenResearchApiService.searchOpenAlex(q, false, 15);
      } else if (db === 'norwegian') {
        fetched = await OpenResearchApiService.searchOpenAlex(q, true, 15);
      } else if (db === 'europepmc') {
        fetched = await OpenResearchApiService.searchEuropePmc(q, 15);
      } else if (db === 'crossref') {
        fetched = await OpenResearchApiService.searchCrossref(q, 15);
      } else if (db === 'pubmed') {
        fetched = await OpenResearchApiService.searchPubMed(q, 15);
      } else if (db === 'semanticscholar') {
        fetched = await OpenResearchApiService.searchSemanticScholar(q, 15);
      } else if (db === 'doaj') {
        fetched = await OpenResearchApiService.searchDOAJ(q, 15);
      } else if (db === 'preprints') {
        fetched = await OpenResearchApiService.searchEuropePmc(`${q} AND (SRC:PPR OR HAS_BOOK:N)`, 15);
      }

      setResults(fetched);

      // Record in search history
      const histItem: SearchHistoryEntry = {
        id: `hist-${Date.now()}`,
        query: q,
        source: dbConfig.name,
        timestamp: new Date().toISOString(),
        resultsCount: fetched.length
      };
      setHistory(prev => [histItem, ...prev.filter(h => h.query !== q).slice(0, 19)]);

      if (fetched.length === 0) {
        showToast(`Ingen åpne artikler funnet i ${dbConfig.name} for "${q}"`, 'info');
      } else {
        showToast(`Fant ${fetched.length} treff i ${dbConfig.name}. Treffene er ikke automatisk klassifisert som fagfellevurderte.`, 'success');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      showToast(`Søkefeil: ${err.message || 'Kunne ikke kontakte databasen'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(rec => {
      if (filterNorwegianOnly && !rec.isNorwegianResearch && !rec.institutionAffiliation?.toLowerCase().includes('norway')) {
        return false;
      }
      if (filterOpenAccessOnly && !rec.isOpenAccess && !rec.openAccessPdfUrl) {
        return false;
      }
      return true;
    });
  }, [results, filterNorwegianOnly, filterOpenAccessOnly]);

  const handleVerifyDoi = async (doi: string) => {
    const cleanDoi = doi.trim();
    if (!cleanDoi) return;

    setVerifyingDoi(cleanDoi);
    try {
      const response = await fetch('/api/evidence/verify-doi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi: cleanDoi })
      });
      const data = await response.json();
      setVerificationByDoi(prev => ({
        ...prev,
        [cleanDoi.toLowerCase()]: data
      }));
      if (data.success) {
        showToast(
          data.verification?.isRetracted
            ? 'Kritisk varsel: Crossref har registrert en retraction-relasjon.'
            : 'DOI verifisert mot Crossref. Fagfellevurdering er ikke konkludert automatisk.',
          data.verification?.isRetracted ? 'warning' : 'success'
        );
      } else {
        showToast('Ingen verifiserbar Crossref-post funnet. Dette betyr ikke automatisk at publikasjonen er ugyldig.', 'info');
      }
    } catch (err: any) {
      showToast(`Kildeverifisering feilet: ${err.message || 'ukjent feil'}`, 'error');
    } finally {
      setVerifyingDoi(null);
    }
  };

  const handleImport = (rec: OpenResearchRecord) => {
    const formattedApa = Apa7CitationService.formatApa7({
      title: rec.title,
      authors: rec.authors,
      journal: rec.journal,
      year: rec.year,
      doi: rec.doi
    });

    onImportArticle({
      title: rec.title,
      authors: rec.authors,
      journal: rec.journal,
      publicationYear: parseInt(rec.year, 10) || new Date().getFullYear(),
      year: parseInt(rec.year, 10) || new Date().getFullYear(),
      doi: rec.doi || '',
      doiUrl: rec.doi ? `https://doi.org/${Apa7CitationService.cleanDoi(rec.doi)}` : '',
      shortCitation: formattedApa.shortCitation,
      apaReference: formattedApa.plainText,
      abstract: rec.abstract || '',
      methodology: 'Kvalitativ / Empirisk analyse (Klar for sjekkliste)',
      studyDesign: rec.studyTypeHint || 'Kvalitativ / Observasjonell',
      epistemology: 'Uavklart',
      overallVerdict: 'Vurder videre',
      instrumentId: 'jbi-qualitative-2017'
    });

    if (rec.doi) setImportedIds(prev => new Set(prev).add(rec.doi!.toLowerCase().trim()));
    setImportedIds(prev => new Set(prev).add(rec.title.toLowerCase().trim()));

    showToast(`"${rec.title.slice(0, 45)}..." er importert til hvelvet med full APA 7th referanse!`, 'success');
  };

  const isAlreadyImported = (rec: OpenResearchRecord) => {
    if (rec.doi && importedIds.has(rec.doi.toLowerCase().trim())) return true;
    if (importedIds.has(rec.title.toLowerCase().trim())) return true;
    return false;
  };

  return (
    <div id="research-search-workspace" className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div id="search-header" className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal-500/30">
            <Globe2 className="w-3.5 h-3.5" />
            Åpne Norske & Internasjonale Forskningsdatabaser
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
            Søk i Globale & Norske Åpne Forskningspublikasjoner
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Direktetilkobling til åpne vitenskapelige databaser (OpenAlex 250M+, Europe PMC, Crossref, PubMed, Semantic Scholar, DOAJ og Norske institusjonsarkiver via NVA/Cristin). Importer artikler direkte med fulltekst, DOI og APA 7th formatering inn i evalueringshvelvet.
          </p>
        </div>
      </div>

      {/* Database Selector Badges */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
          Velg Kildedatabase / Åpent Arkiv:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {OPEN_DATABASES.map(db => {
            const isSelected = selectedDb === db.id;
            return (
              <button
                key={db.id}
                type="button"
                onClick={() => {
                  setSelectedDb(db.id);
                  if (query.trim()) {
                    handleSearch(query, db.id);
                  }
                }}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-900/10 border-teal-600 shadow-xs ring-2 ring-teal-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-teal-950' : 'text-slate-900'}`}>
                    {db.name}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    db.isNorwegianFocused 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : isSelected 
                        ? 'bg-teal-700 text-white' 
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    {db.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                  {db.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk på tittel, emneord, forfatter, DOI (f.eks. 'grounded theory palliative care', 'fastlege samhandling', '10.1186/...')..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Søker i {OPEN_DATABASES.find(d => d.id === selectedDb)?.name || 'databaser'}...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Søk i Åpne Baser</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Hurtigsøk:
          </span>
          {[
            { label: 'Norsk allmennmedisin & samhandling', q: 'fastlege samhandling tverretatlig primærmedisin', db: 'norwegian' },
            { label: 'Grounded Theory Health Care', q: 'grounded theory general practice nursing', db: 'openalex' },
            { label: 'Kvalitativ palliasjon', q: 'qualitative palliative care lived experiences', db: 'europepmc' },
            { label: 'Systematiske oversikter', q: 'systematic review qualitative evidence synthesis', db: 'universal' },
            { label: 'Mixed Methods Research', q: 'mixed methods intervention health services', db: 'crossref' }
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(chip.q);
                setSelectedDb(chip.db);
                handleSearch(chip.q, chip.db);
              }}
              className="text-xs bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-900">
              <input
                type="checkbox"
                checked={filterNorwegianOnly}
                onChange={(e) => setFilterNorwegianOnly(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Vis kun norsk tilknytning / Norske institusjoner</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-900">
              <input
                type="checkbox"
                checked={filterOpenAccessOnly}
                onChange={(e) => setFilterOpenAccessOnly(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                Kun garantert Open Access / Fri PDF
              </span>
            </label>
          </div>
          <div>
            <span>Viser {filteredResults.length} {filteredResults.length === 1 ? 'artikkel' : 'artikler'}</span>
          </div>
        </div>
      </div>

      {/* Main Results Workspace */}
      <div className="space-y-4">
        {isLoading && (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
            <RefreshCw className="w-8 h-8 text-teal-700 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700 font-serif">
              Henter sanntids metadata fra {OPEN_DATABASES.find(d => d.id === selectedDb)?.name}...
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Verktøyet kontakter åpne vitenskapelige servere, indekserer forfattere, DOI-er, sammendrag og siteringsdata uten betalingsmurer.
            </p>
          </div>
        )}

        {!isLoading && filteredResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-700" />
                Søkeresultater ({filteredResults.length} treff)
              </h2>
              <span className="text-xs text-slate-500">
                Kilde: {OPEN_DATABASES.find(d => d.id === selectedDb)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredResults.map(rec => {
                const alreadyImported = isAlreadyImported(rec);
                return (
                  <div
                    key={rec.id}
                    className={`bg-white p-5 sm:p-6 rounded-2xl border transition-all space-y-3 ${
                      alreadyImported
                        ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {rec.source}
                          </span>
                          {rec.isNorwegianResearch && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                              <span>🇳🇴 Norsk tilknytning</span>
                            </span>
                          )}
                          {rec.isOpenAccess && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Unlock className="w-3 h-3 text-emerald-700" />
                              <span>Open Access</span>
                            </span>
                          )}
                          {rec.citationCount !== undefined && rec.citationCount > 0 && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Quote className="w-3 h-3 text-amber-700" />
                              <span>{rec.citationCount} siteringer</span>
                            </span>
                          )}
                          <span className="text-xs text-slate-500">
                            Publisert: <strong>{rec.year}</strong>
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-snug font-serif">
                          {rec.title}
                        </h3>

                        <p className="text-xs text-slate-700 font-medium">
                          {rec.authors}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span><strong>Tidsskrift:</strong> <em>{rec.journal}</em></span>
                          {rec.institutionAffiliation && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Building className="w-3 h-3 text-slate-400" />
                              {rec.institutionAffiliation}
                            </span>
                          )}
                          {rec.doi && (
                            <span><strong>DOI:</strong> {rec.doi}</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {alreadyImported ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300">
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>Allerede i Hvelv</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleImport(rec)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            <BookmarkPlus className="w-4 h-4" />
                            <span>Importer til Vurdering</span>
                          </button>
                        )}

                        <div className="flex items-center gap-2">
                          {rec.openAccessPdfUrl && (
                            <a
                              href={rec.openAccessPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Åpen PDF</span>
                            </a>
                          )}
                          {rec.doi && (
                            <button
                              type="button"
                              onClick={() => handleVerifyDoi(rec.doi!)}
                              disabled={verifyingDoi === rec.doi}
                              className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold disabled:opacity-50"
                              title="Kontroller DOI og registrerte retractions/corrections mot Crossref"
                            >
                              <FileCheck className="w-3 h-3" />
                              {verifyingDoi === rec.doi ? 'Kontrollerer...' : 'Verifiser DOI'}
                            </button>
                          )}
                          {rec.doiUrl && (
                            <a
                              href={rec.doiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700 underline"
                            >
                              <span>Kilde</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {rec.doi && verificationByDoi[rec.doi.toLowerCase()]?.success && (
                      <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 text-xs space-y-1.5">
                        <div className="font-bold text-teal-950">Ekstern kildekontroll</div>
                        <div className="text-slate-700">
                          Crossref: registrert DOI-post.
                          {verificationByDoi[rec.doi.toLowerCase()].verification?.isRetracted
                            ? ' Retraction-relasjon registrert — manuell kontroll kreves.'
                            : ' Ingen retraction-relasjon registrert i Crossref-data som ble returnert.'}
                        </div>
                        <div className="text-slate-500">
                          Fagfellevurdering: kan ikke konkluderes fra Crossref alene.
                        </div>
                      </div>
                    )}

                    {/* Abstract preview */}
                    {rec.abstract && (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800 block mb-1">Sammendrag / Abstract:</strong>
                        <p className="line-clamp-3 hover:line-clamp-none transition-all">
                          {rec.abstract}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && filteredResults.length === 0 && results.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Tidligere søkehistorikk ({history.length})
              </h3>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-400 hover:text-rose-600"
                >
                  Tøm historikk
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setQuery(item.query);
                    handleSearch(item.query);
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-teal-50/60 rounded-xl border border-slate-200 hover:border-teal-300 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                      {item.source}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleDateString('no-NO')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                    «{item.query}»
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {item.resultsCount} treff funnet
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
