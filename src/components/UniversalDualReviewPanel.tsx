import React, { useMemo, useState } from 'react';
import { getDualReviewSessionView } from '../services/dualReviewViewService';
import { resolveConflict } from '../services/dualReviewService';
import type { UserRole } from '../services/rbacService';

interface Props {
  studyId: string;
  instrumentId: string;
  actorId?: string;
  actorRole?: UserRole;
}

export const UniversalDualReviewPanel: React.FC<Props> = ({
  studyId,
  instrumentId,
  actorId = 'current-user',
  actorRole = 'lead_reviewer',
}) => {
  const view = useMemo(() => getDualReviewSessionView(studyId, instrumentId), [studyId, instrumentId]);
  const [resolution, setResolution] = useState<'consensus' | 'thirdReviewer' | 'autoResolve'>('consensus');
  const [message, setMessage] = useState('');

  if (!view) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-bold">Dual Review</h3>
        <p className="text-sm text-slate-600 mt-1">Det finnes ikke to separate appraisal-sesjoner for dette studiet og instrumentet ennå.</p>
      </section>
    );
  }

  const handleResolve = () => {
    if (actorRole !== 'lead_reviewer' && actorRole !== 'adjudicator' && actorRole !== 'admin') {
      setMessage('Kun hovedgransker, adjudicator eller administrator kan registrere oppløsning.');
      return;
    }

    const reviews = [view.reviewerA, view.reviewerB].map(session => ({
      id: session.id,
      appraisalId: session.id,
      studyId: session.studyId,
      instrumentId: session.instrumentId,
      reviewerId: session.reviewerId,
      status: session.locked ? ('completed' as const) : ('inProgress' as const),
      responses: Object.fromEntries(session.responses.map(item => [String(item.itemId), item.answer])),
      comments: session.responses
        .filter(item => item.rationale.trim())
        .map(item => ({ itemId: String(item.itemId), comment: item.rationale })),
    }));

    const result = resolveConflict(view.reviewerA.id, reviews, actorId, resolution);
    setMessage(`Oppløsning registrert: ${result.disagreements.length} uenighet(er), metode ${resolution}.`);
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">UNIVERSAL DUAL REVIEW</div>
          <h3 className="text-lg font-bold">{instrumentId}</h3>
          <p className="text-xs text-slate-600 mt-1">{view.reviewerA.reviewerId} ↔ {view.reviewerB.reviewerId}</p>
        </div>
        <div className={`px-3 py-2 rounded-xl text-sm font-bold ${view.comparison.requiresArbitration ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          Uenighet: {Math.round(view.comparison.overallDisagreement * 100)}%
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {[view.reviewerA, view.reviewerB].map((reviewer) => (
          <div key={reviewer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-bold">{reviewer.reviewerId}</div>
            <div className="text-[11px] text-slate-500 mt-1">{reviewer.responses.length} svar · {reviewer.locked ? 'Låst' : 'Åpen'}</div>
          </div>
        ))}
      </div>

      {view.comparison.items.filter(item => item.disagreement).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-bold">Konflikter</h4>
          {view.comparison.items.filter(item => item.disagreement).map(item => (
            <div key={item.itemId} className="grid md:grid-cols-3 gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
              <div className="font-bold">Punkt {item.itemId}</div>
              <div>Reviewer A: <strong>{String(item.reviewer1Score ?? '—')}</strong></div>
              <div>Reviewer B: <strong>{String(item.reviewer2Score ?? '—')}</strong></div>
            </div>
          ))}
        </div>
      )}

      {view.comparison.requiresArbitration && (
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <select value={resolution} onChange={e => setResolution(e.target.value as typeof resolution)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white">
            <option value="consensus">Konsensus</option>
            <option value="thirdReviewer">Tredje reviewer</option>
            <option value="autoResolve">Automatisk flertall</option>
          </select>
          <button type="button" onClick={handleResolve} className="rounded-xl bg-teal-800 text-white px-4 py-2 text-sm font-bold">Registrer oppløsning</button>
        </div>
      )}

      {message && <div role="status" className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-slate-800">{message}</div>}
    </section>
  );
};
