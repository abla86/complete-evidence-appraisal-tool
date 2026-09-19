import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Share2,
  HeartPulse,
  ShieldAlert,
  Bot,
  TerminalSquare,
  Layers,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  GitBranch,
  X
} from 'lucide-react';
import { ModuleId, PluginMeta, ProjectContext, UserRole } from '../types';

interface SidebarProps {
  currentModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  project: ProjectContext;
  plugins: PluginMeta[];
  userRole: UserRole;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  citationCount: number;
  syntheticEventCount: number;
}

interface NavItemConfig {
  id: ModuleId;
  label: string;
  badge?: string | number;
  badgeColor?: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  project,
  plugins,
  userRole,
  isMobileOpen,
  onCloseMobile,
  citationCount,
  syntheticEventCount
}) => {
  const navItems: NavItemConfig[] = [
    {
      id: 'overview',
      label: 'Portfolio Hub',
      icon: LayoutDashboard
    },
    {
      id: 'evidence-review',
      label: 'Litteratur & PRISMA',
      badge: '2020',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: BookOpen
    },
    {
      id: 'papers',
      label: 'Evidensregister',
      badge: citationCount,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: FileText
    },
    {
      id: 'knowledge-graph',
      label: 'Knowledge Graph OS',
      badge: 'v2.1',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Share2
    },
    {
      id: 'health-flow',
      label: 'Health Flow Lab',
      badge: `${syntheticEventCount} hendelser`,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: HeartPulse
    },
    {
      id: 'architecture',
      label: 'Arkitektur & 15 Sikkerhetslag',
      badge: '15 lag',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: ShieldAlert
    },
    {
      id: 'ai-assistant',
      label: 'AI Research Assistant',
      badge: 'Prompt Guard',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      icon: Bot
    },
    {
      id: 'devops-audit',
      label: 'DevOps & Audit Trail',
      badge: 'CI / Log',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: TerminalSquare
    }
  ];

  const handleNavClick = (id: ModuleId) => {
    onSelectModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>ResearchForge</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.5 rounded">
                  OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Enterprise Portfolio System
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Project & Tenant Card */}
        <div className="p-3.5 mx-3 mt-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Aktivt Prosjekt</span>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              {project.version}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-200 line-clamp-1" title={project.name}>
            {project.name}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="font-mono truncate max-w-[120px]">{project.tenantId}</span>
            </div>
            <span className="text-[10px] text-blue-400 font-medium">Isolert</span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Kjernemoduler & Plugins
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Plugin Engine Micro-Status */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 px-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Plugin Sandbox ({plugins.length})
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">ALL ONLINE</span>
            </div>

            <div className="space-y-1.5">
              {plugins.slice(0, 4).map((plug) => (
                <div
                  key={plug.id}
                  className="flex items-center justify-between text-[11px] bg-slate-800/40 px-2 py-1.5 rounded-lg border border-slate-800"
                >
                  <span className="text-slate-300 font-medium truncate max-w-[140px]">
                    {plug.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono text-slate-400">v{plug.version}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom User Profile & GitHub signal */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs">
                AB
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Anne Beth Andersen</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {userRole === 'FOUNDER' ? '👑 Founder & Lead PI' : userRole}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <span>CI / GitHub Verified</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Passing
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
