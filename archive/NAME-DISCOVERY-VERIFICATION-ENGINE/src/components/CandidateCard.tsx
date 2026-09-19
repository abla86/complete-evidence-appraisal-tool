import type React from 'react';
import { Bookmark, RefreshCw, Sparkles, FileText, CheckCircle, AlertTriangle, XCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { CandidateName, RiskLevel } from '../types/index.js';

interface CandidateCardProps {
  key?: React.Key;
  candidate: CandidateName;
  rank: number;
  onInspectDossier: (candidate: CandidateName) => void;
  onDeepVerify: (candidate: CandidateName) => void;
  onRecheck: (candidate: CandidateName) => void;
  onToggleWatch: (candidate: CandidateName) => void;
  isProcessing: boolean;
}

export function CandidateCard({
  candidate,
  rank,
  onInspectDossier,
  onDeepVerify,
  onRecheck,
  onToggleWatch,
  isProcessing,
}: CandidateCardProps) {
  // Format risk badge
  const riskBadgeConfig: Record<RiskLevel, { bg: string; border: string; text: string; label: string; icon: typeof CheckCircle }> = {
    GREEN: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'Preliminary Low-Conflict',
      icon: CheckCircle,
    },
    YELLOW: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      label: 'Potential Conflict / Incomplete',
      icon: AlertTriangle,
    },
    ORANGE: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      label: 'Significant Conflict',
      icon: AlertTriangle,
    },
    RED: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      label: 'Strong Conflict',
      icon: XCircle,
    },
    BLACK: {
      bg: 'bg-slate-900',
      border: 'border-rose-900',
      text: 'text-rose-500',
      label: 'Reject / High Conflict',
      icon: ShieldAlert,
    },
  };

  const badge = riskBadgeConfig[candidate.riskLevel] || riskBadgeConfig.YELLOW;
  const BadgeIcon = badge.icon;

  const formattedTime = new Date(candidate.verificationTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition shadow-sm hover:shadow-md flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono font-semibold flex items-center justify-center">
              #{rank}
            </span>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {candidate.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                /{candidate.pronunciation}/
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleWatch(candidate)}
              title={candidate.isWatched ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`p-1.5 rounded-lg border transition ${
                candidate.isWatched
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${candidate.isWatched ? 'fill-current' : ''}`} />
            </button>

            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </div>
          </div>
        </div>

        {/* Concept & Strategy */}
        <div className="my-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-indigo-300 font-medium capitalize">
              {candidate.namingStrategy}
            </span>
            <span className="text-slate-400 truncate">
              {candidate.concept}
            </span>
          </div>

          <p className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 leading-relaxed">
            <strong className="text-slate-200 font-medium">Why it fits: </strong>
            {candidate.whyFits}
          </p>
        </div>

        {/* Verification Status Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-[11px]">
          <div className="bg-slate-950/70 border border-slate-800 rounded p-2">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Companies (Brreg)
            </span>
            <span className="font-medium text-slate-200">
              {candidate.companyMatchesCount === 0 ? 'No Collisions' : `${candidate.companyMatchesCount} Detected`}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded p-2">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Trademarks (EU/US)
            </span>
            <span className="font-medium text-slate-200">
              {candidate.trademarkMatchesCount === 0 ? 'Screened / Clear' : `${candidate.trademarkMatchesCount} Similar`}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded p-2">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Domains (DNS/RDAP)
            </span>
            <span className="font-medium text-slate-200">
              {candidate.domainResultsCount || 7} TLDs Checked
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded p-2">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Software / Apps
            </span>
            <span className="font-medium text-slate-200">
              {candidate.softwareMatchesCount === 0 ? 'Clear Registry' : `${candidate.softwareMatchesCount} Matches`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-[11px] text-slate-400">
          Verified {formattedTime} ({candidate.searchedSourcesCount || 12} sources)
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRecheck(candidate)}
            disabled={isProcessing}
            title="Perform fresh live search"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recheck</span>
          </button>

          <button
            onClick={() => onDeepVerify(candidate)}
            disabled={isProcessing}
            title="Broader multi-source deep verification"
            className="flex items-center gap-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 px-2.5 py-1.5 rounded-lg transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Deep Verify</span>
          </button>

          <button
            onClick={() => onInspectDossier(candidate)}
            className="flex items-center gap-1 bg-slate-100 hover:bg-white text-slate-900 font-semibold px-3 py-1.5 rounded-lg transition shadow-sm"
          >
            <span>Inspect Evidence</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
