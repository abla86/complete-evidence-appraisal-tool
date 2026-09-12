import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Settings2, 
  Database, 
  CheckCircle2, 
  HelpCircle,
  FileSearch,
  BookOpen,
  FastForward,
  RotateCcw
} from 'lucide-react';
import { DEFAULT_CLINICAL_TASK } from '../data/evidenceCorpus';

interface TaskInputCardProps {
  prompt: string;
  setPrompt: (p: string) => void;
  isRunning: boolean;
  onStartPipeline: (autoRun: boolean) => void;
  currentStep: number;
}

const PRESET_TASKS = [
  {
    label: 'Demens & Kognitiv stimulering (Hovedoppgave)',
    text: DEFAULT_CLINICAL_TASK,
    category: 'Geriatri / Nevropsykologi',
  },
  {
    label: 'Musikkterapi ved depresjon hos eldre',
    text: 'Finn forskning om effekten av miljøterapeutisk musikkterapi ved aldersdepresjon, vurder evidensen med CASP og GRADE og lag et beslutningsgrunnlag.',
    category: 'Psykisk helse',
  },
  {
    label: 'Fallforebyggende balansetrening på sykehjem',
    text: 'Vurder evidensen for multifaktoriell fallforebygging og styrketrening blant sykehjemsbeboere med høy fallrisiko for et kommunalt vedtak.',
    category: 'Kommunehelse',
  },
];

export const TaskInputCard: React.FC<TaskInputCardProps> = ({
  prompt,
  setPrompt,
  isRunning,
  onStartPipeline,
  currentStep,
}) => {
  const [selectedDbs, setSelectedDbs] = useState<string[]>([
    'PubMed (MEDLINE)',
    'Cochrane Library (CENTRAL)',
    'Embase',
    'Epistemonikos'
  ]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const toggleDb = (db: string) => {
    if (selectedDbs.includes(db)) {
      if (selectedDbs.length > 1) {
        setSelectedDbs(selectedDbs.filter(d => d !== db));
      }
    } else {
      setSelectedDbs([...selectedDbs, db]);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
            Oppdragsdefinisjon
          </span>
          <h2 className="text-xl font-bold text-white mt-0.5">
            Klinisk evidensforespørsel
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Kilder ({selectedDbs.length})</span>
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          disabled={isRunning || currentStep > 0}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans disabled:opacity-75"
          placeholder="Skriv inn klinisk problemstilling..."
        />
        {prompt === DEFAULT_CLINICAL_TASK && (
          <div className="absolute right-3 bottom-3 hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" />
            Standard testoppdrag
          </div>
        )}
      </div>

      {/* Preset Tasks Pills */}
      {currentStep === 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Eksempler:
          </span>
          {PRESET_TASKS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(preset.text)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                prompt === preset.text
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Advanced Settings: Databases */}
      {showAdvancedSettings && (
        <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs">
          <span className="font-semibold text-slate-300 block mb-2">Tilkoblede evidensdatabaser & registre:</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              'PubMed (MEDLINE)',
              'Cochrane Library (CENTRAL)',
              'Embase',
              'Epistemonikos',
              'PsycINFO',
              'Helsebiblioteket'
            ].map(db => (
              <label 
                key={db}
                className="flex items-center gap-2 p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850"
              >
                <input
                  type="checkbox"
                  checked={selectedDbs.includes(db)}
                  onChange={() => toggleDb(db)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-400"
                />
                <span className="text-slate-300 text-[11px]">{db}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Execution Buttons */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
        <div className="text-xs text-slate-400 flex items-center gap-2 w-full sm:w-auto">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Regelsett: PRISMA 2020 &bull; AMSTAR-2 &bull; CASP &bull; GRADE
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {currentStep === 0 ? (
            <>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => onStartPipeline(false)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all hover:text-white"
              >
                <span>Trinnvis analyse</span>
              </button>

              <button
                type="button"
                disabled={isRunning}
                onClick={() => onStartPipeline(true)}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Kjør autonom agentrute</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Arbeidsflyt aktiv: Trinn {currentStep} av 6
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
