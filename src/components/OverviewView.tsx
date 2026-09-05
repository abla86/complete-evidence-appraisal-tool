import React, { useState, useMemo } from 'react';
import { ArticleAppraisal } from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';
import { JbiQualitativeValidationService } from '../services/jbiValidationService';
import { 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  AlertTriangle, 
  Info, 
  FileText, 
  ExternalLink,
  ChevronDown,
  Layers,
  Copy,
  Search,
  PlusCircle,
  Filter,
  X,
  BookOpen,
  CheckSquare,
  ArrowUpDown,
  Calendar,
  User,
  SlidersHorizontal,
  RotateCcw,
  GraduationCap,
  ShieldCheck,
  BrainCircuit,
  LayoutGrid,
  List,
  Sparkles,
  ArrowDownUp,
  Tag
} from 'lucide-react';
import { useToast } from './Toast';

export type SortOption = 
  | 'year-desc' 
  | 'year-asc' 
  | 'jbi-desc' 
  | 'jbi-asc' 
  | 'author-asc' 
  | 'author-desc' 
  | 'title-asc'
  | 'title-desc';

interface OverviewViewProps {
  articles: ArticleAppraisal[];
  onSelectArticle: (id: string) => void;
  onEditArticle?: (article: ArticleAppraisal) => void;
  onGoToThesis: () => void;
  onGoToMethodology?: () => void;
  onOpenCustomEvaluator?: () => void;
  onOpenImportExport?: (tab?: 'import' | 'export') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  articles,
  onSelectArticle,
  onEditArticle,
  onGoToThesis,
  onGoToMethodology,
  onOpenCustomEvaluator,
  onOpenImportExport
}) => {
  const { showToast } = useToast();
  
  // Search, Filter & Sort states
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [selectedMethodologyFilter, setSelectedMethodologyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('year-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [helpOpen, setHelpOpen] = useState(false);

  // Filter and sort articles dynamically
  const processedArticles = useMemo(() => {
    // 1. Filtering
    const filtered = articles.filter(article => {
      const q = articleSearchQuery.trim().toLowerCase();
      const matchesSearch = !q || (
        article.title.toLowerCase().includes(q) ||
        article.authors.toLowerCase().includes(q) ||
        article.shortCitation.toLowerCase().includes(q) ||
        article.design.toLowerCase().includes(q) ||
        article.analyticMethod.toLowerCase().includes(q) ||
        article.dataCollection.toLowerCase().includes(q) ||
        article.studyContext.toLowerCase().includes(q) ||
        article.journal.toLowerCase().includes(q) ||
        (article.year && article.year.toString().includes(q))
      );

      const matchesMethodology = 
        selectedMethodologyFilter === 'all' ||
        (selectedMethodologyFilter === 'grounded-theory' && article.design.toLowerCase().includes('grounded')) ||
        (selectedMethodologyFilter === 'framework' && (article.design.toLowerCase().includes('framework') || article.analyticMethod.toLowerCase().includes('framework'))) ||
        (selectedMethodologyFilter === 'phenomenology' && (article.design.toLowerCase().includes('fenomenolog') || article.analyticMethod.toLowerCase().includes('fenomenolog'))) ||
        (selectedMethodologyFilter === 'thematic' && article.analyticMethod.toLowerCase().includes('tematisk')) ||
        (selectedMethodologyFilter === 'included' && article.overallVerdict === 'Inkluder');

      return matchesSearch && matchesMethodology;
    });

    // 2. Sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'year-desc':
          return (b.year || 0) - (a.year || 0);
        case 'year-asc':
          return (a.year || 0) - (b.year || 0);
        case 'jbi-desc': {
          const scoreB = b.summaryScore?.ja ?? JbiQualitativeValidationService.computeScore(b.items || [], 10).ja;
          const scoreA = a.summaryScore?.ja ?? JbiQualitativeValidationService.computeScore(a.items || [], 10).ja;
          return scoreB - scoreA;
        }
        case 'jbi-asc': {
          const scoreB = b.summaryScore?.ja ?? JbiQualitativeValidationService.computeScore(b.items || [], 10).ja;
          const scoreA = a.summaryScore?.ja ?? JbiQualitativeValidationService.computeScore(a.items || [], 10).ja;
          return scoreA - scoreB;
        }
        case 'author-asc':
          return a.authors.localeCompare(b.authors, 'no', { sensitivity: 'base' });
        case 'author-desc':
          return b.authors.localeCompare(a.authors, 'no', { sensitivity: 'base' });
        case 'title-asc':
          return a.title.localeCompare(b.title, 'no', { sensitivity: 'base' });
        case 'title-desc':
          return b.title.localeCompare(a.title, 'no', { sensitivity: 'base' });
        default:
          return 0;
      }
    });
  }, [articles, articleSearchQuery, selectedMethodologyFilter, sortBy]);

  const resetFilters = () => {
    setArticleSearchQuery('');
    setSelectedMethodologyFilter('all');
    setSortBy('year-desc');
    showToast('Filtre og sortering er nullstilt');
  };

  const isFiltersActive = articleSearchQuery.trim() !== '' || selectedMethodologyFilter !== 'all' || sortBy !== 'year-desc';

  const totalIncluded = articles.filter(a => a.overallVerdict === 'Inkluder').length;
  const avgScore = articles.length > 0
    ? (articles.reduce((acc, a) => acc + (a.summaryScore?.ja || 0), 0) / articles.length).toFixed(1)
    : '0';

  const sortLabelMap: Record<SortOption, string> = {
    'year-desc': 'Dato (Nyeste først)',
    'year-asc': 'Dato (Eldste først)',
    'jbi-desc': 'JBI-vurdering (mest positiv → minst positiv)',
    'jbi-asc': 'JBI-vurdering (minst positiv → mest positiv)',
    'author-asc': 'Forfatter (A → Å)',
    'author-desc': 'Forfatter (Å → A)',
    'title-asc': 'Tittel (A → Å)',
    'title-desc': 'Tittel (Å → A)'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Clean Academic Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Joanna Briggs Institute (JBI Qualitative 2017/2024 Update)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight">
              Artikkelbibliotek & Kritisk Vurdering
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Strukturert vurderingsverktøy for kritisk lesing, metodisk validitet, søk, sortering og syntese av kvalitative forskningsartikler.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Totalt</span>
              <span className="text-xl font-bold text-slate-900 font-serif">{articles.length}</span>
              <span className="text-[10px] text-slate-500 block">artikler</span>
            </div>
            <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Inkludert</span>
              <span className="text-xl font-bold text-emerald-900 font-serif">{totalIncluded}</span>
              <span className="text-[10px] text-emerald-700 block">i kunnskapsbase</span>
            </div>
            <div className="bg-teal-50/80 border border-teal-200 p-3.5 rounded-xl text-center">
              <span className="text-[10px] font-bold uppercase text-teal-900 block">Snittscore</span>
              <span className="text-xl font-bold text-teal-950 font-serif">{avgScore}</span>
              <span className="text-[10px] text-teal-700 block">av 10 Ja</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SORT CONTROLS TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Main Search & Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Enhanced Search Field with clear & shortcut */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="article-search-input"
              aria-label="Søk i artikler"
              placeholder="Søk etter forfatter, tittel, metode, design, kontekst..."
              value={articleSearchQuery}
              onChange={(e) => setArticleSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-700 text-slate-800 transition-colors shadow-2xs font-medium placeholder:text-slate-400"
            />
            {articleSearchQuery && (
              <button
                type="button"
                id="btn-clear-search"
                onClick={() => setArticleSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Tøm søk"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Methodology Filter Dropdown */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                id="select-methodology-filter"
                aria-label="Filtrer etter metode"
                value={selectedMethodologyFilter}
                onChange={(e) => setSelectedMethodologyFilter(e.target.value)}
                className="w-full text-xs bg-slate-50 hover:bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-8 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer shadow-2xs appearance-none transition-colors"
              >
                <option value="all">Alle metodologier ({articles.length})</option>
                <option value="grounded-theory">Grounded Theory</option>
                <option value="framework">Framework Analysis</option>
                <option value="phenomenology">Fenomenologi</option>
                <option value="thematic">Tematisk Analyse</option>
                <option value="included">Kun Inkluderte (JBI)</option>
              </select>
              <Filter className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Sortering Dropdown (Dato, Forfatternavn, JBI-score, Tittel) */}
          <div className="md:col-span-4">
            <div className="relative">
              <select
                id="select-sort-articles"
                aria-label="Sorter artikler etter dato, forfatter eller JBI-score"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full text-xs bg-slate-50 hover:bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-8 text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-teal-700 cursor-pointer shadow-2xs appearance-none transition-colors"
              >
                <optgroup label="Dato / Publisering">
                  <option value="year-desc">Dato: Nyeste først (2026 → 2000)</option>
                  <option value="year-asc">Dato: Eldste først (2000 → 2026)</option>
                </optgroup>
                <optgroup label="JBI Kvalitetsscore">
                  <option value="jbi-desc">JBI-score: Høyest score (10 → 0 Ja)</option>
                  <option value="jbi-asc">JBI-score: Lavest score (0 → 10 Ja)</option>
                </optgroup>
                <optgroup label="Forfatter & Tittel">
                  <option value="author-asc">Forfatternavn: A – Å</option>
                  <option value="author-desc">Forfatternavn: Å – A</option>
                  <option value="title-asc">Artikkeltittel: A – Å</option>
                  <option value="title-desc">Artikkeltittel: Å – A</option>
                </optgroup>
              </select>
              <ArrowDownUp className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none" />
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Filter Pills, Active Info Bar & View Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1">Hurtigfilter:</span>
            
            <button
              type="button"
              id="filter-btn-all"
              onClick={() => setSelectedMethodologyFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                selectedMethodologyFilter === 'all'
                  ? 'bg-teal-900 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alle ({articles.length})
            </button>

            <button
              type="button"
              id="filter-btn-grounded"
              onClick={() => setSelectedMethodologyFilter('grounded-theory')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                selectedMethodologyFilter === 'grounded-theory'
                  ? 'bg-teal-900 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Grounded Theory
            </button>

            <button
              type="button"
              id="filter-btn-framework"
              onClick={() => setSelectedMethodologyFilter('framework')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                selectedMethodologyFilter === 'framework'
                  ? 'bg-teal-900 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Framework Analysis
            </button>

            <button
              type="button"
              id="filter-btn-included"
              onClick={() => setSelectedMethodologyFilter('included')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-medium ${
                selectedMethodologyFilter === 'included'
                  ? 'bg-emerald-800 text-white font-bold shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Inkluderte studier ({totalIncluded})
            </button>

            {isFiltersActive && (
              <button
                type="button"
                id="filter-btn-reset"
                onClick={resetFilters}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 ml-2 px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Nullstill</span>
              </button>
            )}
          </div>

          {/* Right Controls: Result Count, View Mode & Add Study */}
          <div className="flex items-center gap-3">
            {/* View Mode Switcher (Grid / List Table) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-teal-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Kortvisning (Grid)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-teal-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Kompakt tabellvisning"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Match Counter Badge */}
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Viser <strong className="text-slate-900">{processedArticles.length}</strong> av {articles.length}
            </span>

            {onOpenImportExport && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-import-files-overview"
                  onClick={() => onOpenImportExport('import')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors shadow-2xs"
                  title="Importer RIS, BibTeX, Excel, PDF eller Word filer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
                  <span>Importer filer</span>
                </button>

                <button
                  type="button"
                  id="btn-export-files-overview"
                  onClick={() => onOpenImportExport('export')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
                  title="Eksporter til Excel, Word, RIS, PDF, BibTeX, JSON"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Eksporter</span>
                </button>
              </div>
            )}

            {onOpenCustomEvaluator && (
              <button
                type="button"
                id="btn-add-study"
                onClick={onOpenCustomEvaluator}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-teal-200" />
                <span>Ny studie</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Active Sort & Search Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <ArrowUpDown className="w-3 h-3 text-teal-700" />
              Aktiv sortering: <strong className="text-slate-900">{sortLabelMap[sortBy]}</strong>
            </span>
            {articleSearchQuery && (
              <span className="flex items-center gap-1 text-slate-600 before:content-['•'] before:text-slate-300 before:mr-1">
                Søkeord: <span className="px-1.5 py-0.2 bg-teal-100/80 text-teal-900 font-bold rounded">«{articleSearchQuery}»</span>
              </span>
            )}
            {selectedMethodologyFilter !== 'all' && (
              <span className="flex items-center gap-1 text-slate-600 before:content-['•'] before:text-slate-300 before:mr-1">
                Metodefilter: <span className="font-semibold text-slate-800">{selectedMethodologyFilter}</span>
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
            JBI Qualitative 2017 Standard
          </span>
        </div>
      </div>

      {/* ARTICLE CARDS / TABLE DISPLAY */}
      {articles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
              Ditt prosjektbibliotek er tomt
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Du har ingen aktive artikler under vurdering ennå. Opprett en ny kritisk vurdering, importer artikler fra fil (RIS, BibTeX, PDF, Excel), eller søk i åpne databaser. Ferdige eksempler og metodiske referanser finnes tilgjengelig i <strong>Eksempel-biblioteket</strong>.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {onOpenCustomEvaluator && (
              <button
                type="button"
                id="btn-empty-add-study"
                onClick={onOpenCustomEvaluator}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors shadow-2xs"
              >
                <PlusCircle className="w-4 h-4 text-teal-200" />
                <span>Ny kritisk vurdering</span>
              </button>
            )}

            {onOpenImportExport && (
              <button
                type="button"
                id="btn-empty-import-files"
                onClick={() => onOpenImportExport('import')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors shadow-2xs"
              >
                <PlusCircle className="w-4 h-4 text-teal-700" />
                <span>Importer fra filer (RIS, BibTeX, PDF)</span>
              </button>
            )}
          </div>
        </div>
      ) : processedArticles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-slate-800">
            Ingen artikler matchet søket {articleSearchQuery ? `«${articleSearchQuery}»` : 'og de valgte filtrene'}.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Prøv å endre søkeordet, velg «Alle metodologier», eller nullstill sorteringen for å se hele biblioteket.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nullstill alle filtre og sortering</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedArticles.map((article) => {
            const isCustom = article.id.startsWith('jbi-custom-') || article.id.startsWith('custom-');
            return (
              <div 
                key={article.id}
                id={`article-card-${article.id}`}
                onClick={() => onSelectArticle(article.id)}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-teal-600 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 truncate max-w-[180px]">
                        {article.design}
                      </span>
                      {article.isDemoData && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                          Demo-eksempel
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{article.summaryScore.ja}/10 Ja</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors font-serif leading-snug">
                      {article.shortCitation}
                    </h3>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                      {article.year}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {article.title}
                  </p>

                  {/* Methodological Details List */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Forfattere:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">{article.authors}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Analyse:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">{article.analyticMethod}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Datainnsamling:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">{article.dataCollection}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-400">Utvalg:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">{article.participants}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2 pt-1 border-t border-slate-100/70">
                      <span className="text-slate-400">Tidsskrift ({article.year}):</span>
                      <span className="font-medium text-slate-700 text-right truncate max-w-[180px]">{article.journal}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md text-[11px] tracking-wide border border-emerald-200">
                    {article.overallVerdict}
                  </span>
                  <span className="flex items-center text-teal-800 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                    Se vurdering & evidens <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / COMPACT VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Studie / Sitering</th>
                  <th className="py-3.5 px-4">År</th>
                  <th className="py-3.5 px-4">Design & Metode</th>
                  <th className="py-3.5 px-4">Utvalg / Kontekst</th>
                  <th className="py-3.5 px-4 text-center">JBI-vurdering</th>
                  <th className="py-3.5 px-4 text-center">Beslutning</th>
                  <th className="py-3.5 px-4 text-right">Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedArticles.map((article) => (
                  <tr
                    key={article.id}
                    onClick={() => onSelectArticle(article.id)}
                    className="hover:bg-teal-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="font-bold text-slate-900 group-hover:text-teal-900 font-serif text-xs">
                          {article.shortCitation}
                        </div>
                        {article.isDemoData && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={article.title}>
                        {article.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {article.year}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{article.design}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{article.analyticMethod}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 truncate max-w-[180px]">{article.participants}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{article.studyContext}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{article.summaryScore.ja}/10</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                        {article.overallVerdict}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectArticle(article.id);
                        }}
                        className="text-xs font-semibold text-teal-800 hover:text-teal-950 inline-flex items-center gap-1 group-hover:underline"
                      >
                        <span>Åpne</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JBI 10 Criteria Reference Guide Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs text-slate-600">
        <h4 className="font-bold text-slate-900 font-serif text-sm mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>JBI Critical Appraisal Checklist for Qualitative Research (10 Kriterier)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">1–5: Samsvar</span>
            <p className="text-[11px] text-slate-500">Filosofisk perspektiv, metodologi, problemstilling, datainnsamling og analyse.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">6–7: Forskerrolle</span>
            <p className="text-[11px] text-slate-500">Kulturell/teoretisk posisjonering og forskerens refleksivitet/påvirkning.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">8: Representasjon</span>
            <p className="text-[11px] text-slate-500">Deltakernes egne stemmer representert med direkte sitater.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">9: Etikk</span>
            <p className="text-[11px] text-slate-500">Etisk godkjenning (NSD/REK/IRB) og informert samtykke.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">10: Konklusjon</span>
            <p className="text-[11px] text-slate-500">Logisk sammenheng mellom analysedata og konklusjoner.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

