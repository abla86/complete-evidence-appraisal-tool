import React, { useMemo } from 'react';
import { getAuditTrail } from '../services/auditTrailService';

interface Props { reviewerA: string; reviewerB: string; }

export const AuditReviewerCompare: React.FC<Props> = ({ reviewerA, reviewerB }) => {
  const entries = getAuditTrail();
  const a = useMemo(() => entries.filter(e => e.actor.id === reviewerA), [entries.length, reviewerA]);
  const b = useMemo(() => entries.filter(e => e.actor.id === reviewerB), [entries.length, reviewerB]);
  const actions = (items: typeof entries) => new Set(items.map(e => e.action));
  const sharedActions = [...actions(a)].filter(action => actions(b).has(action));

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <div><div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">REVIEWER COMPARISON</div><h2 className="text-2xl font-bold mt-1">Audit-sammenligning</h2></div>
      <div className="grid md:grid-cols-2 gap-4">
        <ReviewerCard name={reviewerA} entries={a} />
        <ReviewerCard name={reviewerB} entries={b} />
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-bold">Felles handlingstyper</div>
        <div className="flex flex-wrap gap-2 mt-2">{sharedActions.length === 0 ? <span className="text-xs text-slate-500">Ingen felles handlingstyper.</span> : sharedActions.map(action => <span key={action} className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px]">{action}</span>)}</div>
      </div>
    </section>
  );
};

function ReviewerCard({ name, entries }: { name: string; entries: ReturnType<typeof getAuditTrail> }) {
  return <div className="rounded-xl border border-slate-200 p-4"><div className="font-bold">{name}</div><div className="text-xs text-slate-500 mt-1">{entries.length} hendelser</div><div className="mt-3 space-y-2 max-h-80 overflow-auto">{entries.length === 0 ? <div className="text-xs text-slate-500">Ingen hendelser.</div> : entries.map(entry => <div key={entry.entryId} className="border-b border-slate-100 pb-2 last:border-0"><div className="text-xs font-semibold">{entry.action}</div><div className="text-[11px] text-slate-500">{new Date(entry.timestamp).toLocaleString('nb-NO')}</div></div>)}</div></div>;
}


