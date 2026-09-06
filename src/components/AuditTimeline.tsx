import React from 'react';
import { getAuditTrail } from '../services/auditTrailService';

export const AuditTimeline: React.FC = () => {
  const entries = [...getAuditTrail()].reverse();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">AUDIT TIMELINE</div>
      <h2 className="text-2xl font-bold mt-1">Tidslinje</h2>
      <div className="mt-5 space-y-3">
        {entries.length === 0 ? <div className="text-sm text-slate-500">Ingen hendelser.</div> : entries.map(entry => (
          <article key={entry.entryId} className="relative border-l-2 border-slate-200 pl-4 pb-3 last:pb-0">
            <div className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString('nb-NO')}</div>
            <div className="font-bold text-sm mt-1">{entry.action}</div>
            <div className="text-xs text-slate-600 mt-1">{entry.actor.id} Â· {entry.subject.entityType}:{entry.subject.id}</div>
          </article>
        ))}
      </div>
    </section>
  );
};


