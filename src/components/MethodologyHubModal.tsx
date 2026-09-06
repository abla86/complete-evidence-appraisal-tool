import React, { useState, useMemo } from 'react';
import { AppraisalInstrument, InstrumentCategory } from '../types';
import { 
  MASTER_INSTRUMENTS_REGISTRY, 
  INSTRUMENT_CATEGORIES 
} from '../data/masterRegistry';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  BookOpen, 
  Scale, 
  Sparkles, 
  Search, 
  ExternalLink, 
  X, 
  ArrowRight, 
  FileText, 
  HelpCircle, 
  Check, 
  Copy, 
  SlidersHorizontal,
  GraduationCap
} from 'lucide-react';

interface MethodologyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInstrumentId: string;
  onSelectInstrument: (instrumentId: string) => void;
}

export const MethodologyHubModal: React.FC<MethodologyHubModalProps> = ({
  isOpen,
  onClose,
  selectedInstrumentId,
  onSelectInstrument
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeDesignFilter, setActiveDesignFilter] = useState<string>('all');
  const [viewingInstrument, setViewingInstrument] = useState<AppraisalInstrument | null>(null);
  const [copiedDoi, setCopiedDoi] = useState<string | null>(null);

  const studyDesignOptions = [
    'Alle design',
    'Kvalitativ forskning',
    'Randomisert kontrollert studie (RCT)',
    'Systematisk oversikt',
    'Scoping review',
    'Kohortstudie',
    'Kasus-kontroll-studie',
    'Tverrsnittsstudie',
    'Diagnostisk nÃ¸yaktighetsstudie',
    'Klinisk retningslinje',
    'Kvalitetsforbedring',
    'Mixed methods',
    'Forskningsetikk'
  ];

  const filteredInstruments = useMemo(() => {
    return MASTER_INSTRUMENTS_REGISTRY.filter(inst => {
      // Category filter
      if (activeCategory !== 'all' && inst.category !== activeCategory) {
        return false;
      }

      // Design filter
      if (activeDesignFilter !== 'all' && activeDesignFilter !== 'Alle design') {
        const matchesDesign = inst.targetStudyDesign.some(d => 
          d.toLowerCase().includes(activeDesignFilter.toLowerCase())
        ) || (activeDesignFilter === 'Forskningsetikk' && inst.category === 'ethics_governance');
        if (!matchesDesign) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = 
          inst.name.toLowerCase().includes(q) ||
          inst.shortName.toLowerCase().includes(q) ||
          inst.purpose.toLowerCase().includes(q) ||
          inst.publisher.toLowerCase().includes(q) ||
          inst.targetStudyDesign.some(d => d.toLowerCase().includes(q)) ||
          inst.categoryName.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      return true;
    });
  }, [activeCategory, activeDesignFilter, searchQuery]);

  const handleCopyCitation = (inst: AppraisalInstrument) => {
    const citation = `${inst.publisher} (${inst.year}). ${inst.name} [Versjon ${inst.version}]. ${inst.officialSource}${inst.doi ? ` https://doi.org/${inst.doi}` : ''}`;
    navigator.clipboard.writeText(citation);
    setCopiedDoi(inst.id);
    setTimeout(() => setCopiedDoi(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-xs text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif tracking-tight">
                  Metode- & Instrumentbibliotek
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {MASTER_INSTRUMENTS_REGISTRY.length} VerktÃ¸y
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Komplett samling av internasjonale standarder for kunnskapsbasert praksis, etikk, bias og metodologi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Lukk biblioteket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Category Bar & Design Matcher */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 shrink-0 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SÃ¸k i verktÃ¸y, studietype, utgiver, DOI..."
                className="w-full pl-9.5 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Design Matcher Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-600 shrink-0">Filtrer pÃ¥ studiedesign:</span>
              <select
                value={activeDesignFilter}
                onChange={(e) => setActiveDesignFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
              >
                {studyDesignOptions.map(des => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] pt-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Alle kategorier ({MASTER_INSTRUMENTS_REGISTRY.length})
            </button>

            {INSTRUMENT_CATEGORIES.map(cat => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-800 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                    isSelected ? 'bg-teal-900/60 text-teal-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cat.itemCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Grid of Instruments */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/60">
          {filteredInstruments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto my-8 space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Ingen verktÃ¸y matcher sÃ¸ket</h3>
              <p className="text-slate-500 text-xs">
                PrÃ¸v Ã¥ endre sÃ¸keord eller tilbakestill kategorifilteret for Ã¥ se alle tilgjengelige instrumenter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setActiveDesignFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-teal-800 text-white font-bold text-xs hover:bg-teal-900 transition-colors"
              >
                Tilbakestill filtre
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInstruments.map(inst => {
                const isCurrentActive = inst.id === selectedInstrumentId;
                return (
                  <div
                    key={inst.id}
                    className={`bg-white border rounded-2xl p-4.5 flex flex-col justify-between transition-all hover:shadow-md ${
                      isCurrentActive 
                        ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {inst.categoryName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          v{inst.version} ({inst.year})
                        </span>
                      </div>

                      {/* Title & Short Name */}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2" title={inst.name}>
                          {inst.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-teal-800 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{inst.shortName}</span>
                          <span className="text-slate-300">â€¢</span>
                          <span className="text-slate-500 font-normal">{inst.itemCount} ledd/domener</span>
                        </div>
                      </div>

                      {/* Purpose */}
                      <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                        {inst.purpose}
                      </p>

                      {/* Applicable Designs Tags */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Passer for:
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
                          {inst.targetStudyDesign.slice(0, 3).map((des, idx) => (
                            <span 
                              key={idx} 
                              className="px-1.5 py-0.5 rounded text-[9px] bg-slate-50 border border-slate-200 text-slate-600 font-medium"
                            >
                              {des}
                            </span>
                          ))}
                          {inst.targetStudyDesign.length > 3 && (
                            <span className="px-1 py-0.5 rounded text-[9px] text-slate-400 font-medium">
                              +{inst.targetStudyDesign.length - 3} til
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingInstrument(inst)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Se detaljer & ledd</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectInstrument(inst.id);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                          isCurrentActive
                            ? 'bg-teal-50 text-teal-800 border border-teal-200 cursor-default'
                            : 'bg-teal-800 hover:bg-teal-900 text-white shadow-2xs'
                        }`}
                      >
                        {isCurrentActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-teal-600" />
                            <span>Aktivt</span>
                          </>
                        ) : (
                          <>
                            <span>Velg verktÃ¸y</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-[11px] text-slate-500">
          <div>
            Viser <strong>{filteredInstruments.length}</strong> av <strong>{MASTER_INSTRUMENTS_REGISTRY.length}</strong> standardiserte metoder
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>

      {/* Deep-Dive Instrument Inspection Modal */}
      {viewingInstrument && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-100">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold text-[10px] border border-teal-500/30">
                    {viewingInstrument.categoryName}
                  </span>
                  <span className="text-slate-400 text-[11px]">v{viewingInstrument.version} ({viewingInstrument.year})</span>
                </div>
                <h3 className="text-base font-bold font-serif">{viewingInstrument.name}</h3>
              </div>
              <button
                onClick={() => setViewingInstrument(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* Overview & Purpose */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-700" />
                  <span>FormÃ¥l og metodisk funksjon</span>
                </h4>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {viewingInstrument.purpose}
                </p>
                <div className="p-3 bg-teal-50 border border-teal-200/70 rounded-xl text-teal-950 text-[11px] leading-relaxed">
                  <strong>Metodisk rolle:</strong> {viewingInstrument.epistemologicalRole}
                </div>
              </div>

              {/* Target Designs & Scoring Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">MÃ¥lgruppe / Studiedesign</h5>
                  <div className="flex flex-wrap gap-1">
                    {viewingInstrument.targetStudyDesign.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Scoringmodell & Skala</h5>
                  <p className="font-mono text-teal-900 font-bold text-[11px]">{viewingInstrument.scoringModel}</p>
                  <p className="text-slate-600 text-[11px]">{viewingInstrument.scoringModelExplanation}</p>
                </div>
              </div>

              {/* Prohibited Academic Practices (Anti-slop) */}
              {viewingInstrument.prohibitedAcademicPractices && viewingInstrument.prohibitedAcademicPractices.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl space-y-2">
                  <h5 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Strengt forbudte akademiske praksiser (Anti-slop)</span>
                  </h5>
                  <ul className="space-y-1 text-amber-900 text-[11px]">
                    {viewingInstrument.prohibitedAcademicPractices.map((proc, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-700">â€¢</span>
                        <span>{proc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source & Citation */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Kilde og referanse (APA 7th)</h5>
                  <button
                    onClick={() => handleCopyCitation(viewingInstrument)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors"
                  >
                    {copiedDoi === viewingInstrument.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Kopier referanse</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-slate-700 font-serif italic text-xs leading-relaxed">
                  {viewingInstrument.officialSource}
                </p>
                {viewingInstrument.doi && (
                  <div className="text-teal-800 font-mono text-[11px] flex items-center gap-1">
                    <span>DOI:</span>
                    <a 
                      href={`https://doi.org/${viewingInstrument.doi}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="underline font-bold hover:text-teal-950"
                    >
                      {viewingInstrument.doi}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              {viewingInstrument.sourceUrl && (
                <a
                  href={viewingInstrument.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition-colors text-xs"
                >
                  <span>Ã…pne originalmanual</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              )}
              <button
                onClick={() => {
                  onSelectInstrument(viewingInstrument.id);
                  setViewingInstrument(null);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <span>Velg {viewingInstrument.shortName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

