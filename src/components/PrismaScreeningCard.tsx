import React, { useState } from 'react';
import { 
  Filter, 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { PrismaFlowchartData, RetrievedStudy } from '../types';

interface PrismaScreeningCardProps {
  prisma: PrismaFlowchartData;
  studies: RetrievedStudy[];
  onToggleInclusion?: (studyId: string) => void;
}

export const PrismaScreeningCard: React.FC<PrismaScreeningCardProps> = ({
  prisma,
  studies,
  onToggleInclusion,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'INCLUDED' | 'EXCLUDED'>('INCLUDED');
  const [expandedStudyId, setExpandedStudyId] = useState<string | null>(studies[0]?.id || null);

  const filteredStudies = studies.filter(s => {
    if (filterTab === 'INCLUDED') return s.screeningStatus === 'INCLUDED';
    if (filterTab === 'EXCLUDED') return s.screeningStatus === 'EXCLUDED';
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded uppercase">
              Agent 3: Retrieval & Deduplication
            </span>
            <span className="text-xs text-slate-400">Trinn 3 av 6</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            PRISMA 2020 Flytdiagram & Artikkelscreening
          </h3>
          <p className="text-xs text-slate-400">
            Systematisk registrering av treff, automatisk duplikateliminering og transparent vurdering av inklusjonskriterier
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('INCLUDED')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === 'INCLUDED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Inkluderte ({studies.filter(s => s.screeningStatus === 'INCLUDED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('EXCLUDED')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === 'EXCLUDED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ekskluderte / Duplikater ({studies.filter(s => s.screeningStatus === 'EXCLUDED').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterTab === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Alle ({studies.length})
          </button>
        </div>
      </div>

      {/* PRISMA 2020 Flow Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] text-slate-400 block font-medium">1. Identifisert</span>
          <span className="text-lg font-bold text-sky-400">{prisma.recordsIdentified}</span>
          <span className="text-[10px] text-slate-500 block">PubMed / Cochrane</span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] text-slate-400 block font-medium">2. Duplikater fjernet</span>
          <span className="text-lg font-bold text-amber-400">-{prisma.duplicatesRemoved}</span>
          <span className="text-[10px] text-slate-500 block">Identiske titler/DOI</span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] text-slate-400 block font-medium">3. Screenet</span>
          <span className="text-lg font-bold text-slate-200">{prisma.recordsScreened}</span>
          <span className="text-[10px] text-slate-500 block">Tittel & abstrakt</span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] text-slate-400 block font-medium">4. Ekskludert</span>
          <span className="text-lg font-bold text-rose-400">-{prisma.recordsExcludedScreening}</span>
          <span className="text-[10px] text-slate-500 block">Feil intervensjon</span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-[10px] text-slate-400 block font-medium">5. Fulltekst vurdert</span>
          <span className="text-lg font-bold text-purple-400">{prisma.fullTextAssessed}</span>
          <span className="text-[10px] text-slate-500 block">Hentet artikler</span>
        </div>

        <div className="p-3 bg-emerald-950/40 border border-emerald-700/60 rounded-lg text-center">
          <span className="text-[10px] text-emerald-300 block font-medium">6. Inkludert i analyse</span>
          <span className="text-lg font-bold text-emerald-400">{prisma.studiesIncluded}</span>
          <span className="text-[10px] text-emerald-300/80 block">For kritisk vurdering</span>
        </div>
      </div>

      {/* Studies List */}
      <div className="space-y-3">
        {filteredStudies.map((study) => {
          const isExpanded = expandedStudyId === study.id;
          const isIncluded = study.screeningStatus === 'INCLUDED';

          return (
            <div
              key={study.id}
              className={`p-4 rounded-xl border transition-all ${
                isIncluded
                  ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/30 border-slate-850 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isIncluded 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                    }`}>
                      {isIncluded ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isIncluded ? 'Inkludert' : study.isDuplicate ? 'Duplikat fjernet' : 'Ekskludert'}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {study.studyType}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      PMID: {study.pmid}
                    </span>

                    <span className="text-[11px] text-slate-500">
                      &bull; {study.journal} ({study.year})
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 hover:text-emerald-300 transition-colors">
                    {study.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    {study.authors}
                  </p>

                  {/* Exclusion reason if excluded */}
                  {!isIncluded && study.exclusionReason && (
                    <div className="mt-2 p-2 rounded bg-rose-950/40 border border-rose-900/50 text-xs text-rose-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Årsak for eksklusjon:</strong> {study.exclusionReason}</span>
                    </div>
                  )}

                  {/* Key finding summary if included */}
                  {isIncluded && study.keyFindingSummary && (
                    <div className="mt-2 text-xs text-emerald-300/90 bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                      <span className="font-semibold text-emerald-200">Hovedfunn: </span>
                      {study.keyFindingSummary}
                      {study.effectSizeEstimate && (
                        <div className="mt-1 font-mono text-[11px] text-emerald-400">
                          Effekt: {study.effectSizeEstimate}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://doi.org/${study.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                    title="Åpne DOI artikkel"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">DOI</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setExpandedStudyId(isExpanded ? null : study.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{isExpanded ? 'Skjul' : 'Abstrakt'}</span>
                  </button>
                </div>
              </div>

              {/* Expanded Abstract */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/40 p-3 rounded-lg">
                  <span className="font-semibold text-slate-200 block mb-1">Studiens abstrakt:</span>
                  <p>{study.abstract}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
