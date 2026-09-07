import React, { useEffect, useMemo, useState } from 'react';
import { MASTER_INSTRUMENTS_REGISTRY } from '../data/masterRegistry';
import { decideAppraisalLaunch, upsertAppraisalResponse, validateAppraisalSession, type AppraisalSession } from '../services/universalAppraisalService';
import { Amstar2AssessmentEngine, Agree2AssessmentEngine, JbiQualitativeAssessmentEngine, Rob2AssessmentEngine, RobinsIAssessmentEngine } from '../services/assessmentEngines';
import { QualityAssessmentPanel } from './QualityAssessmentPanel';
import { getLatestAppraisalSession } from '../services/appraisalSessionStore';

interface Props { studyId: string; studyDesign: string; initialInstrumentId?: string; reviewerId?: string; onSaved?: (session: AppraisalSession) => void; }

const answerOptions = (instrumentId: string, allowed: string[]) => {
  if (instrumentId === 'agree-ii' || instrumentId === 'agree-rex') return ['1','2','3','4','5','6','7'];
  if (instrumentId === 'rob-2') return ['Low risk','Some concerns','High risk'];
  if (instrumentId === 'robins-i') return ['Low','Moderate','Serious','Critical','No information'];
  return allowed?.length ? allowed : ['Yes','Partial Yes','No','Unclear','Not applicable'];
};

const hasAnswer = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '';

type Rob2Risk = 'Low risk' | 'Some concerns' | 'High risk';
type RobinsIRisk = 'Low risk' | 'Moderate risk' | 'Serious risk' | 'Critical risk' | 'No information';

function isRob2Risk(value: unknown): value is Rob2Risk {
  return value === 'Low risk' || value === 'Some concerns' || value === 'High risk';
}

function isRobinsIRisk(value: unknown): value is RobinsIRisk {
  return value === 'Low risk' || value === 'Moderate risk' || value === 'Serious risk' || value === 'Critical risk' || value === 'No information';
}

async function createCanonicalSession(studyId: string, reviewerId: string, instrumentId: string): Promise<AppraisalSession> {
  const response = await fetch(`/api/research-workflows/${encodeURIComponent(studyId)}/appraisal/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerId, instrumentId: instrumentId || undefined }),
  });
  const payload = await response.json().catch(() => null) as { appraisal?: AppraisalSession; error?: string } | null;
  if (!response.ok || !payload?.appraisal) throw new Error(payload?.error || 'Kunne ikke opprette canonical appraisal-session.');
  return payload.appraisal;
}

async function saveCanonicalSession(session: AppraisalSession): Promise<AppraisalSession> {
  const response = await fetch(`/api/appraisal/${encodeURIComponent(session.id)}/sync`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session }),
  });
  const payload = await response.json().catch(() => null) as { session?: AppraisalSession; error?: string } | null;
  if (!response.ok) throw new Error(payload?.error || 'Kunne ikke synkronisere appraisal-session.');
  return payload?.session ?? session;
}

async function changeCanonicalInstrument(session: AppraisalSession, studyDesign: string, instrumentId: string, reviewerId: string): Promise<AppraisalSession> {
  const decision = decideAppraisalLaunch(studyDesign, instrumentId, false);
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);
  const response = await fetch(`/api/appraisal/${encodeURIComponent(session.id)}/instrument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instrumentId: decision.instrument.id, reviewerId }),
  });
  const payload = await response.json().catch(() => null) as { session?: AppraisalSession; error?: string } | null;
  if (!response.ok || !payload?.session) throw new Error(payload?.error || 'Kunne ikke endre appraisal-instrument.');
  return payload.session;
}

export const UniversalAppraisalView: React.FC<Props> = ({ studyId, studyDesign, initialInstrumentId = '', reviewerId, onSaved }) => {
  const effectiveReviewerId = reviewerId?.trim() || '';
  const cached = getLatestAppraisalSession(studyId, initialInstrumentId, effectiveReviewerId);
  const [instrumentId, setInstrumentId] = useState(cached?.instrumentId ?? initialInstrumentId);
  const [session, setSession] = useState<AppraisalSession | null>(cached ?? null);
  const [notice, setNotice] = useState(effectiveReviewerId ? '' : 'Reviewer-ID mÃ¥ oppgis fÃ¸r appraisal kan startes.');
  const [starting, setStarting] = useState(false);
  const [changingInstrument, setChangingInstrument] = useState(false);
  const instrument = MASTER_INSTRUMENTS_REGISTRY.find(item => item.id === instrumentId);
  const validation = session ? validateAppraisalSession(session) : null;

  useEffect(() => {
    if (!effectiveReviewerId || session || starting) return;
    let cancelled = false;
    setStarting(true);
    void createCanonicalSession(studyId, effectiveReviewerId, initialInstrumentId)
      .then(next => { if (!cancelled) { setInstrumentId(next.instrumentId); setSession(next); } })
      .catch(error => { if (!cancelled) setNotice(error instanceof Error ? error.message : 'Appraisal-session kunne ikke opprettes.'); })
      .finally(() => { if (!cancelled) setStarting(false); });
    return () => { cancelled = true; };
  }, [effectiveReviewerId, session, starting, studyId]);

  const changeInstrument = async (id: string) => {
    if (!session || session.locked || changingInstrument) return;
    setChangingInstrument(true);
    try {
      const next = await changeCanonicalInstrument(session, studyDesign, id, effectiveReviewerId);
      setInstrumentId(next.instrumentId);
      setSession(next);
      setNotice(`Instrument endret til ${next.instrumentId} ${next.instrumentVersion}. Tidligere svar er nullstilt av canonical workflow.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Instrument kunne ikke endres.');
    } finally {
      setChangingInstrument(false);
    }
  };

  const patch = (itemId: number | string, value: Partial<{ answer: string | null; rationale: string; evidence: { quote?: string; page?: string; section?: string; sourceId?: string } }>) => {
    if (!session || session.locked) { if (session?.locked) setNotice('Denne vurderingen er lÃ¥st og kan ikke endres.'); return; }
    try {
      setSession(prev => {
        if (!prev) return prev;
        const old = prev.responses.find(r => String(r.itemId) === String(itemId));
        return upsertAppraisalResponse(prev, {
          itemId,
          answer: value.answer ?? old?.answer ?? null,
          rationale: value.rationale ?? old?.rationale ?? '',
          evidence: value.evidence ?? old?.evidence,
        });
      });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Svar kunne ikke registreres.');
    }
  };

  const result = useMemo(() => {
    if (!instrument || !session) return null;
    const map = new Map(session.responses.map(r => [String(r.itemId), r]));
    if (instrument.id === 'amstar-2') {
      const responses: Record<number, string> = {};
      map.forEach((r,k) => { responses[Number(k)] = String(r.answer ?? ''); });
      return Object.keys(responses).length === instrument.itemCount && Object.values(responses).every(hasAnswer)
        ? Amstar2AssessmentEngine.evaluate(responses)
        : null;
    }
    if (instrument.id === 'agree-ii') {
      const ratings: Record<number, number> = {};
      map.forEach((r,k) => { if (hasAnswer(r.answer)) ratings[Number(k)] = Number(r.answer); });
      return Object.keys(ratings).length === instrument.itemCount && Object.values(ratings).every(Number.isInteger)
        ? Agree2AssessmentEngine.evaluateDomainScores(ratings)
        : null;
    }
    if (instrument.id === 'rob-2') {
      const required = ['1','2','3','4','5'];
      if (!required.every(id => hasAnswer(map.get(id)?.answer))) return null;
      const d1 = map.get('1')?.answer;
      const d2 = map.get('2')?.answer;
      const d3 = map.get('3')?.answer;
      const d4 = map.get('4')?.answer;
      const d5 = map.get('5')?.answer;
      if (![d1, d2, d3, d4, d5].every(isRob2Risk)) return null;
      return Rob2AssessmentEngine.evaluate({
        d1Randomisation: d1 as 'Low risk' | 'Some concerns' | 'High risk',
        d2Deviations: d2 as 'Low risk' | 'Some concerns' | 'High risk',
        d3MissingData: d3 as 'Low risk' | 'Some concerns' | 'High risk',
        d4Measurement: d4 as 'Low risk' | 'Some concerns' | 'High risk',
        d5Selection: d5 as 'Low risk' | 'Some concerns' | 'High risk',
      });
    }
    if (instrument.id === 'robins-i') {
      const required = ['1','2','3','4','5','6','7'];
      if (!required.every(id => hasAnswer(map.get(id)?.answer))) return null;
      const domainResponses: Record<string, RobinsIRisk> = {};
      for (const id of required) {
        const answer = map.get(id)?.answer;
        if (!isRobinsIRisk(answer)) return null;
        domainResponses[`D${id}`] = answer;
      }
      return RobinsIAssessmentEngine.evaluate(domainResponses);
    }
    if (instrument.id === 'jbi-qualitative-2017') {
      return JbiQualitativeAssessmentEngine.evaluate(session.responses.map(r => ({ questionId: Number(r.itemId), status: String(r.answer ?? ''), justification: r.rationale })));
    }
    return null;
  }, [instrument, session]);

  const answeredCount = session?.responses.filter(r => hasAnswer(r.answer)).length ?? 0;
  const interpretation = result && 'overallConfidence' in result ? result.overallConfidence
    : result && 'overallRiskOfBias' in result ? result.overallRiskOfBias
    : result && 'verdict' in result ? result.verdict
    : `${answeredCount}/${instrument?.itemCount ?? 0} besvart â€” ingen instrumentspesifikk skÃ¥r fÃ¸r vurderingen er komplett`;

  const finalize = async () => {
    if (!session || session.locked) return;
    if (!effectiveReviewerId) { setNotice('Reviewer-ID mÃ¥ oppgis.'); return; }
    if (!validation?.valid) { setNotice(validation?.issues.join(' ') || 'Vurderingen er ikke komplett.'); return; }
    try {
      const canonical = await saveCanonicalSession(session);
      const response = await fetch(`/api/appraisal/${encodeURIComponent(canonical.id)}/finalize`, { method: 'POST' });
      const payload = await response.json().catch(() => null) as { session?: AppraisalSession; error?: string } | null;
      if (!response.ok || !payload?.session) throw new Error(payload?.error || 'Kunne ikke ferdigstille appraisal.');
      setSession(payload.session);
      onSaved?.(payload.session);
      setNotice('Vurderingen er validert og lÃ¥st i canonical appraisal workflow.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Vurderingen kunne ikke lagres.');
    }
  };

  if (!instrument) return <div className="bg-white border border-rose-200 rounded-2xl p-6 text-rose-900">Valgt instrument finnes ikke.</div>;
  const questions = instrument.questions ?? [];

  if (!effectiveReviewerId || !session) {
    return <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3"><h2 className="text-xl font-bold">{instrument.name}</h2><p className="text-sm text-slate-600">{notice || (starting ? 'Oppretter canonical appraisal-sessionâ€¦' : 'Appraisal-session er ikke tilgjengelig.')}</p></section>;
  }

  return (
    <section className="space-y-5 pb-16">
      <header className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">EVIDENCE APPRAISAL Â· AKTIV VURDERING</div>
            <h2 className="text-2xl font-bold font-serif">{instrument.name}</h2>
            <p className="text-sm text-slate-600 mt-1">Studiedesign: {studyDesign || 'ikke registrert'} Â· Studie-ID: {studyId} Â· Reviewer: {effectiveReviewerId}</p>
          </div>
          <select value={instrumentId} onChange={e => void changeInstrument(e.target.value)} disabled={session.locked || changingInstrument} className="rounded-xl border border-slate-300 px-3 py-2 text-sm max-w-full disabled:opacity-50">
            {MASTER_INSTRUMENTS_REGISTRY.map(i => <option key={i.id} value={i.id}>{i.shortName} Â· {i.version}</option>)}
          </select>
        </div>
        {notice && <div role="status" className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">{notice}</div>}
      </header>

      <div className="grid sm:grid-cols-3 gap-3">
        <Info label="Svar" value={`${answeredCount}/${questions.length}`} />
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
              <div className="flex flex-wrap gap-2">{options.map(option => <button key={String(option)} type="button" disabled={session.locked} onClick={() => patch(q.id,{answer:String(option)})} className={`px-3 py-2 rounded-xl border text-xs font-semibold disabled:opacity-50 ${String(response?.answer ?? '')===String(option)?'bg-teal-800 text-white border-teal-800':'bg-white border-slate-300 text-slate-700'}`}>{String(option)}</button>)}</div>
              <div className="grid md:grid-cols-2 gap-3"><textarea disabled={session.locked} value={response?.rationale ?? ''} onChange={e=>patch(q.id,{rationale:e.target.value})} rows={3} placeholder="Forskerens begrunnelse" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"/><div className="space-y-2"><textarea disabled={session.locked} value={response?.evidence?.quote ?? ''} onChange={e=>patch(q.id,{evidence:{...(response?.evidence ?? {}),quote:e.target.value}})} rows={2} placeholder="Eksakt evidens / sitat" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"/><div className="grid grid-cols-2 gap-2"><input disabled={session.locked} value={response?.evidence?.page ?? ''} onChange={e=>patch(q.id,{evidence:{...(response?.evidence ?? {}),page:e.target.value}})} placeholder="Side" className="rounded-xl border border-slate-300 px-3 py-2 text-xs disabled:bg-slate-50"/><input disabled={session.locked} value={response?.evidence?.section ?? ''} onChange={e=>patch(q.id,{evidence:{...(response?.evidence ?? {}),section:e.target.value}})} placeholder="Seksjon/tabell/figur" className="rounded-xl border border-slate-300 px-3 py-2 text-xs disabled:bg-slate-50"/></div></div></div>
            </article>;
          })}
        </div>
      )}

      <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div><div className="text-[10px] uppercase tracking-wide text-slate-400">Instrumentspesifikk vurdering</div><h3 className="text-lg font-bold mt-1">{String(interpretation)}</h3>{result && 'methodologicalWarning' in result && result.methodologicalWarning && <p className="text-xs text-amber-800 mt-2">{result.methodologicalWarning}</p>}</div>
        {result && 'domainScores' in result && <div className="grid md:grid-cols-3 gap-2">{result.domainScores.map(d =><div key={d.domainId} className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs"><div className="font-semibold">{d.domainName}</div><div className="text-lg font-bold mt-1">{d.standardizedScorePercent}%</div></div>)}</div>}
        <button type="button" disabled={!validation?.valid || session.locked || questions.length===0} onClick={finalize} title={!validation?.valid ? (validation?.issues.join(' ') || 'Fyll ut alle nÃ¸dvendige vurderingspunkter fÃ¸r lagring.') : undefined} className="px-4 py-2 rounded-xl bg-teal-800 disabled:opacity-40 text-white text-xs font-bold">{session.locked ? 'Vurdering lÃ¥st' : 'Lagre og lÃ¥s vurdering'}</button>
        {!validation?.valid && <div role="status" className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{validation?.issues.join(' ') || 'Fyll ut alle nÃ¸dvendige vurderingspunkter fÃ¸r lagring.'}</div>}
      </aside>

      {session.locked && instrument.id !== 'jbi-qualitative-2017' && session.responses.length > 0 && (
        <QualityAssessmentPanel session={session} evidenceId={String(session.responses.find(response => response.evidence?.sourceId)?.evidence?.sourceId ?? '')} reviewerId={effectiveReviewerId} />
      )}
    </section>
  );
};

function Info({ label, value }: { label: string; value: string }) { return <div className="bg-white border border-slate-200 rounded-xl p-3"><div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div><div className="text-sm font-bold mt-1">{value}</div></div>; }


