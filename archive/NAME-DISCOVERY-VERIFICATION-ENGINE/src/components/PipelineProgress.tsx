import { CheckCircle2, Loader2, Database, ShieldAlert, Cpu, Globe, Terminal, FileCheck } from 'lucide-react';

interface PipelineProgressProps {
  isRunning: boolean;
}

export function PipelineProgress({ isRunning }: PipelineProgressProps) {
  const steps = [
    { label: 'Multi-Strategy Generation', icon: Cpu },
    { label: 'Normalization & Deduplication', icon: FileCheck },
    { label: 'Brønnøysund & Registries', icon: Database },
    { label: 'EUIPO / WIPO / USPTO', icon: ShieldAlert },
    { label: 'Live RDAP & DNS Domains', icon: Globe },
    { label: 'App Stores & Software', icon: Terminal },
    { label: 'Risk Engine & Ranking', icon: CheckCircle2 },
  ];

  if (!isRunning) return null;

  return (
    <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 text-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          <span className="text-sm font-semibold text-indigo-200">
            Automated Discovery & Multi-Source Verification Pipeline Active
          </span>
        </div>
        <span className="text-xs text-indigo-300 font-mono">
          Screening Live External Sources...
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/80 border border-indigo-500/20 rounded-lg p-2.5 flex flex-col items-center text-center gap-1.5"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium text-slate-300 leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
