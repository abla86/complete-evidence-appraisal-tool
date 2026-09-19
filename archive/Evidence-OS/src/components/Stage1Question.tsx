import React, { useState } from 'react';
import { HelpCircle, Sparkles, CheckCircle2, ArrowRight, BookOpen, AlertCircle, Plus, Trash2, FileSignature } from 'lucide-react';
import { ResearchQuestionData, QuestionType } from '../types';

interface Stage1Props {
  data: ResearchQuestionData;
  onChange: (updated: ResearchQuestionData) => void;
  onNext: () => void;
  language: 'no' | 'en';
}

export const Stage1Question: React.FC<Stage1Props> = ({ data, onChange, onNext, language }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [newSecondary, setNewSecondary] = useState('');

  const handleAiRefine = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'refine_question',
          payload: {
            question: data.primaryQuestion,
            context: data.contextRationale,
          },
          language,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        onChange({
          ...data,
          primaryQuestion: d.refined_question || data.primaryQuestion,
          secondaryQuestions: d.key_hypotheses || data.secondaryQuestions,
          lastModified: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const addSecondaryQuestion = () => {
    if (!newSecondary.trim()) return;
    onChange({
      ...data,
      secondaryQuestions: [...data.secondaryQuestions, newSecondary.trim()],
    });
    setNewSecondary('');
  };

  const removeSecondary = (idx: number) => {
    onChange({
      ...data,
      secondaryQuestions: data.secondaryQuestions.filter((_, i) => i !== idx),
    });
  };

  const questionTypes: { id: QuestionType; label: string; desc: string }[] = [
    { id: 'intervention', label: 'Intervensjon / Terapi', desc: 'Effekt av et legemiddel, kirurgi, atferdsendring vs kontroll.' },
    { id: 'prognosis', label: 'Prognose', desc: 'Forløp over tid, risikofaktorer for sykdomsutfall.' },
    { id: 'diagnosis', label: 'Diagnostisk nøyaktighet', desc: 'Sensitivitet, spesifisitet av en test mot gullstandard.' },
    { id: 'etiology', label: 'Etiologi / Skaderisiko', desc: 'Årsakssammenhenger og eksponering for skadelige agenser.' },
    { id: 'qualitative', label: 'Kvalitativ / Erfaringer', desc: 'Pasientopplevelser, barrierer, holdninger og akseptabilitet.' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stage Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 uppercase tracking-wider mb-1">
            <span>Trinn 1 av 10</span>
            <span>•</span>
            <span>Konseptuell forankring</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Forskningsspørsmål (Research Question)
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Definer et presist, avgrenset og forskningsetisk forankret spørsmål. Et stringent formulert spørsmål legger fundamentet for hele oversikten og styrer PICO, søk og inklusjon.
          </p>
        </div>

        <button
          onClick={handleAiRefine}
          disabled={isAiLoading}
          className="px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium text-xs flex items-center gap-2 transition self-start md:self-auto shadow-sm"
        >
          <Sparkles className={`w-4 h-4 text-amber-600 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span>{isAiLoading ? 'Forbedrer med AI...' : 'Presiser med AI'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Title */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Tittel på oversiktsartikkelen / protokollen
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => onChange({ ...data, title: e.target.value })}
                className="w-full text-base font-semibold text-stone-900 bg-stone-50 border border-stone-300 rounded-lg px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            {/* Primary Question */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Primært forskningsspørsmål
              </label>
              <textarea
                rows={3}
                value={data.primaryQuestion}
                onChange={(e) => onChange({ ...data, primaryQuestion: e.target.value })}
                className="w-full text-sm text-stone-900 bg-stone-50 border border-stone-300 rounded-lg p-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                placeholder="F.eks.: Hva er effekten av [intervensjon] sammenlignet med [kontroll] på [utfall] hos [populasjon]?"
              />
            </div>

            {/* Question Archetype */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Problemstillingens type (Study Type Category)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {questionTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onChange({ ...data, questionType: t.id })}
                    className={`text-left p-3 rounded-lg border text-xs transition ${
                      data.questionType === t.id
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-medium'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="font-semibold text-stone-900">{t.label}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background / Context */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Bakgrunn, klinisk kontekst & kunnskapshull
              </label>
              <textarea
                rows={3}
                value={data.contextRationale}
                onChange={(e) => onChange({ ...data, contextRationale: e.target.value })}
                className="w-full text-xs text-stone-800 bg-stone-50 border border-stone-300 rounded-lg p-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                placeholder="Hvorfor gjennomføres denne systematiske oversikten? Hva er det eksisterende kunnskapsgrunnlaget og det kliniske behovet?"
              />
            </div>

            {/* Secondary Questions */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                Sekundære forskningsspørsmål / Hypoteser ({data.secondaryQuestions.length})
              </label>
              <div className="space-y-2">
                {data.secondaryQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-800">
                    <span className="font-mono text-stone-500 font-semibold mt-0.5">{idx + 1}.</span>
                    <span className="flex-1 leading-relaxed">{q}</span>
                    <button
                      onClick={() => removeSecondary(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 transition"
                      title="Slett sekundært spørsmål"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSecondary}
                    onChange={(e) => setNewSecondary(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSecondaryQuestion()}
                    placeholder="Legg til sekundært spørsmål..."
                    className="flex-1 text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    onClick={addSecondaryQuestion}
                    className="px-3 py-2 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-stone-700 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Legg til</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: FINER Audit & Protocol info */}
        <div className="space-y-6">
          {/* Protocol Registration Card */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
              <FileSignature className="w-4 h-4 text-emerald-600" />
              <span>Protokollregistrering (PROSPERO)</span>
            </div>
            <p className="text-xs text-stone-500">
              Forhåndsregistrering i internasjonale registre som PROSPERO forhindrer duplisering og sikrer metodisk transparens iht. PRISMA.
            </p>
            <input
              type="text"
              value={data.protocolRegistration}
              onChange={(e) => onChange({ ...data, protocolRegistration: e.target.value })}
              placeholder="e.g. PROSPERO CRD42024..."
              className="w-full text-xs font-mono bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* FINER Framework evaluation */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>FINER Kriteriesjekk</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Metodisk audit
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-800">F - Feasible (Gjennomførbart)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded font-bold bg-emerald-100 text-emerald-800">
                    {data.finer.feasible.score}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">{data.finer.feasible.note}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-800">I - Interesting (Interessant)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded font-bold bg-emerald-100 text-emerald-800">
                    {data.finer.interesting.score}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">{data.finer.interesting.note}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-800">N - Novel (Ny kunnskap)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded font-bold bg-emerald-100 text-emerald-800">
                    {data.finer.novel.score}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">{data.finer.novel.note}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-800">E - Ethical (Etisk forsvarlig)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded font-bold bg-emerald-100 text-emerald-800">
                    {data.finer.ethical.score}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">{data.finer.ethical.note}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-800">R - Relevant (Beslutningsrelevant)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded font-bold bg-emerald-100 text-emerald-800">
                    {data.finer.relevant.score}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-normal">{data.finer.relevant.note}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Footer: Next Stage CTA */}
      <div className="flex justify-end pt-4 border-t border-stone-200">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium text-xs flex items-center gap-2 shadow-sm transition"
        >
          <span>Gå videre til Trinn 2: PICO / PECO</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
