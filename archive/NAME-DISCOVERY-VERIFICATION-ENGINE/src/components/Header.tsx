import { ShieldCheck, Plus, Bookmark, History, Search } from 'lucide-react';
import { NamingBrief } from '../types/index.js';

interface HeaderProps {
  projects: NamingBrief[];
  activeProject: NamingBrief | null;
  onSelectProject: (proj: NamingBrief) => void;
  onOpenNewBrief: () => void;
  onOpenWatchlist: () => void;
  onOpenAuditLogs: () => void;
  watchlistCount: number;
}

export function Header({
  projects,
  activeProject,
  onSelectProject,
  onOpenNewBrief,
  onOpenWatchlist,
  onOpenAuditLogs,
  watchlistCount,
}: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and branding */}
        <div className="flex items-center gap-3 min-w-max">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white text-base sm:text-lg">
                NAVNEKLAR
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
                ENGINE v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Navnegransking & foretaksverifisering
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              aria-label="Active Naming Project"
              value={activeProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-slate-800/90 text-xs sm:text-sm text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[180px] sm:max-w-[260px] truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.market})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenNewBrief}
            className="flex items-center gap-1.5 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Naming Brief</span>
            <span className="sm:hidden">New</span>
          </button>

          <button
            onClick={onOpenWatchlist}
            title="View Monitored Names"
            className="flex items-center gap-1 text-xs sm:text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg transition"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Watchlist</span>
            {watchlistCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-semibold">
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenAuditLogs}
            title="View Audit Trail & Security Logs"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
