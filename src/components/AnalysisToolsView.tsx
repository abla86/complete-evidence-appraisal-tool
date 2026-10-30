import React, { useEffect, useState } from 'react';
import GradeSoFView from './GradeSoFView';
import ForestPlotView from './ForestPlotView';
import ConsensusDashboardView from './ConsensusDashboardView';
import type { GradeJudgement } from '../services/gradeMatrixService';
import type { MetaStudy } from '../services/metaAnalysisEngine';
import type { ConsensusDecision, ConsensusItem } from '../services/consensusProtocolService';
import { validateExtraction, type ExtractionMatrix } from '../services/dataExtractionService';

/** Local, offline-capable calculators: GRADE certainty, random-effects meta-analysis, screening agreement and extraction checks. */

const STORAGE_KEY = 'evidence-appraisal-analysis-tools-v1';
interface ToolsState { gradeStart: 'High' | 'Low'; grade: GradeJudgement; studies: MetaStudy[]; consensus: ConsensusItem[]; extraction: { studyId: string; nTotal: number; nIntervention: number; nControl: number; intervention: string; comparator: string; outcome: string } }
const DEFAULT_STATE: ToolsState = {
  gradeStart: 'High',
  grade: { riskOfBias: 0, inconsistency: 0, indirectness: 0, imprecision: 0, publicationBias: 0 },
  studies: [],
  consensus: [],
  extraction: { studyId: '', nTotal: 0, nIntervention: 0, nControl: 0, intervention: '', comparator: '', outcome: '' },
};

function load(): ToolsState {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE; } catch { return DEFAULT_STATE; }
}

const GRADE_DOMAINS: Array<[keyof GradeJudgement, string]> = [['riskOfBias', 'Risiko for skjevhet'], ['inconsistency', 'Inkonsistens'], ['indirectness', 'Indirekthet'], ['imprecision', 'Upresisjon'], ['publicationBias', 'Publiseringsskjevhet']];
const DECISIONS: Array<[ConsensusDecision | '', string]> = [['', '—'], ['INCLUDED', 'Inkluder'], ['EXCLUDED', 'Ekskluder'], ['UNCERTAIN', 'Usikker']];
const card = 'bg-white border border-slate-200 rounded-2xl p-5 space-y-3';
const input = 'rounded-lg border border-slate-300 px-2 py-1.5 text-sm';

export const AnalysisToolsView: React.FC = () => {
  const [state, setState] = useState<ToolsState>(load);
  const [draft, setDraft] = useState({ label: '', effect: '', variance: '' });
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full */ } }, [state]);
  const update = (patch: Partial<ToolsState>) => setState(prev => ({ ...prev, ...patch }));

  const addStudy = () => {
    const effect = Number(draft.effect.replace(',', '.'));
    const variance = Number(draft.variance.replace(',', '.'));
    if (!draft.label.trim() || !Number.isFinite(effect) || !Number.isFinite(variance) || variance <= 0) return;
    update({ studies: [...state.studies, { id: `s-${Date.now()}`, label: draft.label.trim(), effect, variance }] });
    setDraft({ label: '', effect: '', variance: '' });
  };

  let forest: React.ReactNode = <p className="text-sm text-slate-500">Legg inn minst to studier med effektestimat og varians.</p>;
  if (state.studies.length >= 2) {
    try { forest = <ForestPlotView studies={state.studies} />; }
    catch (error) { forest = <p className="text-sm text-rose-800">{error instanceof Error ? error.message : 'Meta-analysen kunne ikke beregnes.'}</p>; }
  }

  const e = state.extraction;
  const extraction: ExtractionMatrix = { studyId: e.studyId, nTotal: e.nTotal, nIntervention: e.nIntervention, nControl: e.nControl, baselineCharacteristics: {}, intervention: e.intervention, comparator: e.comparator, primaryOutcomes: e.outcome ? [{ id: 'o1', name: e.outcome, measure: 'MEAN_DIFFERENCE' }] : [], secondaryOutcomes: [], qualitative: { phenomenon: '', context: '', theoreticalFramework: '', themes: [], quotes: [] } };
  const extractionCheck = validateExtraction(extraction);

  return <section className="space-y-6 pb-16">
    <header className={card}>
      <h2 className="text-2xl font-bold font-serif">Analyseverktøy</h2>
      <p className="text-sm text-slate-600">Beregningene skjer lokalt og virker uten nett. De er hjelpemidler: kontroller tallgrunnlag og metodevalg mot Cochrane Handbook og GRADE-veiledningen før resultater rapporteres.</p>
    </header>

    <div className="grid lg:grid-cols-2 gap-6">
      <article className={card} aria-labelledby="grade-input-title">
        <h3 id="grade-input-title" className="font-bold">GRADE – tillit til effektestimat</h3>
        <label className="block text-sm">Utgangspunkt <select className={`${input} ml-2`} value={state.gradeStart} onChange={ev => update({ gradeStart: ev.target.value as 'High' | 'Low' })}><option value="High">Høy (randomiserte studier)</option><option value="Low">Lav (observasjonsstudier)</option></select></label>
        <div className="grid sm:grid-cols-2 gap-2">{GRADE_DOMAINS.map(([key, label]) => <label key={key} className="text-sm flex items-center justify-between gap-2">{label}<select className={input} value={state.grade[key]} onChange={ev => update({ grade: { ...state.grade, [key]: Number(ev.target.value) as 0 | 1 | 2 } })}><option value={0}>Ingen nedgradering</option><option value={1}>−1 (alvorlig)</option><option value={2}>−2 (svært alvorlig)</option></select></label>)}</div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm"><GradeSoFView judgement={state.grade} initialLevel={state.gradeStart} /></div>
        <p className="text-xs text-slate-500">Oppgradering (stor effekt, dose–respons, konfundering) for observasjonsstudier må vurderes og dokumenteres manuelt.</p>
      </article>

      <article className={card} aria-labelledby="consensus-input-title">
        <h3 id="consensus-input-title" className="font-bold">Screening-enighet (Cohen’s κ)</h3>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs text-slate-500"><th>Post</th><th>Vurderer A</th><th>Vurderer B</th><th /></tr></thead><tbody>
          {state.consensus.map((item, index) => <tr key={item.id}><td className="py-1">{item.id}</td>{(['a', 'b'] as const).map(side => <td key={side}><select aria-label={`Vurderer ${side.toUpperCase()} for ${item.id}`} className={input} value={item[side] ?? ''} onChange={ev => update({ consensus: state.consensus.map((c, i) => i === index ? { ...c, [side]: ev.target.value || undefined } : c) })}>{DECISIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>)}<td><button type="button" className="text-xs underline" onClick={() => update({ consensus: state.consensus.filter((_, i) => i !== index) })}>Fjern</button></td></tr>)}
        </tbody></table>
        <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs" onClick={() => update({ consensus: [...state.consensus, { id: `Post ${state.consensus.length + 1}` }] })}>Legg til post</button>
        <div className="rounded-xl bg-slate-50 p-3 text-sm"><ConsensusDashboardView items={state.consensus} /></div>
      </article>
    </div>

    <article className={card} aria-labelledby="meta-title">
      <h3 id="meta-title" className="font-bold">Meta-analyse (tilfeldige effekter, DerSimonian–Laird)</h3>
      <p className="text-xs text-slate-500">Oppgi effektestimat på analyseskala (f.eks. log RR/log OR eller gjennomsnittsforskjell) og varians (SE²).</p>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-xs">Studie<input className={`${input} block`} value={draft.label} onChange={ev => setDraft({ ...draft, label: ev.target.value })} /></label>
        <label className="text-xs">Effekt<input inputMode="decimal" className={`${input} block w-28`} value={draft.effect} onChange={ev => setDraft({ ...draft, effect: ev.target.value })} /></label>
        <label className="text-xs">Varians<input inputMode="decimal" className={`${input} block w-28`} value={draft.variance} onChange={ev => setDraft({ ...draft, variance: ev.target.value })} /></label>
        <button type="button" onClick={addStudy} className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs">Legg til</button>
      </div>
      {state.studies.length > 0 && <ul className="text-sm space-y-1">{state.studies.map(s => <li key={s.id} className="flex justify-between gap-2"><span>{s.label}: {s.effect} (varians {s.variance})</span><button type="button" className="text-xs underline" onClick={() => update({ studies: state.studies.filter(x => x.id !== s.id) })}>Fjern</button></li>)}</ul>}
      {forest}
    </article>

    <article className={card} aria-labelledby="extraction-title">
      <h3 id="extraction-title" className="font-bold">Kontroll av dataekstraksjon</h3>
      <div className="grid sm:grid-cols-3 gap-2 text-xs">
        {([['studyId', 'Studie-ID', 'text'], ['intervention', 'Intervensjon', 'text'], ['comparator', 'Sammenligning', 'text'], ['outcome', 'Primært utfall', 'text'], ['nTotal', 'N totalt', 'number'], ['nIntervention', 'N intervensjon', 'number'], ['nControl', 'N kontroll', 'number']] as const).map(([key, label, type]) => <label key={key}>{label}<input type={type} className={`${input} block w-full`} value={String(e[key])} onChange={ev => update({ extraction: { ...e, [key]: type === 'number' ? Number(ev.target.value) : ev.target.value } })} /></label>)}
      </div>
      <div className={`rounded-xl p-3 text-sm ${extractionCheck.valid ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}><strong>{extractionCheck.valid ? 'Ingen blokkerende feil' : 'Krever korrigering'}</strong><ul className="list-disc pl-5">{[...extractionCheck.errors, ...extractionCheck.warnings].map(m => <li key={m}>{m}</li>)}</ul></div>
    </article>
  </section>;
};
