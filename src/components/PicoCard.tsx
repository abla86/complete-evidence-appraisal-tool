import React, { useState } from 'react';
import { 
  Users, 
  Stethoscope, 
  GitCompare, 
  Target, 
  FileCheck, 
  Edit3, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { PicoDefinition } from '../types';

interface PicoCardProps {
  pico: PicoDefinition;
  onUpdatePico?: (newPico: PicoDefinition) => void;
  canEdit?: boolean;
}

export const PicoCard: React.FC<PicoCardProps> = ({
  pico,
  onUpdatePico,
  canEdit = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localPico, setLocalPico] = useState<PicoDefinition>(pico);

  const handleSave = () => {
    if (onUpdatePico) {
      onUpdatePico(localPico);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 rounded uppercase">
              Agent 1: PICO Specialist
            </span>
            <span className="text-xs text-slate-400">Trinn 1 av 6</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Strukturert PICO-rammeverk
          </h3>
          <p className="text-xs text-slate-400">
            Formulering av populasjon, intervensjon, kontrollgruppe og målbare utfallsmål for kunnskapsbasert praksis
          </p>
        </div>

        {canEdit && (
          <div>
            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lagre endringer</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Juster PICO</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* PICO 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Population */}
        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-2">
            <div className="p-1 rounded bg-sky-950/80 border border-sky-800/40">
              <Users className="w-4 h-4" />
            </div>
            <span>P &bull; Populasjon</span>
          </div>
          {isEditing ? (
            <textarea
              value={localPico.population}
              onChange={(e) => setLocalPico({ ...localPico, population: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 mt-1"
            />
          ) : (
            <p className="text-xs text-slate-200 leading-relaxed">
              {pico.population}
            </p>
          )}
          <span className="text-[10px] text-slate-500 mt-auto pt-2">
            Målgruppe for kunnskapsgrunnlaget
          </span>
        </div>

        {/* Intervention */}
        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
            <div className="p-1 rounded bg-emerald-950/80 border border-emerald-800/40">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span>I &bull; Intervensjon</span>
          </div>
          {isEditing ? (
            <textarea
              value={localPico.intervention}
              onChange={(e) => setLocalPico({ ...localPico, intervention: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 mt-1"
            />
          ) : (
            <p className="text-xs text-slate-200 leading-relaxed">
              {pico.intervention}
            </p>
          )}
          <span className="text-[10px] text-slate-500 mt-auto pt-2">
            Tiltak / behandling som evalueres
          </span>
        </div>

        {/* Comparison */}
        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            <div className="p-1 rounded bg-amber-950/80 border border-amber-800/40">
              <GitCompare className="w-4 h-4" />
            </div>
            <span>C &bull; Sammenligning</span>
          </div>
          {isEditing ? (
            <textarea
              value={localPico.comparison}
              onChange={(e) => setLocalPico({ ...localPico, comparison: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 mt-1"
            />
          ) : (
            <p className="text-xs text-slate-200 leading-relaxed">
              {pico.comparison}
            </p>
          )}
          <span className="text-[10px] text-slate-500 mt-auto pt-2">
            Kontrollgruppe / sedvanlig oppfølging
          </span>
        </div>

        {/* Outcomes */}
        <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-2">
            <div className="p-1 rounded bg-purple-950/80 border border-purple-800/40">
              <Target className="w-4 h-4" />
            </div>
            <span>O &bull; Utfall (Outcomes)</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-300">Primære utfallsmål:</div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {pico.primaryOutcomes.map((out, i) => (
                <li key={i} className="text-[11px] text-slate-300">{out}</li>
              ))}
            </ul>
            <div className="text-[11px] font-semibold text-slate-400 pt-1">Sekundære utfall:</div>
            <ul className="text-[11px] text-slate-400 space-y-0.5">
              {pico.secondaryOutcomes.map((sec, i) => (
                <li key={i}>&bull; {sec}</li>
              ))}
            </ul>
          </div>
          <span className="text-[10px] text-slate-500 mt-auto pt-2">
            Kliniske og pasientopplevde effektmål
          </span>
        </div>

      </div>

      {/* Bottom rationale & inclusion */}
      <div className="mt-4 p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300">
            <span className="font-semibold text-slate-200">Klinisk begrunnelse: </span>
            {pico.justification}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Designkrav:</span>
          {pico.studyDesigns.map((sd, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium text-slate-300 border border-slate-700">
              {sd}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
