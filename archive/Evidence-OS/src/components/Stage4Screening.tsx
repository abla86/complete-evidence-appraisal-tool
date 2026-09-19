import React, { useState } from 'react';
import { 
  Filter, 
  Check, 
  X, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  ExternalLink,
  Tag,
  Search,
  Plus,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Award
} from 'lucide-react';
import { StudyRecord, ExclusionReason, PicoData, SearchData } from '../types';
import { PrismaFlowDiagram } from './PrismaFlowDiagram';
import { AiVerificationPanel } from './AiVerificationPanel';

interface Stage4Props {
  studies: StudyRecord[];
  pico: PicoData;
  searchData?: SearchData;
  onChangeStudies: (updated: StudyRecord[]) => void;
  onNext: () => void;
  onPrev: () => void;
  language: 'no' | 'en';
}

export const Stage4Screening: React.FC<Stage4Props> = ({
  studies,
  pico,
  searchData,
  onChangeStudies,
  onNext,
  onPrev,
  language,
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string>(studies[0]?.id || '');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'included' | 'excluded' | 'pending'>('all');
  const [activeScreeningPhase, setActiveScreeningPhase] = useState<'title_abstract' | 'full_text'>('title_abstract');
  const [activePrismaFilter, setActivePrismaFilter] = useState<string>('all');
  const [selectedExclusionFilter, setSelectedExclusionFilter] = useState<ExclusionReason | null>(null);
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for exclusions
  const [selectedExclusionReason, setSelectedExclusionReason] = useState<ExclusionReason>('Wrong population');
  const [exclusionNotes, setExclusionNotes] = useState('');

  // Add study modal state
  const [isAddingStudy, setIsAddingStudy] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState(2023);
  const [newJournal, setNewJournal] = useState('');
  const [newAbstract, setNewAbstract] = useState('');

  const currentStudy = studies.find(s => s.id === selectedStudyId) || studies[0];

  const exclusionReasonsList: ExclusionReason[] = [
    'Wrong population',
    'Wrong intervention / exposure',
    'Wrong comparator',
    'Wrong outcome',
    'Ineligible study design',
    'Duplicate publication',
    'Unobtainable full-text',
    'Other'
  ];

  const handleDecision = (decision: 'include' | 'exclude') => {
    if (!currentStudy) return;

    const updated = studies.map(s => {
      if (s.id !== currentStudy.id) return s;

      if (decision === 'include') {
        return {
          ...s,
          status: activeScreeningPhase === 'title_abstract' ? ('screened_included' as const) : ('fulltext_eligible' as const),
          titleAbstractDecision: 'include' as const,
          fullTextDecision: activeScreeningPhase === 'full_text' ? ('include' as const) : s.fullTextDecision,
          exclusionReason: undefined,
          exclusionNotes: undefined,
          humanVerified: true,
          verifiedBy: 'Forsker (Hovedgransker)',
          verifiedAt: new Date().toISOString(),
        };
      } else {
        return {
          ...s,
          status: activeScreeningPhase === 'title_abstract' ? ('screened_excluded' as const) : ('fulltext_excluded' as const),
          titleAbstractDecision: activeScreeningPhase === 'title_abstract' ? ('exclude' as const) : s.titleAbstractDecision,
          fullTextDecision: activeScreeningPhase === 'full_text' ? ('exclude' as const) : s.fullTextDecision,
          exclusionReason: selectedExclusionReason,
          exclusionNotes: exclusionNotes || 'Ekskludert iht kriterier.',
          humanVerified: true,
          verifiedBy: 'Forsker (Hovedgransker)',
          verifiedAt: new Date().toISOString(),
        };
      }
    });

    onChangeStudies(updated);
    setExclusionNotes('');

    // Advance to next pending study
    const nextPending = updated.find(s => s.status === 'unscreened' && s.id !== currentStudy.id);
    if (nextPending) {
      setSelectedStudyId(nextPending.id);
    }
  };

  const handleVerifyStudy = (studyId: string, verified: boolean) => {
    const updated = studies.map(s => {
      if (s.id !== studyId) return s;
      return {
        ...s,
        humanVerified: verified,
        verifiedBy: verified ? 'Forsker (Signert)' : undefined,
        verifiedAt: verified ? new Date().toISOString() : undefined,
      };
    });
    onChangeStudies(updated);
  };

  const handleBatchVerifyAll = () => {
    const updated = studies.map(s => ({
      ...s,
      humanVerified: true,
      verifiedBy: 'Forsker (Batch-godkjent)',
      verifiedAt: new Date().toISOString(),
    }));
    onChangeStudies(updated);
  };

  const handleSelectPrismaFilter = (filter: 'all' | 'included' | 'excluded' | 'pending' | ExclusionReason) => {
    setActivePrismaFilter(filter);
    if (filter === 'all' || filter === 'included' || filter === 'excluded' || filter === 'pending') {
      setPhaseFilter(filter);
      setSelectedExclusionFilter(null);
    } else {
      // It's an ExclusionReason
      setPhaseFilter('excluded');
      setSelectedExclusionFilter(filter as ExclusionReason);
    }
  };

  const handleAiScreen = async () => {
    if (!currentStudy) return;
    setIsAiEvaluating(true);

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'screen_study',
          payload: {
            pico,
            study: {
              title: currentStudy.title,
              authors: currentStudy.authors,
              year: currentStudy.year,
              abstract: currentStudy.abstract,
            },
            inclusion: pico.inclusionCriteria.join('; '),
            exclusion: pico.exclusionCriteria.join('; '),
          },
          language,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const updated = studies.map(s => {
          if (s.id !== currentStudy.id) return s;
          return {
            ...s,
            aiScreening: {
              recommendation: d.recommendation || 'INCLUDE',
              confidence: d.confidence_score || 95,
              reason: d.reason || 'Samsvarer med PICO-kriteriene.',
              keyQuote: d.key_evidence_extract || '',
            }
          };
        });
        onChangeStudies(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiEvaluating(false);
    }
  };

  const handleCreateStudy = () => {
    if (!newTitle.trim()) return;
    const newId = 'study_' + Date.now();
    const created: StudyRecord = {
      id: newId,
      citationKey: `${newAuthors.split(' ')[0] || 'Author'} (${newYear})`,
      title: newTitle.trim(),
      authors: newAuthors.trim() || 'Ukjente forfattere',
      year: newYear,
      journal: newJournal.trim() || 'Tidsskrift',
      abstract: newAbstract.trim() || 'Ingen abstrakttekst lagt inn.',
      status: 'unscreened',
    };
    onChangeStudies([created, ...studies]);
    setSelectedStudyId(newId);
    setIsAddingStudy(false);
    setNewTitle('');
    setNewAuthors('');
    setNewAbstract('');
  };

  const filteredStudies = studies.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.authors.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedExclusionFilter) {
      return (s.status === 'screened_excluded' || s.status === 'fulltext_excluded') && 
             s.exclusionReason === selectedExclusionFilter;
    }

    if (phaseFilter === 'included') return s.status === 'screened_included' || s.status === 'fulltext_eligible';
    if (phaseFilter === 'excluded') return s.status === 'screened_excluded' || s.status === 'fulltext_excluded';
    if (phaseFilter === 'pending') return s.status === 'unscreened';
    return true;
  });

  const includedCount = studies.filter(s => s.status === 'screened_included' || s.status === 'fulltext_eligible').length;
  const excludedCount = studies.filter(s => s.status === 'screened_excluded' || s.status === 'fulltext_excluded').length;
  const pendingCount = studies.filter(s => s.status === 'unscreened').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 uppercase tracking-wider mb-1">
            <span>Trinn 4 av 10</span>
            <span>•</span>
            <span>Studieutvalg & PRISMA-screening</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Screening & Seleksjon (Screening)
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Strukturert vurdering av titler, abstrakter og fulltekster mot forhåndsdefinerte PICO-kriterier. Registrer eksklusjonsgrunner og benytt AI-assistert prediksjon.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-300 p-1 bg-stone-100 text-xs font-medium">
            <button
              onClick={() => setActiveScreeningPhase('title_abstract')}
              className={`px-3 py-1 rounded transition ${activeScreeningPhase === 'title_abstract' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'}`}
            >
              Fase 1: Tittel & Abstrakt
            </button>
            <button
              onClick={() => setActiveScreeningPhase('full_text')}
              className={`px-3 py-1 rounded transition ${activeScreeningPhase === 'full_text' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'}`}
            >
              Fase 2: Fulltekstvurdering
            </button>
          </div>

          <button
            onClick={() => setIsAddingStudy(true)}
            className="px-3 py-2 rounded-lg bg-stone-800 text-white text-xs font-medium hover:bg-stone-700 flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Legg til referanse</span>
          </button>
        </div>
      </div>

      {/* PRISMA 2020 Live Dynamic Flow Diagram */}
      <PrismaFlowDiagram
        studies={studies}
        searchData={searchData}
        onSelectFilter={handleSelectPrismaFilter}
        activeFilter={activePrismaFilter}
        language={language}
      />

      {/* Zero-Hallucination & AI Verification Protocol Panel */}
      <AiVerificationPanel
        studies={studies}
        currentStudy={currentStudy}
        pico={pico}
        onVerifyStudy={handleVerifyStudy}
        onBatchVerifyAll={handleBatchVerifyAll}
        language={language}
      />

      {/* Workbench Layout: Master List Left, Detail Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          {/* Filters & Search */}
          <div className="p-3 border-b border-stone-200 space-y-2 bg-stone-50/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Søk i titler og forfattere..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* PRISMA reason filter notice */}
            {selectedExclusionFilter && (
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900">
                <span className="truncate">PRISMA-filter: <strong>{selectedExclusionFilter}</strong></span>
                <button 
                  onClick={() => {
                    setSelectedExclusionFilter(null);
                    setPhaseFilter('all');
                    setActivePrismaFilter('all');
                  }}
                  className="text-xs text-rose-700 hover:text-rose-950 font-bold ml-2 underline shrink-0"
                >
                  Nullstill
                </button>
              </div>
            )}

            <div className="flex gap-1 overflow-x-auto text-[11px]">
              <button
                onClick={() => setPhaseFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition ${phaseFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700'}`}
              >
                Alle ({studies.length})
              </button>
              <button
                onClick={() => setPhaseFilter('included')}
                className={`px-2.5 py-1 rounded font-medium transition ${phaseFilter === 'included' ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-700'}`}
              >
                Inkludert ({includedCount})
              </button>
              <button
                onClick={() => setPhaseFilter('excluded')}
                className={`px-2.5 py-1 rounded font-medium transition ${phaseFilter === 'excluded' ? 'bg-rose-700 text-white' : 'bg-stone-200 text-stone-700'}`}
              >
                Ekskludert ({excludedCount})
              </button>
              <button
                onClick={() => setPhaseFilter('pending')}
                className={`px-2.5 py-1 rounded font-medium transition ${phaseFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-700'}`}
              >
                Ubehandlet ({pendingCount})
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredStudies.map((s) => {
              const isSelected = s.id === currentStudy?.id;
              const isIncluded = s.status === 'screened_included' || s.status === 'fulltext_eligible';
              const isExcluded = s.status === 'screened_excluded' || s.status === 'fulltext_excluded';

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudyId(s.id)}
                  className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 ${
                    isSelected ? 'bg-stone-100/90 border-l-4 border-l-emerald-600' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-stone-800 truncate">
                      {s.citationKey}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        isIncluded
                          ? 'bg-emerald-100 text-emerald-800'
                          : isExcluded
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isIncluded ? 'Inkludert' : isExcluded ? 'Ekskludert' : 'Ubehandlet'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-stone-900 line-clamp-2 leading-snug">
                    {s.title}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                    <span className="truncate">{s.journal} ({s.year})</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.humanVerified && (
                        <span className="flex items-center gap-0.5 text-blue-700 font-mono text-[10px] font-semibold" title="Verifisert av forsker">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          Signert
                        </span>
                      )}
                      {s.aiScreening && (
                        <span className="flex items-center gap-1 text-amber-700 font-mono text-[10px]">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          {s.aiScreening.confidence}%
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5 h-[750px] overflow-y-auto">
          {currentStudy ? (
            <>
              {/* Study Header */}
              <div className="border-b border-stone-200 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-xs font-semibold">
                    {currentStudy.citationKey}
                  </span>

                  <div className="flex items-center gap-2">
                    {currentStudy.doi && (
                      <a
                        href={`https://doi.org/${currentStudy.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone-500 hover:text-emerald-700 text-xs flex items-center gap-1 font-mono transition"
                      >
                        <span>DOI</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {currentStudy.pmid && (
                      <span className="text-stone-500 font-mono text-xs">
                        PMID: {currentStudy.pmid}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-stone-900 leading-snug">
                  {currentStudy.title}
                </h2>

                <div className="text-xs text-stone-600">
                  <span className="font-semibold text-stone-800">Forfattere: </span>
                  <span>{currentStudy.authors}</span>
                </div>
                <div className="text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">Publisert i: </span>
                  <span>{currentStudy.journal} ({currentStudy.year})</span>
                </div>
              </div>

              {/* AI Screener Recommendation Card */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Screening-assistent (Cochrane PICO-evaluering)</span>
                  </div>

                  <button
                    onClick={handleAiScreen}
                    disabled={isAiEvaluating}
                    className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-medium text-[11px] flex items-center gap-1 transition"
                  >
                    <Sparkles className={`w-3 h-3 ${isAiEvaluating ? 'animate-spin' : ''}`} />
                    <span>{isAiEvaluating ? 'Analyserer...' : 'Kjør AI-vurdering'}</span>
                  </button>
                </div>

                {currentStudy.aiScreening ? (
                  <div className="space-y-1.5 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Anbefaling:</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          currentStudy.aiScreening.recommendation === 'INCLUDE'
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-rose-200 text-rose-900'
                        }`}
                      >
                        {currentStudy.aiScreening.recommendation}
                      </span>
                      <span className="text-[11px] text-amber-800 font-mono">
                        (Konfidens: {currentStudy.aiScreening.confidence}%)
                      </span>
                    </div>
                    <p className="leading-relaxed text-[12px]">{currentStudy.aiScreening.reason}</p>
                    {currentStudy.aiScreening.keyQuote && (
                      <div className="p-2 bg-white/70 rounded border border-amber-200/60 text-[11px] italic font-serif text-stone-700">
                        "{currentStudy.aiScreening.keyQuote}"
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800">
                    Trykk på "Kjør AI-vurdering" for å la Gemini analysere teksten opp mot PICO-kriteriene.
                  </p>
                )}
              </div>

              {/* Abstract */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                  Abstrakt (Sammendrag)
                </label>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed font-sans max-h-64 overflow-y-auto whitespace-pre-line">
                  {currentStudy.abstract}
                </div>
              </div>

              {currentStudy.methodsSummary && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Metodesammendrag / Studiekarakteristika
                  </label>
                  <div className="p-3 bg-stone-100/70 rounded-lg text-xs text-stone-700 leading-relaxed">
                    {currentStudy.methodsSummary}
                  </div>
                </div>
              )}

              {/* Screening Action Bar */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
                    Screeningsbeslutning ({activeScreeningPhase === 'title_abstract' ? 'Tittel/Abstrakt' : 'Fulltekst'})
                  </span>
                  {currentStudy.exclusionReason && (
                    <span className="text-xs text-rose-700 font-medium">
                      Årsak: {currentStudy.exclusionReason}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* INCLUDE BUTTON with visual markers */}
                  <button
                    onClick={() => handleDecision('include')}
                    className="px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm border border-emerald-600 hover:shadow"
                  >
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Inkluder studie</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-800/90 text-[10px] font-mono font-bold border border-emerald-600/50">
                      n = {includedCount}
                    </span>
                  </button>

                  {/* EXCLUDE BUTTON with visual markers */}
                  <button
                    onClick={() => handleDecision('exclude')}
                    className="px-4 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm border border-rose-600 hover:shadow"
                  >
                    <X className="w-4 h-4 text-rose-200" />
                    <span>Ekskluder studie</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-800/90 text-[10px] font-mono font-bold border border-rose-600/50">
                      n = {excludedCount}
                    </span>
                  </button>
                </div>

                {/* Human verification toggle button */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldCheck className={`w-4 h-4 ${currentStudy.humanVerified ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-semibold text-slate-800">
                        {currentStudy.humanVerified ? 'Forskervalidert (Signert av investigator)' : 'Menneskelig forskervalidering:'}
                      </span>
                      {currentStudy.verifiedAt && (
                        <span className="text-[10px] text-slate-500 block">
                          Sist signert: {new Date(currentStudy.verifiedAt).toLocaleTimeString('no-NO')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerifyStudy(currentStudy.id, !currentStudy.humanVerified)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      currentStudy.humanVerified
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {currentStudy.humanVerified ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-blue-700" />
                        <span>Signert ✓</span>
                      </>
                    ) : (
                      <span>Signer som forsker</span>
                    )}
                  </button>
                </div>

                {/* Exclusion Reason selector for rigorous PRISMA tracking */}
                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
                  <label className="block text-[11px] font-semibold text-stone-700">
                    Standardisert eksklusjonsgrunn (PRISMA 2020 begrunnelse):
                  </label>
                  <select
                    value={selectedExclusionReason}
                    onChange={(e) => setSelectedExclusionReason(e.target.value as ExclusionReason)}
                    className="w-full text-xs bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-600"
                  >
                    {exclusionReasonsList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={exclusionNotes}
                    onChange={(e) => setExclusionNotes(e.target.value)}
                    placeholder="Valgfri supplerende merknad (f.eks. LVEF under 40%)..."
                    className="w-full text-xs bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs">
              <FileText className="w-8 h-8 mb-2" />
              <span>Velg en studie fra listen for å starte screening.</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Study Modal */}
      {isAddingStudy && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-stone-900">Legg til ny referanse til screening</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Tittel</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded p-2 focus:bg-white focus:outline-none focus:border-emerald-600"
                  placeholder="F.eks. Dapagliflozin in patients with..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Forfattere</label>
                  <input
                    type="text"
                    value={newAuthors}
                    onChange={(e) => setNewAuthors(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 focus:bg-white focus:outline-none"
                    placeholder="Etternavn Initials, et al."
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Årstall</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value) || 2024)}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Tidsskrift</label>
                <input
                  type="text"
                  value={newJournal}
                  onChange={(e) => setNewJournal(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded p-2 focus:bg-white focus:outline-none"
                  placeholder="Tidsskriftnavn..."
                />
              </div>
              <div>
                <label className="block font-medium text-stone-700 mb-1">Abstrakt</label>
                <textarea
                  rows={4}
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded p-2 focus:bg-white focus:outline-none"
                  placeholder="Lim inn sammendrag..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => setIsAddingStudy(false)}
                className="px-3.5 py-1.5 rounded border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateStudy}
                className="px-4 py-1.5 rounded bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800"
              >
                Opprett referanse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer with Visual Markers on Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-stone-200 bg-white p-4 rounded-xl shadow-2xs">
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til Search</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onNext}
            className={`group px-6 py-3.5 rounded-xl font-semibold text-xs flex items-center justify-between sm:justify-start gap-4 transition-all shadow-md ${
              pendingCount === 0 
                ? 'bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white ring-2 ring-emerald-500/40 shadow-emerald-900/20' 
                : 'bg-stone-900 hover:bg-stone-800 text-white ring-1 ring-stone-700'
            }`}
          >
            <div className="flex items-center gap-2.5 text-left">
              {pendingCount === 0 ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                </span>
              )}
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">Fortsett handling: Gå videre til Trinn 5: Critical appraisal</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-2xs ${
                    pendingCount === 0 
                      ? 'bg-emerald-500 text-white border border-emerald-300' 
                      : 'bg-amber-400 text-amber-950 border border-amber-300'
                  }`}>
                    {pendingCount === 0 ? `Fullført (${studies.length}/${studies.length}) ✓` : `${pendingCount} ubehandlet ⚠`}
                  </span>
                </div>
                <div className="text-[10px] text-stone-300 font-normal mt-0.5">
                  {pendingCount === 0 
                    ? '✓ PRISMA 2020 Balansert • Alle studier er ferdig evaluert og klare for CASP/RoB' 
                    : `Merk: ${pendingCount} studie(r) gjenstår til screening før PRISMA er komplett`}
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
