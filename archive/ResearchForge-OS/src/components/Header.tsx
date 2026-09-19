import React from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  Search,
  Bell,
  Download,
  Terminal,
  Activity,
  UserCheck
} from 'lucide-react';
import { ModuleId, UserRole } from '../types';

interface HeaderProps {
  currentModule: ModuleId;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  tenantId: string;
  costSpend: number;
  costLimit: number;
  onOpenQuickAction: (action: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleMobileMenu: () => void;
}

const MODULE_TITLES: Record<ModuleId, { title: string; subtitle: string; category: string }> = {
  overview: {
    title: 'ResearchForge OS • Oversikt',
    subtitle: 'Modulær forskningsplattform med evidensgjennomgang, helseinformatikk og sikker SaaS-arkitektur',
    category: 'Portefølje Hub'
  },
  'evidence-review': {
    title: 'Litteraturgjennomgang & PRISMA 2020',
    subtitle: 'PICO-arkitektur, søkestrategi, screening og kvalitetsvurdering (RoB 2)',
    category: 'Evidenssyntese'
  },
  papers: {
    title: 'Evidensregister & Artikkeldatabase',
    subtitle: 'Strukturert forskningsbibliotek med DOI-verifikasjon og syntetiske vedlegg',
    category: 'Databehandling'
  },
  'knowledge-graph': {
    title: 'Knowledge Graph OS',
    subtitle: 'Interaktiv relasjonsgraf: Artikler ↔ Forfattere ↔ Konsepter ↔ Metoder',
    category: 'Kunnskapsmodellering'
  },
  'health-flow': {
    title: 'Health Flow Simulator (Klinisk Forløp)',
    subtitle: 'Syntetisk pasientforløp, hendelsesstrøm og EPJ-revisjonsspor (100% syntetisk data)',
    category: 'Helsedomene'
  },
  architecture: {
    title: 'Systemarkitektur & 15-Lags Sikkerhet',
    subtitle: 'ADR-er, trusselmodell, multi-tenancy, kryptering og Founder-beskyttelse',
    category: 'Arkitektur & Sikkerhet'
  },
  'ai-assistant': {
    title: 'AI Research Assistant & Prompt Guard',
    subtitle: 'Strukturert evidensanalyse, PICO-ekstraksjon og budsjettvern (Cost Firewall)',
    category: 'AI Engineering'
  },
  'devops-audit': {
    title: 'DevOps, Audit Trail & Feature Flags',
    subtitle: 'Kryptografisk revisjonsspor, CI/CD-rørledning, versjonshistorikk og utrulling',
    category: 'Drift & Plattform'
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  userRole,
  onRoleChange,
  tenantId,
  costSpend,
  costLimit,
  onOpenQuickAction,
  searchQuery,
  onSearchChange,
  onToggleMobileMenu
}) => {
  const currentInfo = MODULE_TITLES[currentModule];
  const spendPercentage = Math.min(100, Math.round((costSpend / costLimit) * 100));

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 sm:px-6 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Mobile trigger + Title & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            id="btn-mobile-nav"
            onClick={onToggleMobileMenu}
            aria-label="Åpne meny"
            className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Terminal className="w-5 h-5 text-blue-400" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <span>{currentInfo.category}</span>
              <span>/</span>
              <span className="text-slate-400">{tenantId}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {currentInfo.title}
              {userRole === 'FOUNDER' && (
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  Founder Mode
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Right: Quick Search, Status Indicators & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-between lg:justify-end">
          {/* Quick Search */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-global-search"
              type="text"
              placeholder="Søk i evidens, graf, logger..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cost Firewall Status */}
          <div
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300"
            title="Cost Firewall: Overvåker sanntids AI tokenforbruk for å unngå uforutsette kostnader"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-slate-400">AI Budsjett:</span>
              <span className="font-mono font-semibold text-slate-200">
                ${costSpend.toFixed(2)} / ${costLimit.toFixed(2)}
              </span>
            </div>
            <div className="w-14 bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  spendPercentage > 85 ? 'bg-rose-500' : spendPercentage > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${spendPercentage}%` }}
              />
            </div>
          </div>

          {/* Audit Logging Active Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-medium"
            title="Uforanderlig revisjonslogg med kryptografisk hash-kjede er aktiv"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px]">Audit Active</span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg p-1 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              id="select-user-role"
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="FOUNDER" className="bg-slate-800 text-white">
                Rolle: Founder (Anne)
              </option>
              <option value="PRINCIPAL_INVESTIGATOR" className="bg-slate-800 text-white">
                Rolle: Principal Investigator (PI)
              </option>
              <option value="REVIEWER" className="bg-slate-800 text-white">
                Rolle: Reviewer
              </option>
              <option value="AUDITOR" className="bg-slate-800 text-white">
                Rolle: Revisor / Auditor
              </option>
            </select>
          </div>

          {/* Quick Actions */}
          <button
            id="btn-export-report"
            onClick={() => onOpenQuickAction('export')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:shadow transition-all"
            title="Eksporter PRISMA-protokoll eller revisjonsrapport"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eksporter</span>
          </button>
        </div>
      </div>
    </header>
  );
};
