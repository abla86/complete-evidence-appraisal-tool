import React from 'react';
import { ChecklistCriterion, CriterionEvaluation, FrameworkType } from '@/types/frameworks';
import { FullAppraisalRecord } from '@/schemas/appraisal.schema';
import { Study } from '@/schemas/study.schema';
import { exportAppraisalToJson } from '@/lib/export/generateJson';
import { printAppraisalReport } from '@/lib/export/generatePdf';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Download, Printer, Award } from 'lucide-react';

interface ScoreSummaryProps {
  appraisal: FullAppraisalRecord;
  criteria: ChecklistCriterion[];
  study?: Study;
  onUpdateAppraisal: (updated: Partial<FullAppraisalRecord>) => void;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  appraisal,
  criteria,
  study,
  onUpdateAppraisal,
}) => {
  const evaluationsMap = new Map<string, CriterionEvaluation>(
    appraisal.evaluations.map((e) => [e.criterionId, e])
  );

  // Metric counts
  let yesCount = 0;
  let noCount = 0;
  let unclearCount = 0;
  let naCount = 0;
  let mandatoryYes = 0;
  let mandatoryTotal = 0;
  let totalEvidenceAnchors = 0;

  criteria.forEach(c => {
    const ev = evaluationsMap.get(c.id);
    const resp = ev?.response || 'UNCLEAR';
    if (resp === 'YES') yesCount++;
    else if (resp === 'NO') noCount++;
    else if (resp === 'UNCLEAR') unclearCount++;
    else if (resp === 'NOT_APPLICABLE') naCount++;

    if (c.mandatory) {
      mandatoryTotal++;
      if (resp === 'YES') mandatoryYes++;
    }

    if (ev?.evidenceAnchors) {
      totalEvidenceAnchors += ev.evidenceAnchors.length;
    }
  });

  const totalCriteria = criteria.length;
  const completionPercentage = Math.round(((totalCriteria - unclearCount) / (totalCriteria || 1)) * 100);

  // Suggested quality rating computation
  const computeSuggestedRating = (): FullAppraisalRecord['overallRiskOrQuality'] => {
    const mandatoryMissing = mandatoryTotal - mandatoryYes;
    if (mandatoryMissing >= 2 || noCount >= 4) {
      return 'CRITICALLY_LOW';
    }
    if (mandatoryMissing === 1 || noCount >= 2) {
      return 'LOW';
    }
    if (unclearCount >= 3 || noCount === 1) {
      return 'MODERATE';
    }
    return 'HIGH';
  };

  const suggestedRating = computeSuggestedRating();

  const getQualityBadge = (rating: FullAppraisalRecord['overallRiskOrQuality']) => {
    switch (rating) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            HØY KVALITET / LAV RISIKO
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            MODERAT KVALITET
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            LAV KVALITET / HØY RISIKO
          </span>
        );
      case 'CRITICALLY_LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-200 text-red-950 border border-red-400">
            <AlertOctagon className="w-4 h-4 text-red-700" />
            KRITISK LAV KVALITET
          </span>
        );
    }
  };

  const handleRatingSelect = (val: FullAppraisalRecord['overallRiskOrQuality']) => {
    onUpdateAppraisal({ overallRiskOrQuality: val });
  };

  const handleExportJson = () => {
    exportAppraisalToJson(appraisal, study);
  };

  const handlePrint = () => {
    printAppraisalReport(appraisal, study, criteria);
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-6 shadow-lg gap-6 border-t-4 border-t-blue-600">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Vurderingssammendrag & Kvalitetsdom</h3>
          </div>
          <p className="text-xs text-slate-500">
            Evaluator: <strong className="text-slate-700">{appraisal.evaluatorName}</strong> • Sist oppdatert:{' '}
            {new Date(appraisal.updatedAt).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" />
            Skriv ut / PDF
          </Button>
          <Button size="sm" variant="primary" onClick={handleExportJson} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Eksporter JSON
          </Button>
        </div>
      </div>

      {/* Primary Score & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Quality Rating Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Samlet metodisk vurdering
            </span>
            <div className="mt-2.5">{getQualityBadge(appraisal.overallRiskOrQuality)}</div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500">Foreslått algoritme:</span>
            <span className="font-semibold text-slate-700">{suggestedRating}</span>
          </div>
        </div>

        {/* Mandatory Criteria Status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Obligatoriske kriterier
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {mandatoryYes} / {mandatoryTotal}
              </span>
              <span className="text-xs text-slate-500 font-medium">oppfylt</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs">
            {mandatoryYes === mandatoryTotal ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Alle obligatoriske kriterier innfridd
              </span>
            ) : (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {mandatoryTotal - mandatoryYes} kritiske mangler registrert
              </span>
            )}
          </div>
        </div>

        {/* Evidence Citations Attached */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Forankrede sitater (evidens)
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{totalEvidenceAnchors}</span>
              <span className="text-xs text-slate-500 font-medium">tekstankere i studien</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
            Gjennomsnitt: {(totalEvidenceAnchors / (totalCriteria || 1)).toFixed(1)} sitat per kriterium
          </div>
        </div>
      </div>

      {/* Response Breakdown Progress Bar */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Responsfordeling ({totalCriteria} kriterier):</span>
          <span className="text-slate-500">{completionPercentage}% gjennomgått</span>
        </div>

        {/* Stacked bar */}
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
          <div style={{ width: `${(yesCount / totalCriteria) * 100}%` }} className="bg-emerald-500" title={`Ja: ${yesCount}`} />
          <div style={{ width: `${(noCount / totalCriteria) * 100}%` }} className="bg-rose-500" title={`Nei: ${noCount}`} />
          <div style={{ width: `${(unclearCount / totalCriteria) * 100}%` }} className="bg-amber-400" title={`Uklart: ${unclearCount}`} />
          <div style={{ width: `${(naCount / totalCriteria) * 100}%` }} className="bg-slate-400" title={`Ikke aktuelt: ${naCount}`} />
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1 text-center text-xs">
          <div className="p-1.5 bg-emerald-50 text-emerald-900 rounded font-medium border border-emerald-200">
            Ja: {yesCount}
          </div>
          <div className="p-1.5 bg-rose-50 text-rose-900 rounded font-medium border border-rose-200">
            Nei: {noCount}
          </div>
          <div className="p-1.5 bg-amber-50 text-amber-900 rounded font-medium border border-amber-200">
            Uklart: {unclearCount}
          </div>
          <div className="p-1.5 bg-slate-100 text-slate-700 rounded font-medium border border-slate-200">
            I.A.: {naCount}
          </div>
        </div>
      </div>

      {/* Override overall rating selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Sett endelig samlet kvalitetsnivå:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['HIGH', 'MODERATE', 'LOW', 'CRITICALLY_LOW'] as FullAppraisalRecord['overallRiskOrQuality'][]).map(
            (lvl) => {
              const active = appraisal.overallRiskOrQuality === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleRatingSelect(lvl)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {lvl === 'HIGH' && 'Høy kvalitet'}
                  {lvl === 'MODERATE' && 'Moderat'}
                  {lvl === 'LOW' && 'Lav'}
                  {lvl === 'CRITICALLY_LOW' && 'Kritisk lav'}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Synthesis / Overall Summary Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 block">
          Samlet metodisk syntese og konklusjon:
        </label>
        <textarea
          rows={3}
          value={appraisal.summaryNotes || ''}
          onChange={(e) => onUpdateAppraisal({ summaryNotes: e.target.value })}
          placeholder="Oppsummer studiens vesentlige styrker og metodiske begrensninger, og hvordan resultatene bør tolkes i en kunnskapsoppsummering..."
          className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 leading-relaxed"
        />
      </div>
    </div>
  );
};
