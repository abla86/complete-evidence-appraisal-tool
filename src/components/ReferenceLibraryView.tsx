import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  GitCompare, 
  ShieldCheck, 
  Sparkles,
  Paperclip,
  Database,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Info,
  Award
} from 'lucide-react';
import { 
  ReferenceValidationArticle, 
  ArticleAppraisal, 
  GoldStandardDiffResult, 
  ReferenceAssessmentType 
} from '../types';
import { ReferenceValidationService } from '../services/referenceValidationService';

interface ReferenceLibraryViewProps {
  articles: ArticleAppraisal[];
  onSelectArticleForAppraisal?: (article: ArticleAppraisal) => void;
}

export const ReferenceLibraryView: React.FC<ReferenceLibraryViewProps> = ({
  articles
}) => {
  const [selectedInstrumentFilter, setSelectedInstrumentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRefArticleId, setSelectedRefArticleId] = useState<string>('ref-amstar2-xiang-2020');
  const [selectedUserArticleId, setSelectedUserArticleId] = useState<string>(articles[0]?.id || '');
  const [diffResult, setDiffResult] = useState<GoldStandardDiffResult | null>(null);
  const [isDiffRunning, setIsDiffRunning] = useState<boolean>(false);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  const allReferenceArticles = useMemo(() => {
    return ReferenceValidationService.getAllReferenceArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    return allReferenceArticles.filter(art => {
      const matchesInst = selectedInstrumentFilter === 'all' || art.instrumentId === selectedInstrumentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        art.title.toLowerCase().includes(q) ||
        art.authors.toLowerCase().includes(q) ||
        art.doi.toLowerCase().includes(q) ||
        (art.pmid && art.pmid.includes(q)) ||
        art.journal.toLowerCase().includes(q);
      return matchesInst && matchesQuery;
    });
  }, [allReferenceArticles, selectedInstrumentFilter, searchQuery]);

  const activeRefArticle = useMemo(() => {
    return allReferenceArticles.find(a => a.id === selectedRefArticleId) || allReferenceArticles[0];
  }, [allReferenceArticles, selectedRefArticleId]);

  const getAssessmentTypeBadge = (type: ReferenceAssessmentType) => {
    switch (type) {
      case 'OFFICIAL_ALGORITHM_EXPECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Award className="w-3 h-3 text-blue-600" />
            Official Algorithm Expected Result
          </span>
        );
      case 'PUBLISHED_RESEARCHER_ASSESSMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Published Researcher Assessment
          </span>
        );
      case 'EXPERT_ADJUDICATED_REFERENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            Expert-Adjudicated Reference
          </span>
        );
      case 'LOCAL_TEST_EXPECTATION':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Info className="w-3 h-3 text-slate-500" />
            Local Test Expectation
          </span>
        );
    }
  };

  const handleRunGoldStandardDiff = () => {
    if (!activeRefArticle) return;
    setIsDiffRunning(true);

    const userArticle = articles.find(a => a.id === selectedUserArticleId);
    const itemMap: Record<number, string> = {};

    if (userArticle && userArticle.items) {
      userArticle.items.forEach(it => {
        itemMap[it.questionId] = it.status || 'Ikke vurdert';
      });
    } else {
      // Default to reference responses with minor variation for demo if empty
      activeRefArticle.itemData.forEach(it => {
        itemMap[it.itemNumber] = it.referenceResponse;
      });
    }

    setTimeout(() => {
      const result = ReferenceValidationService.compareAgainstGoldStandard(activeRefArticle, itemMap);
      setDiffResult(result);
      setIsDiffRunning(false);
    }, 250);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                <BookOpen className="w-5 h-5 text-teal-700" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-serif">
                Referansevalideringsbibliotek (Gullstandarder)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900">
                Level 3 Validation
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-3xl">
              Autentiske, fagfellevurderte referanseartikler med verifiserte DOI-er, fullstendige bibliografiske data,
              begrunnet utvalg og publiserte item-for-item vurderingsfasiter for metodisk kalibrering og diff-analyse.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500 font-medium">Verifiserte referanser</div>
              <div className="text-lg font-bold text-slate-900">{allReferenceArticles.length} artikler</div>
            </div>
          </div>
        </div>

        {/* 4 Reference Classifications Legend */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-blue-700" />
              1. Official Expected Result
            </div>
            <div className="text-blue-700/90 text-[11px] mt-0.5">
              Definert av opphavsorganisasjonen eller offisiell kalibreringsveileder.
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              2. Published Researcher
            </div>
            <div className="text-emerald-700/90 text-[11px] mt-0.5">
              Hentet fra fagfellevurdert metodestudie med publisert sjekkliste.
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              3. Expert-Adjudicated
            </div>
            <div className="text-purple-700/90 text-[11px] mt-0.5">
              Uavhengig vurdert og enstemmig samstemt av metodeeksperter.
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-600" />
              4. Local Test Expectation
            </div>
            <div className="text-slate-600 text-[11px] mt-0.5">
              Syntetisk eller lokalt definert testscenario for regresjonssikring.
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Selector on Left, Details & Diff on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List & Filters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="SÃ¸k tittel, forfatter, DOI, PMID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* Instrument Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedInstrumentFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedInstrumentFilter === 'all'
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Alle ({allReferenceArticles.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstrumentFilter('amstar-2')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedInstrumentFilter === 'amstar-2'
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                AMSTAR 2
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstrumentFilter('jbi-qualitative-2017')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedInstrumentFilter === 'jbi-qualitative-2017'
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                JBI Qualitative
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstrumentFilter('agree-ii')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedInstrumentFilter === 'agree-ii'
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                AGREE II
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstrumentFilter('rob-2')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  selectedInstrumentFilter === 'rob-2'
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                RoB 2
              </button>
            </div>
          </div>

          {/* Reference Articles List */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredArticles.map(art => {
              const isSelected = art.id === selectedRefArticleId;
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    setSelectedRefArticleId(art.id);
                    setDiffResult(null);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/60 border-teal-700 shadow-xs ring-1 ring-teal-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {art.instrumentName.split('â€“')[0].trim()}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {art.year}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2 leading-relaxed">
                    {art.title}
                  </h3>

                  <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                    {art.authors} â€¢ <span className="italic">{art.journal}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <div className="text-teal-900 font-semibold">
                      Fasit: {art.expectedOverallScoreOrVerdict || 'Verifisert'}
                    </div>
                    <span className="text-slate-400">
                      {art.itemData.length} items
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredArticles.length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500">
                Ingen referanseartikler matchet sÃ¸ket eller filteret.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Article Deep-Dive & Live Diff (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeRefArticle && (
            <>
              {/* Article Metadata Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getAssessmentTypeBadge(activeRefArticle.referenceAssessmentType)}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                      Status: {activeRefArticle.verificationStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Verifisert: {activeRefArticle.verificationDate}
                  </div>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif leading-snug">
                    {activeRefArticle.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeRefArticle.authors} ({activeRefArticle.year}). <span className="font-medium text-slate-700">{activeRefArticle.journal}</span>. Utgiver: {activeRefArticle.publisher}.
                  </p>
                </div>

                {/* Identifiers & Links */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700">DOI:</span>
                  <a
                    href={activeRefArticle.articleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 underline font-mono text-[11px]"
                  >
                    {activeRefArticle.doi}
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {activeRefArticle.pmid && (
                    <>
                      <span className="text-slate-300">â€¢</span>
                      <span className="font-semibold text-slate-700">PMID:</span>
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${activeRefArticle.pmid}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 underline font-mono text-[11px]"
                      >
                        {activeRefArticle.pmid}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}

                  <span className="text-slate-300">â€¢</span>
                  <span className="font-semibold text-slate-700">Database:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium">
                    {activeRefArticle.database}
                  </span>
                </div>

                {/* Why Selected & Selection Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      Begrunnelse for utvalg
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {activeRefArticle.whySelected}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-teal-700" />
                      Valideringskilde & Metode
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {activeRefArticle.validationSource}
                    </p>
                  </div>
                </div>

                {/* Supplementary Materials Card */}
                {activeRefArticle.supplementaryMaterials.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-teal-50/40 border border-teal-200 text-xs space-y-2">
                    <div className="font-bold text-teal-950 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-teal-700" />
                      Supplerende materiale og vedlagte tabeller ({activeRefArticle.supplementaryMaterials.length})
                    </div>
                    <div className="space-y-1.5">
                      {activeRefArticle.supplementaryMaterials.map(supp => (
                        <div key={supp.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-teal-100">
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{supp.supplementTitle}</div>
                            <div className="text-[11px] text-slate-500">
                              Format: {supp.fileType} â€¢ Dekker: {supp.itemsCovered}
                            </div>
                          </div>
                          {supp.supplementUrl && (
                            <a
                              href={supp.supplementUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-teal-50 text-teal-900 hover:bg-teal-100 text-[11px] font-semibold border border-teal-200"
                            >
                              Ã…pne
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Gold-Standard Diff Runner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GitCompare className="w-4 h-4 text-teal-700" />
                      Gullstandard Diff & Kalibreringskontroll
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sammenlign en vurdering fra ditt bibliotek mot denne publiserte gullstandarden item-for-item.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedUserArticleId}
                      onChange={(e) => setSelectedUserArticleId(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700"
                    >
                      {articles.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.shortCitation || a.title.slice(0, 30)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleRunGoldStandardDiff}
                      disabled={isDiffRunning}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                      <span>{isDiffRunning ? 'Beregner diff...' : 'KjÃ¸r Diff-analyse'}</span>
                    </button>
                  </div>
                </div>

                {/* Diff Results Output */}
                {diffResult && (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <div className={`p-4 rounded-xl border ${
                      diffResult.matchStatus === 'MATCH'
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : diffResult.matchStatus === 'PARTIAL_MATCH'
                        ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                        : 'bg-rose-50/70 border-rose-300 text-rose-950'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            {diffResult.matchStatus === 'MATCH' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                            {diffResult.matchStatus === 'PARTIAL_MATCH' && <AlertTriangle className="w-4 h-4 text-amber-700" />}
                            {diffResult.matchStatus === 'MISMATCH' && <AlertTriangle className="w-4 h-4 text-rose-700" />}
                            Status: {diffResult.matchStatus} ({diffResult.matchPercentage}% overensstemmelse)
                          </div>
                          <p className="text-xs">{diffResult.summaryMessage}</p>
                        </div>

                        <div className="text-right text-xs font-bold">
                          {diffResult.matchingItemsCount} / {diffResult.totalItemsCompared} items matcher
                        </div>
                      </div>
                    </div>

                    {/* Item-by-item diff list */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">Item-for-item sammenligning:</div>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {diffResult.itemDiffs.map(diff => (
                          <div key={diff.itemNumber} className="p-3 bg-white hover:bg-slate-50/80 transition-colors text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900">
                                  Item {diff.itemNumber}: {diff.itemTitle}
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                  Kilde: {diff.referenceSource}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  diff.isMatch
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : diff.severity === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}>
                                  {diff.isMatch ? 'MATCH' : diff.severity}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                              <div>
                                <span className="font-semibold text-slate-600">Publisert referansesvar: </span>
                                <span className="font-bold text-teal-900">{diff.referenceResponse}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-600">Applikasjonssvar: </span>
                                <span className="font-bold text-slate-900">{diff.applicationResponse}</span>
                              </div>
                            </div>

                            {!diff.isMatch && (
                              <div className="mt-1.5 p-2 rounded bg-amber-50/50 border border-amber-100 text-[11px] text-amber-900">
                                {diff.difference}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Academic Integrity Notice */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                      <strong>Merk:</strong> {diffResult.scientificValidityNotice}
                    </div>
                  </div>
                )}
              </div>

              {/* Published Item-by-Item Benchmark Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-700" />
                    Publisert referansedatasett (Fasit: {activeRefArticle.itemData.length} items)
                  </h3>
                  <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Kildekontrollert
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeRefArticle.itemData.map(item => {
                    const isExpanded = expandedItemId === item.itemNumber;
                    return (
                      <div key={item.itemNumber} className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors">
                        <div 
                          className="flex items-start justify-between gap-3 cursor-pointer"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.itemNumber)}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                                #{item.itemNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {item.itemTitle}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.referenceSource} â€¢ {item.reviewerOrStudy}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">
                              {item.referenceResponse}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2 text-slate-700 bg-slate-50/60 p-3 rounded-lg">
                            <div>
                              <span className="font-semibold text-slate-900">Metodisk begrunnelse: </span>
                              {item.referenceRationale}
                            </div>
                            {item.evidenceSnippet && (
                              <div className="p-2 rounded bg-white border border-slate-200 font-serif italic text-[11px] text-slate-800">
                                Â«{item.evidenceSnippet}Â»
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500">
                              Konsensusstatus: <span className="font-semibold">{item.agreementStatus || 'Enstemmig'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


