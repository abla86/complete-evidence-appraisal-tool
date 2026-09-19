import React from 'react';
import {
  ShieldCheck,
  BookOpen,
  Share2,
  HeartPulse,
  Bot,
  Terminal,
  Layers,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Database,
  Lock,
  Zap,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { ModuleId, ProjectContext, UserRole } from '../../types';

interface OverviewModuleProps {
  project: ProjectContext;
  userRole: UserRole;
  onNavigate: (module: ModuleId) => void;
  onRunDemo: () => void;
  isDemoRunning: boolean;
  demoOutput: string;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({
  project,
  userRole,
  onNavigate,
  onRunDemo,
  isDemoRunning,
  demoOutput
}) => {
  const cards = [
    {
      id: 'evidence-review' as ModuleId,
      title: 'Evidence Review (PRISMA 2020)',
      icon: BookOpen,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Forskningsmetode',
      desc: 'PICO-arkitektur, søkestreng-generator, 4-trinns PRISMA flow og kvalitetsvurdering (RoB 2).'
    },
    {
      id: 'knowledge-graph' as ModuleId,
      title: 'Knowledge Graph OS',
      icon: Share2,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Grafmodellering',
      desc: 'Koble artikler, forfattere, kliniske metoder og funn i en interaktiv SVG relasjonsgraf.'
    },
    {
      id: 'health-flow' as ModuleId,
      title: 'Health Flow Simulator',
      icon: HeartPulse,
      color: 'from-rose-600 to-pink-600',
      badge: 'Syntetisk EPJ',
      desc: 'Simuler pasientforløp (Henvisning 🡒 Triage 🡒 Poliklinikk 🡒 Utskrivelse) med hendelsessporing.'
    },
    {
      id: 'architecture' as ModuleId,
      title: 'Arkitektur & 15 Sikkerhetslag',
      icon: ShieldCheck,
      color: 'from-amber-600 to-orange-600',
      badge: 'Enterprise Security',
      desc: '15 lag fra Tenant-isolasjon og AES-kryptering til Founder-beskyttelse og Plugin Sandbox.'
    },
    {
      id: 'ai-assistant' as ModuleId,
      title: 'AI Assistant & Prompt Guard',
      icon: Bot,
      color: 'from-purple-600 to-indigo-600',
      badge: 'Cost Firewall',
      desc: 'Strukturerte prompter med streng systemavgrensning og automatisk kostnadsbrannmur.'
    },
    {
      id: 'devops-audit' as ModuleId,
      title: 'DevOps & Uforanderlig Audit',
      icon: Terminal,
      color: 'from-slate-700 to-slate-900',
      badge: 'CI/CD & Governance',
      desc: 'Kryptografisk revisjonsspor (SHA-256), GitHub Actions status og sanntids Feature Flags.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" /> PORTFOLIO FLAGSHIP OS
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% Syntetisk Helsedata
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Founder Mode: {userRole === 'FOUNDER' ? 'Anne Beth Andersen' : userRole}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            ResearchForge OS
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Ett sammenhengende og sikkert økosystem som demonstrerer moden arkitekturkompetanse:
            forskningsmetodikk (PRISMA 2020 / PICO), helseinformatikk med syntetiske kliniske stier,
            kunnskapsgrafer, 15 lag med enterprise SaaS-sikkerhet, og produksjonsklar DevOps.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-run-full-demo"
              onClick={onRunDemo}
              disabled={isDemoRunning}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              {isDemoRunning ? 'Kjører sikker verifikasjon...' : 'Kjør Komplett Sikkerhets- & Datademo'}
            </button>
            <button
              id="btn-nav-to-evidence"
              onClick={() => onNavigate('evidence-review')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex items-center gap-2 transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              Åpne PRISMA Review
            </button>
          </div>
        </div>
      </section>

      {/* Live System Metrics Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> Plugins Lastet
          </div>
          <div className="text-2xl font-black text-white">6 / 6</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <CheckCircle className="w-3 h-3" /> Sandboxed & Online
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" /> Sikkerhetsmodell
          </div>
          <div className="text-2xl font-black text-white">15 Lag</div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-tenant + Founder</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Datamodus
          </div>
          <div className="text-2xl font-black text-white">Syntetisk</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" /> GDPR & Normen sikret
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Cost Firewall
          </div>
          <div className="text-2xl font-black text-white">$2.40 / $20</div>
          <div className="text-[11px] text-blue-400 font-medium mt-1">88% restkvote i dag</div>
        </div>
      </section>

      {/* Interactive Demo Terminal Output */}
      {demoOutput && (
        <section className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Demo Output (Mock Event Bus & Tenant Enforcer)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Exit Code: 0 (SUCCESS)</span>
          </div>
          <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap p-2 bg-slate-900 rounded-lg">
            {demoOutput}
          </pre>
        </section>
      )}

      {/* Module Navigation Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white tracking-tight">
            Plattformens Modularkitektur
          </h3>
          <span className="text-xs text-slate-400">
            Klikk for å utforske de enkelte fagområdene
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigate(card.id)}
                className="group p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                      {card.badge}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Åpne modul</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture Highlights & GitHub Signals */}
      <section className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          Hvorfor ResearchForge OS imponerer på GitHub & i arbeidslivet
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" /> Ekte Forskingsmetode
            </div>
            <p className="text-slate-400 leading-relaxed">
              Ikke bare en generisk CRUD-app, men full implementasjon av PRISMA 2020 flytskjema, PICO-protokoller, søkesyntaks og RoB 2 vurderinger.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-400" /> Helseinformatikk & GDPR
            </div>
            <p className="text-slate-400 leading-relaxed">
              Demonstrerer pasientforløp med strenge personverngrenser og kun matematisk syntetiske data – trygt for åpen kildekode.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> 15 Sikkerhetslag & Budsjettsperre
            </div>
            <p className="text-slate-400 leading-relaxed">
              Løser den reelle bedriftsutfordringen: multi-tenancy, uforanderlige revisjonslogger, prompt injection-forsvar og kostnadsbrannmur.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
