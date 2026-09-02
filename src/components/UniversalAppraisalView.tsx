import React, { useMemo, useState } from 'react';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import {
  createBlankAppraisalSession,
  decideAppraisalLaunch,
  lockAppraisalSession,
  upsertAppraisalResponse,
  validateAppraisalSession,
  type AppraisalSession,
} from '../services/universalAppraisalService';

interface Props {
  studyId: string;
  studyDesign: string;
  initialInstrumentId?: string;
  reviewerId?: string;
  onSaved?: (session: AppraisalSession) => void;
}

export const UniversalAppraisalView: React.FC<Props> = ({
  studyId,
  studyDesign,
  initialInstrumentId = 'jbi-qualitative-2017',
  reviewerId = 'current-user',
  onSaved,
}) => {
  const initialDecision = useMemo(() => decideAppraisalLaunch(studyDesign, initialInstrumentId), [studyDesign, initialInstrumentId]);
  const [instrumentId, setInstrumentId] = useState(initialDecision.instrument?.id ?? MASTER_INSTRUMENTS_REGISTRY[0]?.id ?? '');
  const [session, setSession] = useState<AppraisalSession>(() => createBlankAppraisalSession(studyId, instrumentId, reviewerId));
  const [notice, setNotice] = useState('');

  const instrument = MASTER_INSTRUMENTS_REGISTRY.find(item => item.id === instrumentId);
  const validation = validateAppraisalSession(session);

  const changeInstrument = (id: string) => {
    const decision = decideAppraisalLaunch(studyDesign, id);
    setNotice(decision.warnings.join(' ') || decision.reason);
    setInstrumentId(id);
    setSession(createBlankAppraisalSession(studyId, id, reviewerId));
  };

  const answer = (itemId: number, value: string) => {
    setSession(prev => upsertAppraisalResponse(prev, {
      itemId,
      answer: value,
      rationale: prev.responses.find(r => String(r.itemId) === String(itemId))?.rationale || '',
    }));
  };

  const rationale = (itemId: number, value: string) => {
    setSession(prev => upsertAppraisalResponse(prev, {
      itemId,
      answer: prev.responses.find(r => String(r.itemId) === String(itemId))?.answer ?? null,
      rationale: value,
      evidence: prev.responses.find(r => String(r.itemId) === String(itemId))?.evidence,
    }));
  };

  const evidence = (itemId: number, field: 'quote' | 'page' | 'section', value: string) => {
    setSession(prev => {
      const existing = prev.responses.find(r => String(r.itemId) === String(itemId));
      return upsertAppraisalResponse(prev, {
        itemId,
        answer: existing?.answer ?? null,
        rationale: existing?.rationale ?? '',
        evidence: { ...(existing?.evidence ?? {}), [field]: value },
      });
    });
  };

  const finalize = () => {
    if (!validation.valid) {
      setNotice(validation.issues.join(' '));
      return;
    }
    const locked = lockAppraisalSession(session);
    setSession(locked);
    onSaved?.(locked);
    setNotice('Vurderingen er ferdig kontrollert og låst. Historikken skal beholdes; senere endringer opprettes som ny versjon.');
  };

  return (
    <section className="space-y-5 pb-16">
      <header className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Evidence Appraisal</div>
            <h2 className="text-2xl font-bold font-serif">Metodisk vurdering</h2>
            <p className="text-sm text-slate-600 mt-1">Studiedesign: {studyDesign || 'ikke registrert'}</p>
          </div>
          <select value={instrumentId} onChange={e => changeInstrument(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm max-w-full">
            {MASTER_INSTRUMENTS_REGISTRY.map(item => <option key={item.id} value={item.id}>{item.shortName} · {item.version}</option>)}
          </select>
        </div>
        {notice && <div role="status" className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">{notice}</div>}
      </header>

      {!instrument ? <div className="bg-white border border-rose-200 rounded-2xl p-6 text-rose-900">Valgt instrument finnes ikke.</div> : <>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="text-sm font-bold">{instrument.name}</div>
          <div className="text-xs text-slate-500 mt-1">{instrument.purpose}</div>
          <div className="text-xs mt-2">Versjon {instrument.version} · {instrument.itemCount} punkter · {instrument.verificationStatus}</div>
        </div>

        <div className="space-y-3">
          {(instrument.questions ?? []).map((q) => {
            const response = session.responses.find(r => String(r.itemId) === String(q.id));
            return <article key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold">{q.shortTitle}</div><div className="text-sm font-medium mt-1">{q.officialQuestion || q.questionText}</div></div><span className="text-[10px] px-2 py-1 rounded-full bg-slate-100">{q.domainTitle || q.categoryTitle || q.domain || 'Vurderingspunkt'}</span></div>
              <div className="flex flex-wrap gap-2">
                {(instrument.allowedAnswers ?? ['Ja', 'Nei', 'Uklart', 'Ikke relevant']).map(option => <button key={String(option)} type="button" onClick={() => answer(q.id, String(option))} className={`px-3 py-2 rounded-xl border text-xs font-semibold ${response?.answer === option ? 'bg-teal-800 text-white border-teal-800' : 'bg-white border-slate-300 text-slate-700'}`}>{String(option)}</button>)}
              </div>
              <textarea value={response?.rationale ?? ''} onChange={e => rationale(q.id, e.target.value)} rows={2} placeholder="Begrunn vurderingen…" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <div className="grid md:grid-cols-3 gap-2">
                <input value={response?.evidence?.quote ?? ''} onChange={e => evidence(q.id, 'quote', e.target.value)} placeholder="Evidens/sitat" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                <input value={response?.evidence?.page ?? ''} onChange={e => evidence(q.id, 'page', e.target.value)} placeholder="Side" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
                <input value={response?.evidence?.section ?? ''} onChange={e => evidence(q.id, 'section', e.target.value)} placeholder="Seksjon/tabell/figur" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
              </div>
            </article>;
          })}
        </div>

        <footer className={`sticky bottom-4 rounded-2xl border p-4 shadow-lg ${validation.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm"><strong>{session.responses.length}/{instrument.questions?.length ?? 0}</strong> punkter besvart · {validation.valid ? 'klar for låsing' : validation.issues.join(' ')}</div>
            <button type="button" disabled={!validation.valid || session.locked} onClick={finalize} className="px-4 py-2 rounded-xl bg-teal-800 disabled:opacity-40 text-white text-xs font-bold">{session.locked ? 'Låst vurdering' : 'Fullfør og lås vurdering'}</button>
          </div>
        </footer>
      </>}
    </section>
  );
};
