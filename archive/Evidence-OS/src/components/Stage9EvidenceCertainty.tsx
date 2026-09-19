import React, { useState } from 'react';
import { Award, Sparkles, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, Info, Table } from 'lucide-react';
import { GradeAssessment, GradeRating, GradeCertainty } from '../types';

interface Stage9Props {
  grade: GradeAssessment;
  onChange: (updated: GradeAssessment) => void;
  onNext: () => void;
  onPrev: () => void;
  language: 'no' | 'en';
}

export const Stage9EvidenceCertainty: React.FC<Stage9Props> = ({
  grade,
  onChange,
  onNext,
  onPrev,
  language,
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Helper to recompute overall certainty based on downgrades
  const calculateCertainty = (
    rob: GradeRating,
    incons: GradeRating,
    indir: GradeRating,
    imprec: GradeRating,
    pub: GradeRating
  ): GradeCertainty => {
    let score = 4; // Start at High for RCTs

    if (rob === 'serious') score -= 1;
    if (rob === 'very_serious') score -= 2;

    if (incons === 'serious') score -= 1;
    if (incons === 'very_serious') score -= 2;

    if (indir === 'serious') score -= 1;
    if (indir === 'very_serious') score -= 2;

    if (imprec === 'serious') score -= 1;
    if (imprec === 'very_serious') score -= 2;

    if (pub === 'suspected') score -= 1;
    if (pub === 'strongly_suspected') score -= 2;

    if (score >= 4) return 'High';
    if (score === 3) return 'Moderate';
    if (score === 2) return 'Low';
    return 'Very Low';
  };

  const handleUpdateDomain = (field: keyof GradeAssessment, value: any) => {
    const updated = {
      ...grade,
      [field]: value,
    };

    const newCertainty = calculateCertainty(
      field === 'riskOfBias' ? value : updated.riskOfBias,
      field === 'inconsistency' ? value : updated.inconsistency,
      field === 'indirectness' ? value : updated.indirectness,
      field === 'imprecision' ? value : updated.imprecision,
      field === 'publicationBias' ? value : updated.publicationBias,
    );

    onChange({
      ...updated,
      overallCertainty: newCertainty,
    });
  };

  const handleAiGrade = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'grade_assess',
          payload: {
            outcome: grade.outcomeName,
            studiesCount: grade.studyCount,
            pooledEffect: grade.relativeEffect,
            ci: '0.73 to 0.87',
            i2: 0,
            robSummary: 'Low risk of bias in major randomized trials',
          },
          language,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const newCertainty = (d.certainty || grade.overallCertainty) as GradeCertainty;
        onChange({
          ...grade,
          overallCertainty: newCertainty,
          plainLanguageSummary: d.plainLanguageSummary || grade.plainLanguageSummary,
          imprecisionExplanation: d.imprecisionExplanation || grade.imprecisionExplanation,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderGradeSymbols = (c: GradeCertainty) => {
    switch (c) {
      case 'High':
        return (
          <span className="font-mono text-emerald-700 font-bold tracking-widest text-sm">
            ⊕⊕⊕⊕ Høy
          </span>
        );
      case 'Moderate':
        return (
          <span className="font-mono text-sky-700 font-bold tracking-widest text-sm">
            ⊕⊕⊕◯ Moderat
          </span>
        );
      case 'Low':
        return (
          <span className="font-mono text-amber-700 font-bold tracking-widest text-sm">
            ⊕⊕◯◯ Lav
          </span>
        );
      case 'Very Low':
        return (
          <span className="font-mono text-rose-700 font-bold tracking-widest text-sm">
            ⊕◯◯◯ Svært lav
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 uppercase tracking-wider mb-1">
            <span>Trinn 9 av 10</span>
            <span>•</span>
            <span>GRADE Evidensprofil</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Evidenssikkerhet (GRADE Evidence Certainty)
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Vurder tilliten til evidensgrunnlaget ved hjelp av GRADE-rammeverket (Grading of Recommendations Assessment, Development and Evaluation). Evaluer de fem nedgraderingsdomenene og generer Summary of Findings (SoF)-tabell.
          </p>
        </div>

        <button
          onClick={handleAiGrade}
          disabled={isAiLoading}
          className="px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium text-xs flex items-center gap-2 transition self-start md:self-auto shadow-sm"
        >
          <Sparkles className={`w-4 h-4 text-amber-600 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span>{isAiLoading ? 'Kalkulerer GRADE...' : 'AI GRADE-assistent'}</span>
        </button>
      </div>

      {/* Summary of Findings (SoF) Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-xs text-stone-900 uppercase tracking-wider">
              Summary of Findings (SoF) Tabell (iht. GRADE / Cochrane)
            </span>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-bold">
            {renderGradeSymbols(grade.overallCertainty)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 border-b border-stone-200 font-mono text-[11px]">
                <th className="p-3">Utfallsmål (Outcomes)</th>
                <th className="p-3">Antatt risiko: Kontroll</th>
                <th className="p-3">Antatt risiko: Intervensjon</th>
                <th className="p-3">Relativ effekt (95% KI)</th>
                <th className="p-3 text-center">Deltakere (Studier)</th>
                <th className="p-3 text-center">Evidenssikkerhet (GRADE)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="divide-x divide-stone-100">
                <td className="p-3 font-semibold text-stone-900 max-w-xs">
                  {grade.outcomeName}
                </td>
                <td className="p-3 font-mono text-stone-700">
                  {grade.absoluteRiskControl} per 1 000
                </td>
                <td className="p-3 font-mono text-emerald-900 font-bold">
                  {grade.absoluteRiskIntervention} per 1 000
                  <span className="block text-[10px] text-emerald-700 font-normal mt-0.5">
                    ({grade.riskDifferencePer1000} færre)
                  </span>
                </td>
                <td className="p-3 font-mono text-stone-800 font-bold">
                  {grade.relativeEffect}
                </td>
                <td className="p-3 text-center font-mono">
                  <div className="font-bold text-stone-900">{grade.participantsCount.toLocaleString()}</div>
                  <div className="text-[10px] text-stone-500">({grade.studyCount} RCTs)</div>
                </td>
                <td className="p-3 text-center">
                  {renderGradeSymbols(grade.overallCertainty)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Plain Language GRADE Statement */}
        <div className="p-4 bg-emerald-50/40 border-t border-emerald-100 text-xs text-emerald-950 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-bold uppercase font-mono text-[10px] text-emerald-800">
              GRADE Klarspråksoppsummering:
            </span>
            <p className="leading-relaxed">{grade.plainLanguageSummary}</p>
          </div>
        </div>
      </div>

      {/* GRADE 5 Downgrading Domains Workbench */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-stone-200 pb-3">
          <h3 className="text-base font-bold text-stone-900">
            De fem GRADE nedgraderingskriteriene
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Randomiserte kontrollerte studier starter med Høy sikkerhet (4 poeng). Vurder eventuell nedgradering for metodiske begrensninger.
          </p>
        </div>

        <div className="space-y-4 divide-y divide-stone-100">
          {/* Domain 1: Risk of Bias */}
          <div className="pt-4 first:pt-0 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-stone-900">
                  1. Studiebegrensninger / Risk of bias
                </span>
                <p className="text-[11px] text-stone-500">
                  Skjevhetsrisiko i primærstudiene (Cochrane RoB 2).
                </p>
              </div>

              <select
                value={grade.riskOfBias}
                onChange={(e) => handleUpdateDomain('riskOfBias', e.target.value as GradeRating)}
                className="text-xs bg-stone-50 border border-stone-300 rounded px-2.5 py-1 font-semibold text-stone-900"
              >
                <option value="none">Ingen alvorlig nedgradering (0)</option>
                <option value="serious">Alvorlig begrensning (-1)</option>
                <option value="very_serious">Svært alvorlig begrensning (-2)</option>
              </select>
            </div>
            <input
              type="text"
              value={grade.riskOfBiasExplanation}
              onChange={(e) => handleUpdateDomain('riskOfBiasExplanation', e.target.value)}
              placeholder="Begrunnelse..."
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded px-3 py-1.5 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Domain 2: Inconsistency */}
          <div className="pt-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-stone-900">
                  2. Inkonsistens (Inconsistency)
                </span>
                <p className="text-[11px] text-stone-500">
                  Variasjon og sprik i effektstørrelser mellom studier (I²-heterogenitet).
                </p>
              </div>

              <select
                value={grade.inconsistency}
                onChange={(e) => handleUpdateDomain('inconsistency', e.target.value as GradeRating)}
                className="text-xs bg-stone-50 border border-stone-300 rounded px-2.5 py-1 font-semibold text-stone-900"
              >
                <option value="none">Ingen alvorlig nedgradering (0)</option>
                <option value="serious">Alvorlig inkonsistens (-1)</option>
                <option value="very_serious">Svært alvorlig inkonsistens (-2)</option>
              </select>
            </div>
            <input
              type="text"
              value={grade.inconsistencyExplanation}
              onChange={(e) => handleUpdateDomain('inconsistencyExplanation', e.target.value)}
              placeholder="Begrunnelse for heterogenitet..."
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded px-3 py-1.5 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Domain 3: Indirectness */}
          <div className="pt-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-stone-900">
                  3. Indirekthet (Indirectness)
                </span>
                <p className="text-[11px] text-stone-500">
                  Avvik mellom populasjon, intervensjon eller utfall i studiene mot det kliniske spørsmålet.
                </p>
              </div>

              <select
                value={grade.indirectness}
                onChange={(e) => handleUpdateDomain('indirectness', e.target.value as GradeRating)}
                className="text-xs bg-stone-50 border border-stone-300 rounded px-2.5 py-1 font-semibold text-stone-900"
              >
                <option value="none">Ingen alvorlig nedgradering (0)</option>
                <option value="serious">Alvorlig indirekthet (-1)</option>
                <option value="very_serious">Svært alvorlig indirekthet (-2)</option>
              </select>
            </div>
            <input
              type="text"
              value={grade.indirectnessExplanation}
              onChange={(e) => handleUpdateDomain('indirectnessExplanation', e.target.value)}
              placeholder="Begrunnelse for indirekthet..."
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded px-3 py-1.5 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Domain 4: Imprecision */}
          <div className="pt-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-stone-900">
                  4. Upresisjon (Imprecision)
                </span>
                <p className="text-[11px] text-stone-500">
                  Brede konfidensintervaller eller for få hendelser i forhold til optimal informasjonsstørrelse (OIS).
                </p>
              </div>

              <select
                value={grade.imprecision}
                onChange={(e) => handleUpdateDomain('imprecision', e.target.value as GradeRating)}
                className="text-xs bg-stone-50 border border-stone-300 rounded px-2.5 py-1 font-semibold text-stone-900"
              >
                <option value="none">Ingen alvorlig nedgradering (0)</option>
                <option value="serious">Alvorlig upresisjon (-1)</option>
                <option value="very_serious">Svært alvorlig upresisjon (-2)</option>
              </select>
            </div>
            <input
              type="text"
              value={grade.imprecisionExplanation}
              onChange={(e) => handleUpdateDomain('imprecisionExplanation', e.target.value)}
              placeholder="Begrunnelse for presisjon..."
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded px-3 py-1.5 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Domain 5: Publication Bias */}
          <div className="pt-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-stone-900">
                  5. Publikasjonsskjevhet (Publication Bias)
                </span>
                <p className="text-[11px] text-stone-500">
                  Asymmetri i trakteplott (funnel plot) eller manglende registrering av negative funn.
                </p>
              </div>

              <select
                value={grade.publicationBias}
                onChange={(e) => handleUpdateDomain('publicationBias', e.target.value as GradeRating)}
                className="text-xs bg-stone-50 border border-stone-300 rounded px-2.5 py-1 font-semibold text-stone-900"
              >
                <option value="none">Uoppdaget / Ikke mistenkt (0)</option>
                <option value="suspected">Mistenkt (-1)</option>
                <option value="strongly_suspected">Sterkt mistenkt (-2)</option>
              </select>
            </div>
            <input
              type="text"
              value={grade.publicationBiasExplanation}
              onChange={(e) => handleUpdateDomain('publicationBiasExplanation', e.target.value)}
              placeholder="Begrunnelse..."
              className="w-full text-xs bg-stone-50 border border-stone-200 rounded px-3 py-1.5 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til Syntese</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium text-xs flex items-center gap-2 shadow-sm transition"
        >
          <span>Gå videre til Trinn 10: Reproducible report</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
