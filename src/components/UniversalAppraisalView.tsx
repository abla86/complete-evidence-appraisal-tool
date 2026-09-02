import React, { useMemo, useState } from 'react';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { createBlankAppraisalSession, decideAppraisalLaunch, lockAppraisalSession, upsertAppraisalResponse, validateAppraisalSession, type AppraisalSession } from '../services/universalAppraisalService';
import { Amstar2AssessmentEngine, Agree2AssessmentEngine, JbiQualitativeAssessmentEngine, Rob2AssessmentEngine, RobinsIAssessmentEngine } from '../services/assessmentEngines';
import { QualityAssessmentPanel } from './QualityAssessmentPanel';
import { loadAppraisalSessions } from '../services/appraisalSessionStore';

interface Props { studyId: string; studyDesign: string; initialInstrumentId?: string; reviewerId?: string; onSaved?: (session: AppraisalSession) => void; }

const answerOptions = (instrumentId: string, allowed: string[]) => {
  if (instrumentId === 'agree-ii' || instrumentId === 'agree-rex') return ['1','2','3','4','5','6','7'];
  if (instrumentId === 'rob-2') return ['Low risk','Some concerns','High risk'];
  if (instrumentId === 'robins-i') return ['Low','Moderate','Serious','Critical','No information'];
  return allowed?.length ? allowed : ['Yes','Partial Yes','No','Unclear','Not applicable'];
};

export const UniversalAppraisalView: React.FC<Props> = ({ studyId, studyDesign, initialInstrumentId = 'jbi-qualitative-2017', reviewerId = 'current-user', onSaved }) => {
  const [instrumentId, setInstrumentId] = useState(initialInstrumentId);
  const [session, setSession] = useState<AppraisalSession>(() => createBlankAppraisalSession(studyId, initialInstrumentId, reviewerId));
  const [notice, setNotice] = useState('');
  const instrument = MASTER_INSTRUMENTS_REGISTRY.find(item => item.id === instrumentId);
  const validation = validateAppraisalSession(session);

  const changeInstrument = (id: string) => {
    const decision = decideAppraisalLaunch(studyDesign, id, false);
    setNotice(decision.warnings.join(' ') || decision.reason);
    if (!decision.allowed) return;
    setInstrumentId(id);
    setSession(createBlankAppraisalSession(studyId, id, reviewerId));
  };

  const patch = (itemId: number | string, value: Partial<{ answer: string | null; rationale: string; evidence: { quote?: string; page?: string; section?: string } }>) => {
    setSession(prev => {
      const old = prev.responses.find(r => String(r.itemId) === String(itemId));
      return upsertAppraisalResponse(prev, { itemId, answer: value.answer ?? old?.answer ?? null, rationale: value.rationale ?? old?.rationale ?? '', evidence: value.evidence ?? old?.evidence });
    });
  };

  const result = useMemo(() => {
    if (!instrument) return null;
    const map = new Map(session.responses.map(r => [String(r.itemId), r]));
    if (instrument.id === 'amstar-2') {
      const responses: Record<number, string> = {};
      map.forEach((r,k) => { responses[Number(k)] = String(r.answer ?? ''); });
      return Amstar2AssessmentEngine.evaluate(responses);
    }
    if (instrument.id === 'agree-ii') {
      const ratings: Record<number, number> = {};
      map.forEach((r,k) => { if (r.answer !== null && r.answer !== '') ratings[Number(k)] = Number(r.answer); });
      return Object.keys(ratings).length ? Agree2AssessmentEngine.evaluateDomainScores(ratings, 1) : null;
    }
    if (instrument.id === 'rob-2') {
      const values = {
        d1Randomisation: (map.get('1')?.answer || 'Some concerns') as any,
        d2Deviations: (map.get('2')?.answer || 'Some concerns') as any,
        d3Missing: (map.get('3')?.answer || 'Some concerns') as any,
        d4Measurement: (map.get('4')?.answer || 'Some concerns') as any,
        d5Selection: (map.get('5')?.answer || 'Some concerns') as any,
      };
      return Rob2AssessmentEngine.evaluate(values);
    }
    if (instrument.id === 'robins-i') {
      const values = ['1','2','3','4','5','6','7'].map(id => String(map.get(id)?.answer || 'No information')) as any;
      return RobinsIAssessmentEngine.evaluate(values);
    }
    if (instrument.id === 'jbi-qualitative-2017') {
      return JbiQualitativeAssessmentEngine.evaluate(session.responses.map(r => ({ questionId: Number(r.itemId), status: String(r.answer ?? ''), justification: r.rationale })));
    }
    return null;
  }, [instrument, session.responses]);

  const interpretation = result && 'overallConfidence' in result ? result.overallConfidence : result && 'overallRiskOfBias' in result ? result.overallRiskOfBias : result && 'verdict' in result ? result.verdict : `${session.responses.filter(r => r.answer !== null && r.answer !== '').length}/${instrument?.itemCount ?? 0} besvart`;
  const existingLockedQuality = useMemo(() => loadAppraisalSessions().some(item => item.id === session.id && item.locked), [session.id, session.locked]);

  const finalize = () => {
    if (!validation.valid) { setNotice(validation.issues.join(' ')); return; }
    const locked = lockAppraisalSession(session);
    setSession(locked);
    onSaved?.(locked);
    setNotice('Vurderingen er lagret og låst som denne versjonen.');
  };

  if (!instrument) return <div className="bg-white border border-rose-200 rounded-2xl p-6 text-rose-900">Valgt instrument finnes ikke.</div>;
  const questions = instrument.questions ?? [];

  return (
    <section className="space-y-5 pb-16">
      <header className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">EVIDENCE APPRAISAL · AKTIV VURDERING</div>
            <h2 className="text-2xl font-bold font-serif">{instrument.name}</h2>
            <p className="text-sm text-slate-600 mt-1">Studiedesign: {studyDesign || 'ikke registrert'} · Studie-ID: {studyId}</p>
          </div>
          <select value={instrumentId} onChange={e => changeInstrument(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm max-w-full">
            {MASTER_INSTRUMENTS_REGISTRY.map(i => <option key={i.id} value={i.id}>{i.shortName} · {i.version}</option>)}
          </select>
        </div>
        {notice && <div role="status" className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">{notice}</div>}
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <Info label="Svar" value={`${session.responses.filter(r => r.answer !== null && r.answer !== '').length}/${questions.length}`} />
        <Info label="Instrument" value={`${instrument.shortName} ${instrument.version}`} />
        <Info label="Tolkningsresultat" value={String(interpretation)} />
      </div>

      {questions.length === 0 ? <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm">Dette instrumentet mangler de faktiske vurderingspunktene i registryet. Det blir derfor ikke presentert som fullt implementert.</div> : (
        <div className="space-y-3">
          {questions.map((q, index) => {
            const response = session.responses.find(r => String(r.itemId) === String(q.id));
            const options = answerOptions(instrument.id, q.allowedAnswers ?? instrument.allowedAnswers);
            return <article key={String(q.id)} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] uppercase tracking-wide text-slate-400">Punkt {q.itemNumber ?? index + 1}</div><h3 className="font-bold text-slate-900 mt-1">{q.shortTitle}</h3><p className="text-sm text-slate-800 mt-2 leading-6">{q.officialQuestion || q.questionText}</p>{(q.officialQuestionEn || q.questionTextEn) && <p className="text-xs text-slate-500 italic mt-1">{q.officialQuestionEn || q.questionTextEn}</p>}</div>{q.isCritical && <span className="text-[10px] px-2 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">KRITISK</span>}</div>
              <div className="flex flex-wrap gap-2">{options.map(option => <button key={String(option)} type="button" onClick={() => patch(q.id,{answer:String(option)})} className={`px-3 py-2 rounded-xl border text-xs font-semibold ${String(response?.answer ?? '')===String(option)?'bg-teal-800 text-white border-teal-800':'bg-white border-slate-300 text-slate-700'}`}>{String(option)}</button>)}</div>
              <div className="grid md:grid-cols-2 gap-3"><textarea value={response?.rationale ?? ''} onChange={e=>patch(q.id,{rationale:e.target.value})} rows={3} placeholder="Forskerens begrunnelse" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"/><div className="space-y-2"><textarea value={response?.evidence?.quote ?? ''} onChange={e=>patch(q.id,{evidence:{...(response?.evidence ?? {}),quote:e.target.value}})} rows={2} placeholder="Eksakt evidens / sitat" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"/><div className="grid grid-cols-2 gap-2"><input value={response?.evidence?.page ?? ''} onChange={e=>patch(q.id,{evidence:{...(response?.evidence ?? {}),page:e.target.value}})} placeholder="Side" className="rounded-xl border border-slate-300 px-3 py-2 text-xs"/><input value={response?.evidence?.section ?? ''} onChange={e=>patch(q.id,{evidence:{...(response?.evidence ?? {}),section:e.target.value}})} placeholder="Seksjon/tabell/figur" className="rounded-xl border border-slate-300 px-3 py-2 text-xs"/></div></div></div>
            </article>;
          })}
        </div>
      )}

      <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div><div className="text-[10px] uppercase tracking-wide text-slate-400">Instrumentspesifikk vurdering</div><h3 className="text-lg font-bold mt-1">{String(interpretation)}</h3>{result && 'methodologicalWarning' in result && result.methodologicalWarning && <p className="text-xs text-amber-800 mt-2">{result.methodologicalWarning}</p>}</div>
        {result && 'domainScores' in result && <div className="grid md:grid-cols-3 gap-2">{result.domainScores.map((d:any)=><div key={d.domainId} className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs"><div className="font-semibold">{d.domainName}</div><div className="text-lg font-bold mt-1">{d.standardizedScorePercent}%</div></div>)}</div>}
        <button type="button" disabled={!validation.valid || session.locked || questions.length===0} onClick={finalize} className="px-4 py-2 rounded-xl bg-teal-800 disabled:opacity-40 text-white text-xs font-bold">{session.locked || existingLockedQuality ? 'Vurdering låst' : 'Fullfør og lås vurdering'}</button>
        {!validation.valid && <div className="text-xs text-amber-800">{validation.issues.join(' ')}</div>}
      </aside>

      {session.locked && instrument.id !== 'jbi-qualitative-2017' && <QualityAssessmentPanel session={session} evidenceId={studyId} reviewerId={reviewerId} />}
    </section>
  );
};

function Info({ label, value }: { label: string; value: string }) { return <div className="bg-white border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="text-sm font-bold mt-1">{value}</div></div>; }
