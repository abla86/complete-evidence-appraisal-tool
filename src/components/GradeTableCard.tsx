import React, { useState } from 'react';
import { 
  Scale, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ShieldAlert,
  Edit2,
  Check
} from 'lucide-react';
import { GradeAssessment, GradeCertainty } from '../types';

interface GradeTableCardProps {
  assessments: GradeAssessment[];
  onUpdateCertainty?: (outcomeIndex: number, newCertainty: GradeCertainty) => void;
  canAdjust?: boolean;
}

export const GradeTableCard: React.FC<GradeTableCardProps> = ({
  assessments,
  onUpdateCertainty,
  canAdjust = true,
}) => {
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number | null>(0);

  const getCertaintyBadge = (certainty: GradeCertainty) => {
    switch (certainty) {
      case 'HIGH':
        return {
          label: 'HØY',
          color: 'bg-emerald-950 text-emerald-300 border-emerald-700',
          dots: '●●●●',
          desc: 'Vi har stor tillit til at den sanne effekten ligger nær den estimerte effekten.',
        };
      case 'MODERATE':
        return {
          label: 'MODERAT',
          color: 'bg-blue-950 text-blue-300 border-blue-700',
          dots: '●●●○',
          desc: 'Vi har moderat tillit til effektestimatet; den sanne effekten er sannsynligvis nær.',
        };
      case 'LOW':
        return {
          label: 'LAV',
          color: 'bg-amber-950 text-amber-300 border-amber-700',
          dots: '●●○○',
          desc: 'Vår tillit til effektestimatet er begrenset; den sanne effekten kan avvike vesentlig.',
        };
      case 'VERY_LOW':
        return {
          label: 'SVÆRT LAV',
          color: 'bg-rose-950 text-rose-300 border-rose-700',
          dots: '●○○○',
          desc: 'Vi har svært liten tillit til effektestimatet.',
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded uppercase">
              Agent 5: Evidence Agent
            </span>
            <span className="text-xs text-slate-400">Trinn 5 av 6</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            GRADE Evidensprofil & Summary of Findings (SoF)
          </h3>
          <p className="text-xs text-slate-400">
            Kvalitetsgradering av samlet kunnskapsgrunnlag for hvert definerte kliniske utfallsmål
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Internasjonal standard:</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
            GRADE Working Group
          </span>
        </div>
      </div>

      {/* Summary of Findings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3">Utfallsmål</th>
              <th className="py-3 px-2">Viktighet</th>
              <th className="py-3 px-2">Studier (Deltakere)</th>
              <th className="py-3 px-3">Relativ & Absolutt Effekt</th>
              <th className="py-3 px-3 text-center">GRADE Evidensstyrke</th>
              <th className="py-3 px-2 text-right">Detaljer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-sans">
            {assessments.map((assessment, idx) => {
              const badge = getCertaintyBadge(assessment.certainty);
              const isSelected = selectedOutcomeIndex === idx;

              return (
                <tr
                  key={idx}
                  onClick={() => setSelectedOutcomeIndex(idx)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-800/40' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-semibold text-slate-100">
                    {assessment.outcome}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      assessment.importance === 'KRITISK'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {assessment.importance}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-300">
                    {assessment.studyCount} RCTer <br />
                    <span className="text-[11px] text-slate-400">({assessment.participants} pasienter)</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono text-emerald-400 font-medium">
                      {assessment.relativeEffect}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {assessment.absoluteEffect}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex flex-col items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.color}`}>
                      <span>{badge.label}</span>
                      <span className="text-[9px] tracking-widest opacity-80">{badge.dots}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right text-emerald-400 font-medium">
                    {isSelected ? 'Aktiv' : 'Vis'} &rarr;
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detailed Domain Breakdown for Selected Outcome */}
      {selectedOutcomeIndex !== null && assessments[selectedOutcomeIndex] && (
        <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              GRADE Nedgraderingsdomener for: {assessments[selectedOutcomeIndex].outcome}
            </h4>
            
            {canAdjust && onUpdateCertainty && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Faglig overstyring:</span>
                {(['HIGH', 'MODERATE', 'LOW', 'VERY_LOW'] as GradeCertainty[]).map((cert) => (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => onUpdateCertainty(selectedOutcomeIndex, cert)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                      assessments[selectedOutcomeIndex].certainty === cert
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {cert === 'HIGH' ? 'Høy' : cert === 'MODERATE' ? 'Moderat' : cert === 'LOW' ? 'Lav' : 'Svært lav'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mb-3">
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block">Risiko for skjevhet</span>
              <span className="font-semibold text-slate-200">{assessments[selectedOutcomeIndex].riskOfBias}</span>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block">Inkonsistens</span>
              <span className="font-semibold text-slate-200">{assessments[selectedOutcomeIndex].inconsistency}</span>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block">Indirekthet</span>
              <span className="font-semibold text-slate-200">{assessments[selectedOutcomeIndex].indirectness}</span>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block">Upresisjon</span>
              <span className="font-semibold text-slate-200">{assessments[selectedOutcomeIndex].imprecision}</span>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 block">Publikasjonsskjevhet</span>
              <span className="font-semibold text-slate-200">{assessments[selectedOutcomeIndex].publicationBias}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
            <span className="font-semibold text-emerald-300">Klinisk fortolkning: </span>
            {assessments[selectedOutcomeIndex].clinicalInterpretation}
          </p>
        </div>
      )}
    </div>
  );
};
