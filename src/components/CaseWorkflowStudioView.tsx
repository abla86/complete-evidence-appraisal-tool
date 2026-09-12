import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, Clock3, Plus, UserRound } from 'lucide-react';
import { DEFAULT_STAGES, addCaseNote, assignCase, createCase, loadCases, saveCases, transitionCase, type CasePriority, type WorkflowCase } from '../services/caseWorkflowService';

const ASSIGNEES = ['Unassigned', 'Lead reviewer', 'Clinical reviewer', 'Methodologist', 'Research coordinator'];

function dueLabel(dueAt: string) {
  const ms = new Date(dueAt).getTime() - Date.now();
  if (ms < 0) return 'SLA breached';
  const hours = Math.max(1, Math.round(ms / 36e5));
  return `${hours}h remaining`;
}

export const CaseWorkflowStudioView: React.FC = () => {
  const [cases, setCases] = useState<WorkflowCase[]>(() => loadCases());
  const [selectedId, setSelectedId] = useState<string>(() => cases[0]?.id || '');
  const [title, setTitle] = useState('New evidence appraisal case');
  const [type, setType] = useState('Evidence appraisal');
  const [priority, setPriority] = useState<CasePriority>('NORMAL');
  const [note, setNote] = useState('');

  const selected = cases.find(c => c.id === selectedId) || cases[0];
  const counts = useMemo(() => ({ open: cases.filter(c => c.status !== 'CLOSED').length, urgent: cases.filter(c => c.priority === 'URGENT').length, breached: cases.filter(c => new Date(c.dueAt).getTime() < Date.now() && c.status !== 'CLOSED').length }), [cases]);

  const persist = (next: WorkflowCase[]) => { setCases(next); saveCases(next); };
  const create = () => { const item = createCase({ title, type, priority, description: 'Workflow case created from Evidence Appraisal Suite.' }); const next = [item, ...cases]; persist(next); setSelectedId(item.id); setTitle('New evidence appraisal case'); };
  const update = (fn: (item: WorkflowCase) => WorkflowCase) => { if (!selected) return; persist(cases.map(c => c.id === selected.id ? fn(c) : c)); };

  return <section className="space-y-5">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div><div className="text-xs font-bold uppercase tracking-widest text-teal-700">Case Workflow Studio</div><h1 className="text-2xl font-black text-slate-900">Evidence case management</h1><p className="text-sm text-slate-600 mt-1 max-w-3xl">A Pega-inspired workflow layer for cases, stages, assignment, SLA, decisions and auditable transitions. It is an independent implementation, not a Pega product or clone.</p></div>
      <div className="grid grid-cols-3 gap-2 text-center"><div className="bg-white border rounded-xl px-4 py-3"><div className="text-lg font-black">{counts.open}</div><div className="text-[10px] text-slate-500">Open cases</div></div><div className="bg-white border rounded-xl px-4 py-3"><div className="text-lg font-black">{counts.urgent}</div><div className="text-[10px] text-slate-500">Urgent</div></div><div className="bg-white border rounded-xl px-4 py-3"><div className="text-lg font-black">{counts.breached}</div><div className="text-[10px] text-slate-500">SLA breach</div></div></div>
    </div>

    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <aside className="bg-white border rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between"><h2 className="font-bold">Create case</h2><Plus className="w-4 h-4" /></div>
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Case title" />
        <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm"><option>Evidence appraisal</option><option>Research screening</option><option>Peer review</option><option>Implementation project</option></select>
        <select value={priority} onChange={e => setPriority(e.target.value as CasePriority)} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>
        <button onClick={create} className="w-full bg-slate-900 text-white rounded-lg px-3 py-2 text-sm font-bold"><Plus className="inline w-4 h-4 mr-1" /> Create case</button>
        <div className="pt-3 border-t"><h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Case queue</h3><div className="space-y-2 max-h-[430px] overflow-auto">{cases.length === 0 && <p className="text-sm text-slate-500">No cases yet.</p>}{cases.map(c => <button key={c.id} onClick={() => setSelectedId(c.id)} className={`w-full text-left p-3 rounded-xl border ${selected?.id === c.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}><div className="font-semibold text-sm truncate">{c.title}</div><div className="text-[10px] text-slate-500 mt-1">{c.id} · {c.status} · {c.priority}</div></button>)}</div></div>
      </aside>

      <main className="bg-white border rounded-2xl p-5 min-h-[620px]">
        {!selected ? <div className="h-full flex items-center justify-center text-slate-500">Create a case to start the workflow.</div> : <>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div><div className="text-xs text-slate-500 font-mono">{selected.id}</div><h2 className="text-xl font-black">{selected.title}</h2><p className="text-sm text-slate-500">{selected.type} · priority {selected.priority}</p></div><div className="flex items-center gap-2 text-xs"><Clock3 className="w-4 h-4" />{dueLabel(selected.dueAt)}</div></div>

          <div className="mt-7 overflow-x-auto"><div className="min-w-[760px] flex items-start">{DEFAULT_STAGES.map((stage, i) => { const active = selected.stageId === stage.id; const done = stage.order < (DEFAULT_STAGES.find(s => s.id === selected.stageId)?.order || 1); return <React.Fragment key={stage.id}><button onClick={() => update(c => transitionCase(c, stage, 'lead-reviewer'))} className={`w-32 text-center ${active ? 'text-teal-800' : done ? 'text-slate-700' : 'text-slate-400'}`}><div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center border-2 ${active ? 'border-teal-700 bg-teal-50' : done ? 'border-slate-400 bg-slate-100' : 'border-slate-200'}`}>{done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{stage.order}</span>}</div><div className="text-xs font-bold mt-2">{stage.name}</div><div className="text-[10px] text-slate-400">SLA {stage.slaHours}h</div></button>{i < DEFAULT_STAGES.length - 1 && <div className="flex-1 h-px bg-slate-200 mt-4" />}</React.Fragment>})}</div></div>

          <div className="grid md:grid-cols-3 gap-4 mt-8"><div className="border rounded-xl p-4"><div className="text-xs text-slate-500">Status</div><div className="font-black mt-1">{selected.status}</div></div><div className="border rounded-xl p-4"><div className="text-xs text-slate-500">Assignment</div><select value={selected.assignee} onChange={e => update(c => assignCase(c, e.target.value, 'lead-reviewer'))} className="mt-1 w-full text-sm font-bold bg-transparent"><>{ASSIGNEES.map(a => <option key={a}>{a}</option>)}</></select></div><div className="border rounded-xl p-4"><div className="text-xs text-slate-500">Next action</div><button onClick={() => { const idx = DEFAULT_STAGES.findIndex(s => s.id === selected.stageId); const next = DEFAULT_STAGES[Math.min(idx + 1, DEFAULT_STAGES.length - 1)]; update(c => transitionCase(c, next, 'lead-reviewer')); }} className="mt-1 text-sm font-bold text-teal-800">Advance case <ArrowRight className="inline w-4 h-4" /></button></div></div>

          <div className="grid md:grid-cols-2 gap-5 mt-6"><div className="border rounded-xl p-4"><h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4" /> Rules / routing</h3><ul className="text-sm text-slate-600 mt-3 space-y-2"><li>• Urgent cases can be routed to Lead reviewer.</li><li>• Each stage receives its own SLA clock.</li><li>• Closure is only available as the final workflow stage.</li><li>• Every transition and assignment is recorded in the audit trail.</li></ul></div><div className="border rounded-xl p-4"><h3 className="font-bold flex items-center gap-2"><UserRound className="w-4 h-4" /> Add audit note</h3><textarea value={note} onChange={e => setNote(e.target.value)} className="mt-3 w-full border rounded-lg p-2 text-sm" rows={3} placeholder="Reason, decision or reviewer note" /><button onClick={() => { if (!note.trim()) return; update(c => addCaseNote(c, note.trim(), 'lead-reviewer')); setNote(''); }} className="mt-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold">Add note</button></div></div>

          <div className="mt-6 border rounded-xl overflow-hidden"><div className="px-4 py-3 bg-slate-50 border-b font-bold text-sm">Immutable-style workflow audit log</div><div className="max-h-64 overflow-auto divide-y">{[...selected.audit].reverse().map(entry => <div key={entry.id} className="px-4 py-3 text-xs"><div className="flex justify-between gap-3"><span className="font-bold">{entry.action}</span><span className="text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span></div><div className="text-slate-500 mt-1">actor: {entry.actor}{entry.from ? ` · ${entry.from} → ${entry.to}` : entry.to ? ` · ${entry.to}` : ''}{entry.note ? ` · ${entry.note}` : ''}</div></div>)}</div></div>
        </>}
      </main>
    </div>
  </section>;
};
