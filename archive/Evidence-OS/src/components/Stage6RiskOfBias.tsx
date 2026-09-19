import React, { useState } from 'react';
import { ShieldAlert, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Rob2StudyAssessment, RobJudgment, StudyRecord } from '../types';

interface Stage6Props {
  robAssessments: Record<string, Rob2StudyAssessment>;
  studies: StudyRecord[];
  onChange: (updated: Record<string, Rob2StudyAssessment>) => void;
  onNext: () => void;
  onPrev: () => void;
  language: 'no' | 'en';
}

export const Stage6RiskOfBias: React.FC<Stage6Props> = ({
  robAssessments,
  studies,
  onChange,
  onNext,
  onPrev,
  language,
}) => {
  const eligibleStudies = studies.filter(s => s.status === 'screened_included' || s.status === 'fulltext_eligible');
  const [selectedStudyId, setSelectedStudyId] = useState<string>(eligibleStudies[0]?.id || '');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const currentStudy = eligibleStudies.find(s => s.id === selectedStudyId) || eligibleStudies[0];

  const currentAssessment: Rob2StudyAssessment = (currentStudy && robAssessments[currentStudy.id]) || {
    studyId: currentStudy?.id || '',
    d1_randomization: 'Low risk',
    d1_notes: 'Adekvat randomisering.',
    d2_deviations: 'Low risk',
    d2_notes: 'Ingen vesentlige protokollavvik.',
    d3_missing_data: 'Low risk',
    d3_notes: 'Lavt frafall.',
    d4_measurement: 'Low risk',
    d4_notes: 'Blindet utfallsmåling.',
    d5_reporting: 'Low risk',
    d5_notes: 'Rapportert iht forhåndsregistrert SAP.',
    overall: 'Low risk',
    summaryComment: 'Gjennomgående lav risiko for skjevhet.',
  };

  const handleUpdateDomain = (domainKey: keyof Rob2StudyAssessment, value: any) => {
    if (!currentStudy) return;
    const updated = {
      ...currentAssessment,
      [domainKey]: value,
    };

    // Auto-calculate overall RoB if domains change
    if (domainKey.startsWith('d') && !domainKey.endsWith('_notes')) {
      const domains: RobJudgment[] = [
        domainKey === 'd1_randomization' ? value : updated.d1_randomization,
        domainKey === 'd2_deviations' ? value : updated.d2_deviations,
        domainKey === 'd3_missing_data' ? value : updated.d3_missing_data,
        domainKey === 'd4_measurement' ? value : updated.d4_measurement,
        domainKey === 'd5_reporting' ? value : updated.d5_reporting,
      ];

      if (domains.includes('High risk')) {
        updated.overall = 'High risk';
      } else if (domains.includes('Some concerns')) {
        updated.overall = 'Some concerns';
      } else {
        updated.overall = 'Low risk';
      }
    }

    onChange({
      ...robAssessments,
      [currentStudy.id]: updated,
    });
  };

  const handleAiRob = async () => {
    if (!currentStudy) return;
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'rob_assess',
          payload: {
            study: {
              title: currentStudy.title,
              authors: currentStudy.authors,
              year: currentStudy.year,
              methods: currentStudy.methodsSummary || currentStudy.abstract,
            }
          },
          language,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const updated: Rob2StudyAssessment = {
          ...currentAssessment,
          d1_randomization: (d.D1?.rating || d.d1_randomization || 'Low risk') as RobJudgment,
          d1_notes: d.D1?.justification || d.d1_notes || currentAssessment.d1_notes,
          d2_deviations: (d.D2?.rating || d.d2_deviations || 'Low risk') as RobJudgment,
          d2_notes: d.D2?.justification || d.d2_notes || currentAssessment.d2_notes,
          d3_missing_data: (d.D3?.rating || d.d3_missing_data || 'Low risk') as RobJudgment,
          d3_notes: d.D3?.justification || d.d3_notes || currentAssessment.d3_notes,
          d4_measurement: (d.D4?.rating || d.d4_measurement || 'Low risk') as RobJudgment,
          d4_notes: d.D4?.justification || d.d4_notes || currentAssessment.d4_notes,
          d5_reporting: (d.D5?.rating || d.d5_reporting || 'Low risk') as RobJudgment,
          d5_notes: d.D5?.justification || d.d5_notes || currentAssessment.d5_notes,
          overall: (d.overall_rob || 'Low risk') as RobJudgment,
          summaryComment: d.summary_narrative || currentAssessment.summaryComment,
        };

        onChange({
          ...robAssessments,
          [currentStudy.id]: updated,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getRobBadge = (judgment: RobJudgment) => {
    switch (judgment) {
      case 'Low risk':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Low risk
          </span>
        );
      case 'Some concerns':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Some concerns
          </span>
        );
      case 'High risk':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            High risk
          </span>
        );
    }
  };

  const renderTrafficCircle = (judgment: RobJudgment = 'Low risk') => {
    if (judgment === 'Low risk') {
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs" title="Low risk of bias">
          +
        </div>
      );
    }
    if (judgment === 'Some concerns') {
      return (
        <div className="w-6 h-6 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center font-bold text-xs shadow-xs" title="Some concerns">
          ?
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs" title="High risk of bias">
        -
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 uppercase tracking-wider mb-1">
            <span>Trinn 6 av 10</span>
            <span>•</span>
            <span>Metodologisk skjevhetsvurdering</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Risk of Bias (Cochrane RoB 2)
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Cochrane RoB 2 er gullstandarden for å evaluere risiko for skjevhet i randomiserte studier fordelt over fem definerte domener. Generer Cochrane Traffic-Light plot og oppsummeringsmatriser.
          </p>
        </div>

        <button
          onClick={handleAiRob}
          disabled={isAiLoading || !currentStudy}
          className="px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium text-xs flex items-center gap-2 transition self-start md:self-auto shadow-sm"
        >
          <Sparkles className={`w-4 h-4 text-amber-600 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span>{isAiLoading ? 'Evaluerer RoB 2...' : 'AI RoB 2 Analyse'}</span>
        </button>
      </div>

      {/* Cochrane Traffic-Light Plot Matrix */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-xs text-stone-900 uppercase tracking-wider">
              Cochrane RoB 2 Traffic-Light Matrise
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Lav risiko (+)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Visse bekymringer (?)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Høy risiko (-)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 border-b border-stone-200 font-mono text-[11px]">
                <th className="p-3 font-semibold">Inkludert studie</th>
                <th className="p-3 text-center" title="D1: Randomiseringsprosessen">D1 Randomisering</th>
                <th className="p-3 text-center" title="D2: Avvik fra tiltenkt intervensjon">D2 Avvik</th>
                <th className="p-3 text-center" title="D3: Manglende utfallsdata">D3 Frafall</th>
                <th className="p-3 text-center" title="D4: Måling av utfall">D4 Måling</th>
                <th className="p-3 text-center" title="D5: Selektiv rapportering">D5 Rapportering</th>
                <th className="p-3 text-center font-bold">Samlet RoB</th>
                <th className="p-3 text-right">Handling</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {eligibleStudies.map(s => {
                const assessment = robAssessments[s.id] || {
                  d1_randomization: 'Low risk',
                  d2_deviations: 'Low risk',
                  d3_missing_data: 'Low risk',
                  d4_measurement: 'Low risk',
                  d5_reporting: 'Low risk',
                  overall: 'Low risk',
                };
                const isSelected = s.id === currentStudy?.id;

                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStudyId(s.id)}
                    className={`cursor-pointer transition ${isSelected ? 'bg-emerald-50/60 font-medium' : 'hover:bg-stone-50'}`}
                  >
                    <td className="p-3">
                      <div className="font-bold text-stone-900">{s.citationKey}</div>
                      <div className="text-[10px] text-stone-500 truncate max-w-xs">{s.title}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">{renderTrafficCircle(assessment.d1_randomization)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">{renderTrafficCircle(assessment.d2_deviations)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">{renderTrafficCircle(assessment.d3_missing_data)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">{renderTrafficCircle(assessment.d4_measurement)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">{renderTrafficCircle(assessment.d5_reporting)}</div>
                    </td>
                    <td className="p-3 text-center font-bold">
                      <div className="flex justify-center">{getRobBadge(assessment.overall)}</div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudyId(s.id);
                        }}
                        className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold"
                      >
                        Rediger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Domain Assessment Workbench for Selected Study */}
      {currentStudy && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-stone-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                Detaljert RoB 2-evaluering
              </span>
              <h2 className="text-lg font-bold text-stone-900 mt-1">
                {currentStudy.citationKey}: {currentStudy.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-600">Samlet domene:</span>
              {getRobBadge(currentAssessment.overall)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* D1: Randomization process */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">
                  D1: Randomiseringsprosessen (Randomization process)
                </span>
                <select
                  value={currentAssessment.d1_randomization}
                  onChange={(e) => handleUpdateDomain('d1_randomization', e.target.value as RobJudgment)}
                  className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-semibold"
                >
                  <option value="Low risk">Low risk</option>
                  <option value="Some concerns">Some concerns</option>
                  <option value="High risk">High risk</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={currentAssessment.d1_notes}
                onChange={(e) => handleUpdateDomain('d1_notes', e.target.value)}
                placeholder="Begrunnelse for allokeringsskjuling og baselinebalanse..."
                className="w-full text-xs bg-white border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* D2: Deviations from intended interventions */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">
                  D2: Avvik fra tiltenkt intervensjon (Deviations)
                </span>
                <select
                  value={currentAssessment.d2_deviations}
                  onChange={(e) => handleUpdateDomain('d2_deviations', e.target.value as RobJudgment)}
                  className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-semibold"
                >
                  <option value="Low risk">Low risk</option>
                  <option value="Some concerns">Some concerns</option>
                  <option value="High risk">High risk</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={currentAssessment.d2_notes}
                onChange={(e) => handleUpdateDomain('d2_notes', e.target.value)}
                placeholder="Begrunnelse for blinding av pasienter/personell og ITT-analyse..."
                className="w-full text-xs bg-white border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* D3: Missing outcome data */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">
                  D3: Manglende utfallsdata (Missing outcome data)
                </span>
                <select
                  value={currentAssessment.d3_missing_data}
                  onChange={(e) => handleUpdateDomain('d3_missing_data', e.target.value as RobJudgment)}
                  className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-semibold"
                >
                  <option value="Low risk">Low risk</option>
                  <option value="Some concerns">Some concerns</option>
                  <option value="High risk">High risk</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={currentAssessment.d3_notes}
                onChange={(e) => handleUpdateDomain('d3_notes', e.target.value)}
                placeholder="Frafallsrate, håndtering av missingness, vitalstatus ved studieslutt..."
                className="w-full text-xs bg-white border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* D4: Measurement of the outcome */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">
                  D4: Måling av utfall (Measurement of outcome)
                </span>
                <select
                  value={currentAssessment.d4_measurement}
                  onChange={(e) => handleUpdateDomain('d4_measurement', e.target.value as RobJudgment)}
                  className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-semibold"
                >
                  <option value="Low risk">Low risk</option>
                  <option value="Some concerns">Some concerns</option>
                  <option value="High risk">High risk</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={currentAssessment.d4_notes}
                onChange={(e) => handleUpdateDomain('d4_notes', e.target.value)}
                placeholder="Blindet uavhengig endepunktskomité (CEC), objektive kriterier..."
                className="w-full text-xs bg-white border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* D5: Selection of the reported result */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">
                  D5: Selektiv rapportering av resultat (Selection of reported result)
                </span>
                <select
                  value={currentAssessment.d5_reporting}
                  onChange={(e) => handleUpdateDomain('d5_reporting', e.target.value as RobJudgment)}
                  className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-semibold"
                >
                  <option value="Low risk">Low risk</option>
                  <option value="Some concerns">Some concerns</option>
                  <option value="High risk">High risk</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={currentAssessment.d5_notes}
                onChange={(e) => handleUpdateDomain('d5_notes', e.target.value)}
                placeholder="Forhåndsregistrert statistisk analyseplan (SAP), konsistens i endepunkter..."
                className="w-full text-xs bg-white border border-stone-200 rounded p-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Narrative Summary */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Metodologisk syntesenotat for denne studien:
            </label>
            <textarea
              rows={2}
              value={currentAssessment.summaryComment}
              onChange={(e) => handleUpdateDomain('summaryComment', e.target.value)}
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til Critical appraisal</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium text-xs flex items-center gap-2 shadow-sm transition"
        >
          <span>Gå videre til Trinn 7: Extraction (Dataekstraksjon)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
