import { Bookmark, X, ArrowUpRight, RefreshCw } from 'lucide-react';
import { CandidateName } from '../types/index.js';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: CandidateName[];
  onInspect: (cand: CandidateName) => void;
  onRecheck: (cand: CandidateName) => void;
  onToggleWatch: (cand: CandidateName) => void;
}

export function WatchlistModal({
  isOpen,
  onClose,
  watchlist,
  onInspect,
  onRecheck,
  onToggleWatch,
}: WatchlistModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Monitored Candidate Watchlist
              </h3>
              <p className="text-xs text-slate-400">
                Persistent brand candidates flagged for continuous risk tracking ({watchlist.length} saved)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {watchlist.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              No candidates currently on your watchlist. Click the bookmark icon on any candidate card to monitor it here.
            </div>
          ) : (
            watchlist.map((cand) => (
              <div
                key={cand.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-base">
                      {cand.name}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      /{cand.pronunciation}/
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                        cand.riskLevel === 'GREEN'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : cand.riskLevel === 'YELLOW'
                          ? 'bg-amber-500/20 text-amber-300'
                          : cand.riskLevel === 'ORANGE'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {cand.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {cand.concept} • Strategy: {cand.namingStrategy}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRecheck(cand)}
                    title="Perform fresh live verification"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onToggleWatch(cand)}
                    title="Remove from Watchlist"
                    className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/40 transition"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => {
                      onInspect(cand);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    <span>Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
