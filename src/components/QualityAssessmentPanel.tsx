import React, { useState } from 'react';
import { assessGRADE, assessCERQual, lockQualityAssessment, addQualityAssessment, type StoredQualityAssessment } from '../services/qualityAssessmentService';
import { getQualityAssessmentsForSession } from '../services/appraisalSessionStore';
import type { AppraisalSession } from '../services/universalAppraisalService';

interface Props {
  session: AppraisalSession;
  evidenceId?: string;
  reviewerId?: string;
  onSaved?: (assessment: StoredQualityAssessment) => void;
}

type GradeDomain = 'riskOfBias' | 'inconsistency' | 'indirectness' | 'imprecision' | 'publicationBias';

const gradeLabels: Record<GradeDomain, string> = {
  riskOfBias: 'Risk of bias', inconsistency: 'Inconsistency', indirectness: 'Indirectness', imprecision: 'Imprecision', publicationBias: 'Publication bias',
};

export const QualityAssessmentPanel: React.FC<Props> = ({ session, evidenceId = '', reviewerId = session.reviewerId, onSaved }) => {
  const [mode, setMode] = useState<'GRADE' | 'CERQual'>('GRADE');
  const [outcome, setOutcome] = useState('');
  const [studyDesign, setStudyDesign] = useState<'RCT' | 'Observational'>('RCT');
  const [downgrades, setDowngrades] = useState<Record<GradeDomain, 0 | -1 | -2>>({ riskOfBias: 0, inconsistency: 0, indirectness: 0, imprecision: 0, publicationBias: 0 });
  const [finding, setFinding] = useState('');
  const [cerqual, setCerqual] = useState({ methodologicalLimitations: 'No or very minor concerns', coherence: 'No or very minor concerns', adequacyOfData: 'No or very minor concerns', relevance: 'No or very minor concerns' });
  const [message, setMessage] = useState('');

  const save = () => {
    try {
      if (!session.locked) throw new Error('Appraisal-sesjonen må være ferdigstilt før GRADE/CERQual kan registreres.');
      if (!evidenceId.trim()) throw new Error('Ingen canonical evidenceId er tilgjengelig for kvalitetsvurderingen.');
      const existing = getQualityAssessmentsForSession(session.id);
      if (existing.some(item => item.evidenceId === evidenceId && item.kind === mode && item.locked)) throw new Error(`${mode}-vurdering for dette evidensfunnet er allerede låst.`);

      const draft = mode === 'GRADE'
        ? assessGRADE({ evidenceId, appraisalSessionId: session.id, outcomeName: outcome, studyDesign, ...downgrades, reviewerId })
        : assessCERQual({ evidenceId, appraisalSessionId: session.id, finding, ...cerqual, reviewerId });
      const locked = lockQualityAssessment(draft);
      addQualityAssessment(session.id, locked);
      onSaved?.(locked);
      setMessage(`${mode} lagret og låst som versjon ${locked.version}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kvalitetsvurdering kunne ikke lagres.');
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">CERTAINTY / CONFIDENCE</div><h3 className="text-lg font-bold">GRADE / CERQual</h3></div>
        <div className="flex rounded-xl border border-slate-300 overflow-hidden">
          <button type="button" onClick={() => setMode('GRADE')} className={`px-3 py-2 text-xs font-bold ${mode === 'GRADE' ? 'bg-teal-800 text-white' : 'bg-white text-slate-700'}`}>GRADE</button>
          <button type="button" onClick={() => setMode('CERQual')} className={`px-3 py-2 text-xs font-bold ${mode === 'CERQual' ? 'bg-teal-800 text-white' : 'bg-white text-slate-700'}`}>CERQual</button>
        </div>
      </div>

      {mode === 'GRADE' ? (
        <div className="space-y-3">
          <input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="Outcome" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <select value={studyDesign} onChange={e => setStudyDesign(e.target.value as typeof studyDesign)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="RCT">RCT</option><option value="Observational">Observational</option></select>
          <div className="grid md:grid-cols-2 gap-3">
            {(Object.keys(gradeLabels) as GradeDomain[]).map(domain => <label key={domain} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="block text-xs font-bold mb-2">{gradeLabels[domain]}</span><select value={downgrades[domain]} onChange={e => setDowngrades(prev => ({ ...prev, [domain]: Number(e.target.value) as 0 | -1 | -2 }))} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs bg-white"><option value={0}>Ingen nedgradering</option><option value={-1}>Serious (-1)</option><option value={-2}>Very serious (-2)</option></select></label>)}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea value={finding} onChange={e => setFinding(e.target.value)} rows={3} placeholder="Review finding" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid md:grid-cols-2 gap-3">
            {(Object.keys(cerqual) as Array<keyof typeof cerqual>).map(component => <label key={component} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="block text-xs font-bold mb-2">{component}</span><select value={cerqual[component]} onChange={e => setCerqual(prev => ({ ...prev, [component]: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs bg-white"><option>No or very minor concerns</option><option>Minor concerns</option><option>Moderate concerns</option><option>Serious concerns</option></select></label>)}
          </div>
        </div>
      )}

      <button type="button" onClick={save} className="rounded-xl bg-teal-800 text-white px-4 py-2 text-sm font-bold">Lagre og lås {mode}</button>
      {message && <div role="status" className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-sm">{message}</div>}
    </section>
  );
};
