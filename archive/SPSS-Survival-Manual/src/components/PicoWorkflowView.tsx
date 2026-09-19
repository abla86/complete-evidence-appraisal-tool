import React, { useState } from "react";
import { Workflow, ArrowRight, CheckCircle2, Stethoscope, Sparkles, BookOpen } from "lucide-react";
import { TabId } from "./Navigation";

interface PicoPreset {
  title: string;
  population: string;
  intervention: string;
  comparison: string;
  outcome: string;
  independentVar: string;
  dependentVar: string;
  h0: string;
  h1: string;
  recommendedTest: string;
  clinicalImplication: string;
}

interface PicoWorkflowViewProps {
  onNavigate: (tab: TabId) => void;
}

export const PicoWorkflowView: React.FC<PicoWorkflowViewProps> = ({ onNavigate }) => {
  const presets: PicoPreset[] = [
    {
      title: "Helse: Kroniske korsryggsmerter (RCT)",
      population: "Voksne pasienter (18–65 år) med kroniske uspesifikke korsryggsmerter > 3 måneder",
      intervention: "Kognitiv funksjonell terapi (CFT) + veiledet fysisk aktivitet",
      comparison: "Standard fysioterapi (trening og passiv behandling)",
      outcome: "Smertereduksjon målt med Visuell Analog Skala (VAS, 0–10) etter 12 uker",
      independentVar: "Behandlingsgruppe (Dikotom: CFT vs. Kontroll)",
      dependentVar: "VAS smertereduksjon (Kontinuerlig / Skala)",
      h0: "H₀: Ingen forskjell i gjennomsnittlig smertereduksjon mellom CFT og standard fysioterapi (μ₁ = μ₂).",
      h1: "H₁: CFT gir signifikant større smertereduksjon enn standard fysioterapi (μ₁ > μ₂).",
      recommendedTest: "Independent-Samples T-Test (eller ANCOVA med baseline-smerte som kovariat)",
      clinicalImplication:
        "Dersom forskjellen overskrider den minste klinisk viktige forskjellen (MCID på 1.5–2.0 cm på VAS), bør retningslinjer oppdateres til å anbefale kognitiv funksjonell terapi fremfor passiv behandling.",
    },
    {
      title: "Psykisk helse: Arbeidsrelatert stress og utbrenthet",
      population: "Helsepersonell på sykehusavdelinger med høyt arbeidspress",
      intervention: "8-ukers digitalt mindfulness- og mestringsprogram",
      comparison: "Ventelistekontroll",
      outcome: "Perceived Stress Scale (PSS-10) og Maslach Burnout Inventory",
      independentVar: "Intervensjonsgruppe (Mindfulness vs. Venteliste)",
      dependentVar: "PSS-10 stress-skår (Skala 0–40)",
      h0: "H₀: Det er ingen forskjell i stressreduksjon mellom mindfulness og kontrollgruppe.",
      h1: "H₁: Mindfulness reduserer stressnivået signifikant sammenlignet med venteliste.",
      recommendedTest: "Repeated-Measures ANOVA eller Independent-samples t-test på differanseskår",
      clinicalImplication:
        "Lavterskel digitale tiltak kan implementeres institusjonelt for å forebygge sykmeldinger blant nøkkelpersonell.",
    },
    {
      title: "Eldreomsorg: Fallforebygging og kognisjon",
      population: "Hjemmeboende eldre over 75 år",
      intervention: "Kombinert styrketrening og kognitiv stimulering",
      comparison: "Kun styrketrening alene",
      outcome: "Timed Up and Go (TUG, sekunder) og MoCA kognitiv test",
      independentVar: "Treningsform (Kombinert vs. Kun styrke)",
      dependentVar: "TUG gangtid i sekunder (Kontinuerlig)",
      h0: "H₀: Kombinert trening forbedrer ikke ganghastighet mer enn styrketrening alene.",
      h1: "H₁: Kombinert trening gir signifikant raskere TUG-tid.",
      recommendedTest: "Independent-Samples T-Test",
      clinicalImplication:
        "En reduksjon i TUG-tid på > 1.5 sekunder reduserer fallrisiko og akuttinnleggelser signifikant.",
    },
  ];

  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const current = presets[selectedPresetIndex];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Evidensbasert Praksis
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Fra PICO-spørsmål til Klinisk Beslutning
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            I helse- og samfunnsvitenskap starter god forskning med PICO (Population, Intervention, Comparison, Outcome).
            Her kobler du det faglige spørsmålet direkte til SPSS-variabler, testvalg og klinisk nytteverdi.
          </p>
        </div>

        {/* Presets Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <span className="text-xs font-medium text-slate-500">Eksempel:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPresetIndex(idx)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedPresetIndex === idx
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 bg-slate-100 hover:bg-slate-200"
              }`}
            >
              {p.title.split(":")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* PICO Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
            P
          </div>
          <span className="text-xs font-semibold text-slate-900 block pt-1">Population (Pasienter)</span>
          <p className="text-xs text-slate-600 leading-relaxed">{current.population}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
            I
          </div>
          <span className="text-xs font-semibold text-slate-900 block pt-1">Intervention (Tiltak)</span>
          <p className="text-xs text-slate-600 leading-relaxed">{current.intervention}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
            C
          </div>
          <span className="text-xs font-semibold text-slate-900 block pt-1">Comparison (Kontroll)</span>
          <p className="text-xs text-slate-600 leading-relaxed">{current.comparison}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1">
          <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
            O
          </div>
          <span className="text-xs font-semibold text-slate-900 block pt-1">Outcome (Utfall)</span>
          <p className="text-xs text-slate-600 leading-relaxed">{current.outcome}</p>
        </div>
      </div>

      {/* Direct Translation to SPSS Variables & Statistical Design */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Workflow className="w-5 h-5 text-emerald-600" />
          <span>Oversettelse til SPSS & Forskningsdesign</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-900 block">Variabler i SPSS:</span>
            <div className="space-y-1.5 text-slate-700">
              <div>
                <span className="font-medium text-slate-900">Uavhengig variabel (IV):</span>{" "}
                {current.independentVar}
              </div>
              <div>
                <span className="font-medium text-slate-900">Avhengig variabel (DV):</span>{" "}
                {current.dependentVar}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-900 block">Hypoteser:</span>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="text-slate-700">{current.h0}</div>
              <div className="text-emerald-800 font-medium">{current.h1}</div>
            </div>
          </div>
        </div>

        {/* Recommended Test */}
        <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-400">Anbefalt analyse:</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {current.recommendedTest}
            </div>
          </div>
          <button
            onClick={() => onNavigate("wizard")}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors shadow-xs self-start sm:self-center"
          >
            <span>Åpne i Analyseveileder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clinical Implication Box */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-950">
            <Stethoscope className="w-4 h-4 text-emerald-700" />
            <span>Kunnskapsbasert praksis: Kan dette endre klinisk virkelighet?</span>
          </div>
          <p className="text-emerald-900 leading-relaxed">
            {current.clinicalImplication}
          </p>
        </div>
      </div>
    </div>
  );
};
