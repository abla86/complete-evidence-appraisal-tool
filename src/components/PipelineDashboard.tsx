import React, { useMemo, useState } from 'react';
import { EvidencePipelineService, type EvidencePipelineStage, type EvidencePipelineState } from '../services/evidencePipelineService';
import type { UserRole } from '../services/rbacService';

interface Props {
  projectId: string;
  actor: { id: string; role: UserRole };
  initialState?: EvidencePipelineState;
  onStateChange?: (state: EvidencePipelineState) => void;
}

const stages: EvidencePipelineStage[] = [
  'identification', 'screening', 'fulltext', 'appraisal', 'dual_review',
  'consensus', 'extraction', 'synthesis', 'certainty', 'reporting', 'export',
];

const labels: Record<EvidencePipelineStage, string> = {
  identification: 'Identifikasjon',
  screening: 'Screening',
  fulltext: 'Fulltekst',
  appraisal: 'Appraisal',
  dual_review: 'Dual review',
  consensus: 'Konsensus',
  extraction: 'Ekstraksjon',
  synthesis: 'Syntese',
  certainty: 'GRADE / CERQual',
  reporting: 'Rapportering',
  export: 'Eksport',
};

export const PipelineDashboard: React.FC<Props> = ({ projectId, actor, initialState, onStateChange }) => {
  const service = useMemo(() => new EvidencePipelineService(), []);
  const [state, setState] = useState<EvidencePipelineState>(() => initialState ?? service.create(projectId));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const currentIndex = stages.indexOf(state.currentStage);
  const advance = async (nextStage: EvidencePipelineStage) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const next = await service.transition(state, nextStage, actor, `UI: overgang til ${labels[nextStage]}`);
      setState(next);
      onStateChange?.(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pipeline-overgang feilet.');
    } finally {
      setBusy(false);
    }
  };

  const nextStage = stages[currentIndex + 1];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">EVIDENCE PIPELINE</div>
          <h2 className="text-xl font-bold">Prosjektflyt</h2>
          <p className="text-xs text-slate-500 mt-1">Prosjekt {projectId} · versjon {state.version}</p>
        </div>
        <div className="px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm font-bold">
          {labels[state.currentStage]}
        </div>
      </div>

      <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-2">
        {stages.map((stage, index) => {
          const checkpoint = state.checkpoints.find(item => item.stage === stage);
          const active = stage === state.currentStage;
          const complete = checkpoint?.status === 'completed' || index < currentIndex;
          return (
            <div key={stage} className={`rounded-xl border p-3 ${active ? 'border-teal-600 bg-teal-50' : complete ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">{index + 1}</div>
              <div className="text-xs font-bold mt-1">{labels[stage]}</div>
              <div className="text-[10px] mt-1 text-slate-500">{checkpoint?.actorId || '—'}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <button
          type="button"
          disabled={!nextStage || busy}
          onClick={() => nextStage && advance(nextStage)}
          className="rounded-xl bg-teal-800 disabled:opacity-40 text-white px-4 py-2 text-sm font-bold"
        >
          {nextStage ? `Gå til ${labels[nextStage]}` : 'Pipeline ferdig'}
        </button>
        <span className="text-xs text-slate-500">RBAC + audit brukes ved overgang.</span>
      </div>

      {state.checkpoints.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">Arbeidslogg</h3>
          <div className="max-h-56 overflow-auto space-y-1">
            {state.checkpoints.map((item, index) => (
              <div key={`${item.stage}-${index}`} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-slate-50 text-xs">
                <span className="font-semibold min-w-24">{labels[item.stage]}</span>
                <span className="text-slate-500">{new Date(item.updatedAt).toLocaleString('no-NO')}</span>
                <span className="text-slate-600">{item.actorId}</span>
                <span className="ml-auto">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <div role="status" className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-900">{message}</div>}
    </section>
  );
};
