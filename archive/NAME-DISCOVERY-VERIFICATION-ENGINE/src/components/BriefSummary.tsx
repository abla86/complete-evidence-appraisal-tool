import { Sliders, Play, RefreshCw, Globe, Target, Ban, Compass } from 'lucide-react';
import { NamingBrief } from '../types/index.js';

interface BriefSummaryProps {
  brief: NamingBrief;
  onGenerate: () => void;
  isGenerating: boolean;
  onEditBrief: () => void;
}

export function BriefSummary({ brief, onGenerate, isGenerating, onEditBrief }: BriefSummaryProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm text-slate-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              {brief.entityType}
            </span>
            <span className="px-2.5 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              {brief.market}
            </span>
            <span className="px-2.5 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-300">
              {brief.desiredTone} tone
            </span>
            <span className="px-2.5 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 text-slate-300">
              {brief.desiredLength} length
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {brief.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {brief.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={onEditBrief}
            className="flex items-center gap-1.5 text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition"
          >
            <Sliders className="w-4 h-4" />
            <span>Edit Brief</span>
          </button>

          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating & Screening...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Discovery Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Constraints & Concept Tags */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
        {brief.industry && (
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-300 font-medium">Industry:</span>
            <span>{brief.industry}</span>
          </div>
        )}

        {brief.conceptsToCommunicate && brief.conceptsToCommunicate.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">Concepts:</span>
            <span>{brief.conceptsToCommunicate.join(', ')}</span>
          </div>
        )}

        {brief.wordsToAvoid && brief.wordsToAvoid.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-300 font-medium">Avoided:</span>
            <span className="text-rose-300/80">{brief.wordsToAvoid.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
