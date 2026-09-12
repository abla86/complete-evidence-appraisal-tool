import React from 'react';
import { Activity, ShieldCheck, FileCheck2, Sparkles, Terminal, RefreshCw, Layers } from 'lucide-react';
import { EvidencePipelineSession } from '../types';

interface NavbarProps {
  session: EvidencePipelineSession;
  onReset: () => void;
  onOpenArchitectureModal?: () => void;
  activeTab: 'pipeline' | 'architecture' | 'audit' | 'report';
  setActiveTab: (tab: 'pipeline' | 'architecture' | 'audit' | 'report') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  onReset,
  activeTab,
  setActiveTab,
}) => {
  const isAwaitingApproval = session.status === 'WAITING_FOR_HUMAN_APPROVAL';
  const isApproved = session.status === 'APPROVED_AND_FINALIZED';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
              <Layers className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  Evidence<span className="text-emerald-400">Ops</span>
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded-full tracking-wide">
                  AI AGENT PLATFORM
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Kunnskapsbasert praksis &bull; PICO &bull; PubMed &bull; CASP &bull; AMSTAR-2 &bull; GRADE
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/70 text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'pipeline'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Arbeidsflyt</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agent-arkitektur</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              disabled={session.currentStep < 5}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'report'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : session.currentStep < 5
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Beslutningsgrunnlag</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'audit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Audit Logg ({session.auditTrail.length})</span>
            </button>
          </nav>

          {/* Right Status Badge & Reset */}
          <div className="flex items-center space-x-3">
            {isAwaitingApproval && (
              <span className="animate-pulse inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>
                Venter på godkjenning
              </span>
            )}

            {isApproved && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Faglig godkjent
              </span>
            )}

            <button
              onClick={onReset}
              title="Nullstill og start ny analyse"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
