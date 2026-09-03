import React, { useMemo } from 'react';
import { getAuditTrail } from '../services/auditTrailService';

export const AuditAnalyticsDashboard: React.FC = () => {
  const entries = getAuditTrail();
  const analytics = useMemo(() => {
    const byAction = new Map<string, number>();
    const byActor = new Map<string, number>();
    for (const entry of entries) {
      byAction.set(entry.action, (byAction.get(entry.action) ?? 0) + 1);
      byActor.set(entry.actor.id, (byActor.get(entry.actor.id) ?? 0) + 1);
    }
    return {
      total: entries.length,
      actions: [...byAction.entries()].sort((a, b) => b[1] - a[1]),
      actors: [...byActor.entries()].sort((a, b) => b[1] - a[1]),
      latest: [...entries].reverse().slice(0, 10),
    };
  }, [entries.length]);

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">AUDIT ANALYTICS</div>
        <h2 className="text-2xl font-bold mt-1">Audit-analyse</h2>
        <p className="text-sm text-slate-600 mt-1">Samme canonical audit-kilde som revisjonssporet.</p>
      </header>
      <div className="grid md:grid-cols-3 gap-3">
        <Metric label="Hendelser" value={String(analytics.total)} />
        <Metric label="Handlingstyper" value={String(analytics.actions.length)} />
        <Metric label="Aktører" value={String(analytics.actors.length)} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Hendelser per handling">
          {analytics.actions.map(([action, count]) => <Row key={action} label={action} value={count} total={analytics.total} />)}
        </Panel>
        <Panel title="Hendelser per aktør">
          {analytics.actors.map(([actor, count]) => <Row key={actor} label={actor} value={count} total={analytics.total} />)}
        </Panel>
      </div>
      <Panel title="Siste hendelser">
        {analytics.latest.length === 0 ? <div className="text-sm text-slate-500">Ingen audit-hendelser.</div> : analytics.latest.map(entry => (
          <div key={entry.entryId} className="border-b border-slate-100 py-3 last:border-0">
            <div className="font-semibold text-sm">{entry.action}</div>
            <div className="text-xs text-slate-500 mt-1">{entry.actor.id} · {new Date(entry.timestamp).toLocaleString('nb-NO')}</div>
            <div className="text-xs text-slate-500 mt-1">{entry.subject.entityType}:{entry.subject.id}</div>
          </div>
        ))}
      </Panel>
    </section>
  );
};

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="text-2xl font-bold mt-1">{value}</div></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold mb-3">{title}</h3><div className="space-y-1">{children}</div></section>;
}

function Row({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total > 0 ? Math.max(4, Math.round((value / total) * 100)) : 0;
  return <div className="py-2"><div className="flex justify-between gap-3 text-xs"><span className="truncate">{label}</span><strong>{value}</strong></div><div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-teal-700" style={{ width: `${width}%` }} /></div></div>;
}
