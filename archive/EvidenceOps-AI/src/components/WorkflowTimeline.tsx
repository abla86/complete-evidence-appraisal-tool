import React from 'react';
import { 
  FileSearch, 
  Search, 
  Filter, 
  Award, 
  Scale, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2,
  Clock
} from 'lucide-react';
import { EvidencePipelineSession } from '../types';

interface WorkflowTimelineProps {
  session: EvidencePipelineSession;
  onSelectStep: (step: number) => void;
  selectedStep: number;
}

const STEPS_META = [
  {
    step: 1,
    title: '1. PICO Definisjon',
    agent: 'PICO Specialist Agent',
    icon: FileSearch,
    desc: 'Populasjon, intervensjon, kontroll & utfall',
  },
  {
    step: 2,
    title: '2. Søkestrategi',
    agent: 'Search Strategy Agent',
    icon: Search,
    desc: 'Boolske termer, MeSH & databaser',
  },
  {
    step: 3,
    title: '3. Treff & PRISMA',
    agent: 'Retrieval & Deduplication',
    icon: Filter,
    desc: 'Henting, duplikatsjekk & tittel/abstrakt-screening',
  },
  {
    step: 4,
    title: '4. Kritisk vurdering',
    agent: 'Appraisal Agent',
    icon: Award,
    desc: 'CASP RCT & AMSTAR-2 sjekklister',
  },
  {
    step: 5,
    title: '5. GRADE Evidens',
    agent: 'Evidence Agent',
    icon: Scale,
    desc: 'Summary of Findings & evidensstyrke',
  },
  {
    step: 6,
    title: '6. Menneskelig kontroll',
    agent: 'Human Gatekeeper',
    icon: ShieldAlert,
    desc: 'Obligatorisk faglig godkjenning & sign-off',
  },
];

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  session,
  onSelectStep,
  selectedStep,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-medium">
        <span>AGENT-ARBEIDSFLYT & SIKKERHETSKONTROLLER</span>
        <span>
          {session.status === 'WAITING_FOR_HUMAN_APPROVAL' ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Stoppet for faglig godkjenning
            </span>
          ) : session.status === 'APPROVED_AND_FINALIZED' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fullført & Autorisert
            </span>
          ) : session.status === 'PROCESSING' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Eksekverer agent...
            </span>
          ) : (
            <span>Klar til start</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STEPS_META.map((item) => {
          const Icon = item.icon;
          const isCompleted = session.currentStep > item.step || (item.step === 6 && session.humanApproval.isApproved);
          const isCurrent = session.currentStep === item.step;
          const isSelected = selectedStep === item.step;
          const isPendingCheckpoint = item.step === 6 && session.status === 'WAITING_FOR_HUMAN_APPROVAL';

          let stateColor = 'border-slate-800 bg-slate-950/40 text-slate-500';
          let iconColor = 'text-slate-500';

          if (isPendingCheckpoint) {
            stateColor = 'border-amber-500 bg-amber-950/30 text-amber-200 ring-2 ring-amber-500/30 animate-pulse';
            iconColor = 'text-amber-400';
          } else if (isCompleted) {
            stateColor = 'border-emerald-700/60 bg-emerald-950/20 text-slate-200';
            iconColor = 'text-emerald-400';
          } else if (isCurrent) {
            stateColor = 'border-emerald-500 bg-slate-800 text-white ring-2 ring-emerald-500/20';
            iconColor = 'text-emerald-400';
          }

          return (
            <button
              key={item.step}
              type="button"
              onClick={() => onSelectStep(item.step)}
              disabled={session.currentStep < item.step && !isCompleted}
              className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden flex flex-col justify-between ${stateColor} ${
                isSelected ? 'ring-2 ring-white/20' : ''
              } ${session.currentStep < item.step && !isCompleted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-600'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-md bg-slate-900 border border-slate-700/60">
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold leading-snug">{item.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.agent}</p>
              </div>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
