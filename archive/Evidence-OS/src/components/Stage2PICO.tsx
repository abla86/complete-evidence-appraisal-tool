import React, { useState } from 'react';
import { Target, Sparkles, ArrowRight, Plus, Trash2, Tag, Check, ArrowLeft } from 'lucide-react';
import { PicoData } from '../types';

interface Stage2Props {
  data: PicoData;
  onChange: (updated: PicoData) => void;
  onNext: () => void;
  onPrev: () => void;
  language: 'no' | 'en';
}

export const Stage2PICO: React.FC<Stage2Props> = ({ data, onChange, onNext, onPrev, language }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [newSecondary, setNewSecondary] = useState('');

  const handleGenerateMesh = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'pico_mesh',
          payload: {
            population: data.population,
            intervention: data.intervention,
            comparison: data.comparison,
            outcome: data.primaryOutcome,
          },
          language,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const newMeshTerms = [
          {
            domain: 'P' as const,
            name: 'Population descriptors',
            textWords: d.population_terms?.filter((t: string) => !t.includes('[Mesh]')) || ['heart failure with preserved ejection fraction', 'HFpEF'],
            meshDescriptors: d.population_terms?.filter((t: string) => t.includes('[Mesh]')) || ['Heart Failure, Diastolic[Mesh]'],
          },
          {
            domain: 'I' as const,
            name: 'Intervention / Exposure descriptors',
            textWords: d.intervention_terms?.filter((t: string) => !t.includes('[Mesh]')) || ['SGLT2 inhibitor', 'dapagliflozin', 'empagliflozin'],
            meshDescriptors: d.intervention_terms?.filter((t: string) => t.includes('[Mesh]')) || ['Sodium-Glucose Transporter 2 Inhibitors[Mesh]'],
          },
          {
            domain: 'C' as const,
            name: 'Comparator descriptors',
            textWords: d.comparison_terms?.filter((t: string) => !t.includes('[Mesh]')) || ['placebo', 'standard care'],
            meshDescriptors: d.comparison_terms?.filter((t: string) => t.includes('[Mesh]')) || ['Placebos[Mesh]'],
          },
          {
            domain: 'O' as const,
            name: 'Outcome descriptors',
            textWords: d.outcome_terms?.filter((t: string) => !t.includes('[Mesh]')) || ['cardiovascular death', 'hospitalization', 'KCCQ'],
            meshDescriptors: d.outcome_terms?.filter((t: string) => t.includes('[Mesh]')) || ['Cardiovascular Diseases/mortality[Mesh]'],
          },
        ];

        onChange({
          ...data,
          meshTerms: newMeshTerms,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const addInclusion = () => {
    if (!newInclusion.trim()) return;
    onChange({ ...data, inclusionCriteria: [...data.inclusionCriteria, newInclusion.trim()] });
    setNewInclusion('');
  };

  const removeInclusion = (idx: number) => {
    onChange({ ...data, inclusionCriteria: data.inclusionCriteria.filter((_, i) => i !== idx) });
  };

  const addExclusion = () => {
    if (!newExclusion.trim()) return;
    onChange({ ...data, exclusionCriteria: [...data.exclusionCriteria, newExclusion.trim()] });
    setNewExclusion('');
  };

  const removeExclusion = (idx: number) => {
    onChange({ ...data, exclusionCriteria: data.exclusionCriteria.filter((_, i) => i !== idx) });
  };

  const addSecondary = () => {
    if (!newSecondary.trim()) return;
    onChange({ ...data, secondaryOutcomes: [...data.secondaryOutcomes, newSecondary.trim()] });
    setNewSecondary('');
  };

  const removeSecondary = (idx: number) => {
    onChange({ ...data, secondaryOutcomes: data.secondaryOutcomes.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stage Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 uppercase tracking-wider mb-1">
            <span>Trinn 2 av 10</span>
            <span>•</span>
            <span>Metodisk avgrensning</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            PICO / PECO Rammeverk
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Dekomponer forskningsspørsmålet i standardiserte domener for populasjon, intervensjon, komparator og utfall. Dette danner grunnlaget for søkematriser og screeningkriterier.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-300 p-1 bg-stone-100 text-xs font-medium">
            <button
              onClick={() => onChange({ ...data, frameworkType: 'PICO' })}
              className={`px-3 py-1 rounded ${data.frameworkType === 'PICO' ? 'bg-white shadow-xs text-stone-900 font-semibold' : 'text-stone-600'}`}
            >
              PICO (Intervensjon)
            </button>
            <button
              onClick={() => onChange({ ...data, frameworkType: 'PECO' })}
              className={`px-3 py-1 rounded ${data.frameworkType === 'PECO' ? 'bg-white shadow-xs text-stone-900 font-semibold' : 'text-stone-600'}`}
            >
              PECO (Eksponering)
            </button>
          </div>

          <button
            onClick={handleGenerateMesh}
            disabled={isAiLoading}
            className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className={`w-4 h-4 text-amber-600 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? 'Søker termer...' : 'Generer MeSH-termer'}</span>
          </button>
        </div>
      </div>

      {/* PICO Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Population */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center font-mono">
                P
              </span>
              <span className="font-semibold text-sm text-stone-900">
                Populasjon / Deltakere (Population)
              </span>
            </div>
            <span className="text-[10px] text-stone-500 uppercase font-mono">Deltakerkriterier</span>
          </div>
          <textarea
            rows={4}
            value={data.population}
            onChange={(e) => onChange({ ...data, population: e.target.value })}
            className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-lg p-3 focus:bg-white focus:outline-none focus:border-emerald-600 leading-relaxed transition"
            placeholder="Beskriv diagnose, aldersspenn, alvorlighetsgrad, klinisk kontekst..."
          />
        </div>

        {/* Intervention or Exposure */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                {data.frameworkType === 'PICO' ? 'I' : 'E'}
              </span>
              <span className="font-semibold text-sm text-stone-900">
                {data.frameworkType === 'PICO' ? 'Intervensjon (Intervention)' : 'Eksponering (Exposure)'}
              </span>
            </div>
            <span className="text-[10px] text-stone-500 uppercase font-mono">Aktiv behandling</span>
          </div>
          <textarea
            rows={4}
            value={data.intervention}
            onChange={(e) => onChange({ ...data, intervention: e.target.value })}
            className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-lg p-3 focus:bg-white focus:outline-none focus:border-emerald-600 leading-relaxed transition"
            placeholder="Legemiddelklasse, virkestoff, dose, administrasjonsmåte, varighet..."
          />
        </div>

        {/* Comparison / Control */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center font-mono">
                C
              </span>
              <span className="font-semibold text-sm text-stone-900">
                Sammenligning / Kontroll (Comparison)
              </span>
            </div>
            <span className="text-[10px] text-stone-500 uppercase font-mono">Kontrollgruppe</span>
          </div>
          <textarea
            rows={4}
            value={data.comparison}
            onChange={(e) => onChange({ ...data, comparison: e.target.value })}
            className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-lg p-3 focus:bg-white focus:outline-none focus:border-emerald-600 leading-relaxed transition"
            placeholder="Placebo, standard medisinsk behandling (usual care), eller aktiv komparator..."
          />
        </div>

        {/* Primary Outcome */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center font-mono">
                O
              </span>
              <span className="font-semibold text-sm text-stone-900">
                Primært utfallsmål (Primary Outcome)
              </span>
            </div>
            <span className="text-[10px] text-stone-500 uppercase font-mono">Hovedendepunkt</span>
          </div>
          <textarea
            rows={4}
            value={data.primaryOutcome}
            onChange={(e) => onChange({ ...data, primaryOutcome: e.target.value })}
            className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-lg p-3 focus:bg-white focus:outline-none focus:border-emerald-600 leading-relaxed transition"
            placeholder="Hvilket endepunkt er forhåndsspesifisert som primært? Definer målemetode og tidsramme..."
          />
        </div>
      </div>

      {/* Secondary Outcomes & Criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inclusion Criteria */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Inklusjonskriterier ({data.inclusionCriteria.length})
            </h3>
          </div>
          <div className="space-y-1.5">
            {data.inclusionCriteria.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-2 bg-stone-50 rounded border border-stone-200 text-xs">
                <span className="leading-relaxed flex-1 text-stone-800">• {c}</span>
                <button onClick={() => removeInclusion(i)} className="text-stone-400 hover:text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addInclusion()}
                placeholder="Nytt inklusjonskriterium..."
                className="flex-1 text-xs bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-emerald-600"
              />
              <button
                onClick={addInclusion}
                className="px-2.5 py-1.5 bg-stone-800 text-white rounded text-xs hover:bg-stone-700"
              >
                Legg til
              </button>
            </div>
          </div>
        </div>

        {/* Exclusion Criteria */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="font-semibold text-sm text-stone-900 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-500" />
              Eksklusjonskriterier ({data.exclusionCriteria.length})
            </h3>
          </div>
          <div className="space-y-1.5">
            {data.exclusionCriteria.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-2 bg-stone-50 rounded border border-stone-200 text-xs">
                <span className="leading-relaxed flex-1 text-stone-800">• {c}</span>
                <button onClick={() => removeExclusion(i)} className="text-stone-400 hover:text-rose-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExclusion()}
                placeholder="Nytt eksklusjonskriterium..."
                className="flex-1 text-xs bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-600"
              />
              <button
                onClick={addExclusion}
                className="px-2.5 py-1.5 bg-stone-800 text-white rounded text-xs hover:bg-stone-700"
              >
                Legg til
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MeSH and Synonym Terms Table */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-stone-900">
              MeSH (Medical Subject Headings) & Tekstord-kartlegging
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Styrer den systematiske oversettelsen til PubMed- og Cochrane-syntaks i neste trinn.
            </p>
          </div>
          <Tag className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.meshTerms.map((m, idx) => (
            <div key={idx} className="p-3.5 rounded-lg border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-stone-800 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                  {m.domain}
                </span>
                <span className="text-xs font-semibold text-stone-900 truncate">
                  {m.name}
                </span>
              </div>

              <div>
                <div className="text-[10px] uppercase font-mono font-bold text-stone-500 mb-1">
                  Kontrollerte MeSH-termer:
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.meshDescriptors.map((md, mi) => (
                    <span key={mi} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px]">
                      {md}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-mono font-bold text-stone-500 mb-1">
                  Synonymer / Tekstord [tiab]:
                </div>
                <div className="flex flex-wrap gap-1">
                  {m.textWords.map((tw, ti) => (
                    <span key={ti} className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px]">
                      {tw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til Forskningsspørsmål</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium text-xs flex items-center gap-2 shadow-sm transition"
        >
          <span>Gå videre til Trinn 3: Search (Søkestrategi)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
