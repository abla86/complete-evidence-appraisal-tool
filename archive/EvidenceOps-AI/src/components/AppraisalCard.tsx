import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  FileCheck2, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { RetrievedStudy, AppraisalChecklistItem } from '../types';

interface AppraisalCardProps {
  studies: RetrievedStudy[];
}

export const AppraisalCard: React.FC<AppraisalCardProps> = ({ studies }) => {
  const appraisedStudies = studies.filter(s => s.screeningStatus === 'INCLUDED' && s.appraisal);
  const [selectedStudyId, setSelectedStudyId] = useState<string>(appraisedStudies[0]?.id || '');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  const currentStudy = appraisedStudies.find(s => s.id === selectedStudyId) || appraisedStudies[0];

  if (!currentStudy || !currentStudy.appraisal) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        Ingen metodisk vurdering tilgjengelig ennå.
      </div>
    );
  }

  const appraisal = currentStudy.appraisal;
  const checklist = filterCriticalOnly 
    ? appraisal.checklist.filter(c => c.isCriticalDomain)
    : appraisal.checklist;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded uppercase">
              Agent 4: Appraisal Agent
            </span>
            <span className="text-xs text-slate-400">Trinn 4 av 6</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Kritisk metodisk vurdering (CASP & AMSTAR-2)
          </h3>
          <p className="text-xs text-slate-400">
            Systematisk gransking av intern validitet, risiko for skjevhet (RoB) og metodologisk stringens
          </p>
        </div>

        {/* Study Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {appraisedStudies.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedStudyId(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStudyId === s.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              {s.authors.split(',')[0]} ({s.year}) - {s.appraisal?.tool}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Study Overview Header */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
              Vurdert med: {appraisal.tool}
            </span>
            <span className="text-xs text-slate-400 font-mono">PMID: {currentStudy.pmid}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-100">{currentStudy.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{currentStudy.journal} ({currentStudy.year})</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Metodisk kvalitet</span>
            <span className={`text-sm font-extrabold ${
              appraisal.overallQuality === 'HIGH' ? 'text-emerald-400' :
              appraisal.overallQuality === 'MODERATE' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {appraisal.overallQuality === 'HIGH' ? 'HØY KVALITET' :
               appraisal.overallQuality === 'MODERATE' ? 'MODERAT KVALITET' : 'LAV KVALITET'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block font-medium">Konfidensgrad</span>
            <span className="text-sm font-extrabold text-sky-400">{appraisal.confidenceRating}%</span>
          </div>
        </div>
      </div>

      {/* Concluding Summary Box */}
      <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-lg mb-5 text-xs text-slate-300">
        <span className="font-semibold text-slate-200 block mb-1">Agentens samlede vurdering:</span>
        <p className="leading-relaxed">{appraisal.concludingSummary}</p>
        {appraisal.nonCriticalDeficiencies.length > 0 && (
          <div className="mt-2 text-[11px] text-amber-300/80 flex items-start gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Merknad: {appraisal.nonCriticalDeficiencies.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Filter Toggle for Critical Domains */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-300">
          Kriteriebasert sjekkliste ({checklist.length} punkter)
        </span>
        <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer hover:text-slate-200">
          <input
            type="checkbox"
            checked={filterCriticalOnly}
            onChange={(e) => setFilterCriticalOnly(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-purple-500 focus:ring-purple-400"
          />
          <span>Vis kun kritiske domener (Critical Domains)</span>
        </label>
      </div>

      {/* Checklist Items Table */}
      <div className="space-y-2">
        {checklist.map((item) => {
          let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800/80';
          if (item.rating === 'DELVIS') badgeColor = 'bg-amber-950 text-amber-300 border-amber-800/80';
          if (item.rating === 'NEI') badgeColor = 'bg-rose-950 text-rose-300 border-rose-800/80';

          return (
            <div
              key={item.criterionId}
              className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] text-slate-500 font-bold">
                    {item.criterionId}
                  </span>
                  {item.isCriticalDomain && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-wider">
                      Kritisk domene
                    </span>
                  )}
                  <span className="font-medium text-slate-200">
                    {item.question}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pl-6">
                  &bull; <em>Begrunnelse:</em> {item.evaluatorNote}
                </p>
              </div>

              <div className="shrink-0 pl-6 sm:pl-0">
                <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold border ${badgeColor}`}>
                  {item.rating}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
