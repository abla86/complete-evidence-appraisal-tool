import React, { useState, useMemo } from "react";
import { Dataset, StatisticalTestInfo } from "../types";
import { testsLibrary } from "../data/testsLibrary";
import {
  GitFork,
  ArrowRight,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Layers,
  HelpCircle,
  Play,
  RotateCcw,
  BookOpen,
  Filter,
  Check,
  ShieldCheck,
} from "lucide-react";
import {
  exportDecisionTreeToWord,
  exportDecisionTreeToExcel,
  triggerPrint,
} from "../utils/exportUtils";
import { ExportButtonGroup } from "./ExportButtonGroup";

interface VisualDecisionTreeProps {
  dataset?: Dataset;
  onSelectTest: (testId: string) => void;
  onNavigate: (tab: any) => void;
}

interface TreeNode {
  id: string;
  label: string;
  description: string;
  category: "goal" | "design" | "measure" | "test";
  testId?: string;
  isParametric?: boolean;
}

export const VisualDecisionTree: React.FC<VisualDecisionTreeProps> = ({
  dataset,
  onSelectTest,
  onNavigate,
}) => {
  // State for user's specific research variables and choices
  const [selectedGoal, setSelectedGoal] = useState<string>("two_groups");
  const [designType, setDesignType] = useState<string>("independent"); // 'independent' | 'paired'
  const [outcomeLevel, setOutcomeLevel] = useState<string>("scale"); // 'scale' | 'ordinal' | 'binary'
  const [isNormal, setIsNormal] = useState<string>("yes"); // 'yes' | 'no'

  // Custom or Dataset Variables
  const [useDatasetVars, setUseDatasetVars] = useState<boolean>(Boolean(dataset && dataset.variables.length > 0));
  const [ivName, setIvName] = useState<string>("gruppe");
  const [dvName, setDvName] = useState<string>("post_kognitiv");

  // Determine active recommended test based on selections
  const activeTestId = useMemo(() => {
    if (selectedGoal === "two_groups") {
      if (designType === "paired") {
        return isNormal === "no" || outcomeLevel === "ordinal"
          ? "wilcoxon-signed-rank"
          : "paired-t-test";
      }
      // independent
      return isNormal === "no" || outcomeLevel === "ordinal"
        ? "mann-whitney-u"
        : "independent-t-test";
    }

    if (selectedGoal === "multi_groups") {
      if (designType === "paired") {
        return "repeated-measures-anova";
      }
      return isNormal === "no" || outcomeLevel === "ordinal"
        ? "kruskal-wallis"
        : "one-way-anova";
    }

    if (selectedGoal === "correlation") {
      return outcomeLevel === "ordinal" || isNormal === "no"
        ? "spearman-correlation"
        : "pearson-correlation";
    }

    if (selectedGoal === "prediction") {
      return outcomeLevel === "binary"
        ? "logistic-regression"
        : "linear-regression";
    }

    if (selectedGoal === "categorical") {
      return "chi-square";
    }

    if (selectedGoal === "reliability") {
      return "cronbach-alpha";
    }

    if (selectedGoal === "covariate") {
      return "ancova";
    }

    return "independent-t-test";
  }, [selectedGoal, designType, outcomeLevel, isNormal]);

  const testInfo = useMemo(() => {
    return testsLibrary.find((t) => t.id === activeTestId) || testsLibrary[0];
  }, [activeTestId]);

  // Quick Preset Handlers
  const handleApplyPreset = (preset: {
    goal: string;
    design: string;
    level: string;
    normal: string;
    iv?: string;
    dv?: string;
  }) => {
    setSelectedGoal(preset.goal);
    setDesignType(preset.design);
    setOutcomeLevel(preset.level);
    setIsNormal(preset.normal);
    if (preset.iv) setIvName(preset.iv);
    if (preset.dv) setDvName(preset.dv);
  };

  // Export handlers
  const handleExportWord = () => {
    exportDecisionTreeToWord({
      goal: getGoalLabel(selectedGoal),
      designType: designType === "paired" ? "Paret / Gjentatte målinger (Within)" : "Uavhengige grupper (Between)",
      outcomeType: outcomeLevel === "scale" ? "Kontinuerlig / Skala" : outcomeLevel === "ordinal" ? "Ordinal / Rangert" : "Binær / Dikotom",
      isNormal: isNormal === "yes" ? "Ja, normalfordelt (eller N > 30)" : "Nei, skjevfordelt",
      recommendedTest: testInfo,
      userVars: { ivName, dvName },
    });
  };

  const handleExportExcel = () => {
    exportDecisionTreeToExcel({
      goal: getGoalLabel(selectedGoal),
      designType: designType === "paired" ? "Paret / Within" : "Uavhengig / Between",
      outcomeType: outcomeLevel,
      isNormal: isNormal === "yes" ? "Normalfordelt" : "Skjevfordelt",
      recommendedTest: testInfo.name,
      justification: testInfo.whenToUse,
      spssMenuPath: testInfo.spssMenuPath,
    });
  };

  function getGoalLabel(g: string): string {
    switch (g) {
      case "two_groups": return "Forskjell mellom 2 grupper";
      case "multi_groups": return "Forskjell mellom 3+ grupper";
      case "correlation": return "Bivariat sammenheng (korrelasjon)";
      case "prediction": return "Prediksjon / Årsaksforklaring";
      case "categorical": return "Kategoriske frekvenser / Krysstabell";
      case "reliability": return "Skalareliabilitet / Psykometri";
      case "covariate": return "Gruppeforskjell justert for kovariat";
      default: return g;
    }
  }

  // Predefined tree paths for the visual branch diagram
  const goalOptions = [
    { id: "two_groups", label: "2 Grupper", desc: "Intervensjon vs. Kontroll" },
    { id: "multi_groups", label: "3+ Grupper", desc: "Flere behandlingsarmer" },
    { id: "correlation", label: "Sammenheng", desc: "Korrelasjon mellom variabler" },
    { id: "prediction", label: "Prediksjon", desc: "Regresjon med prediktorer" },
    { id: "categorical", label: "Krysstabell", desc: "Kategoriske frekvenser" },
    { id: "reliability", label: "Reliabilitet", desc: "Cronbach's alpha på ledd" },
    { id: "covariate", label: "ANCOVA", desc: "Justere for baseline/kovariat" },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Interaktivt Beslutningsdiagram
              </span>
              <span className="text-xs text-slate-500 font-mono">
                APA 7 Standard • SPSS Syntax
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Visuelt Beslutningstre for Testvalg
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Koble dine forskningsvariabler direkte til beslutningstreet. Diagrammet belyser den metodiske stien fra problemstilling til anbefalt test.
            </p>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={handleExportWord}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
              title="Last ned metodebegrunnelse i Word (.doc)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Word (.doc)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
              title="Last ned beslutningsmatrise i Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={triggerPrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-300"
              title="Skriv ut eller lagre som PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>Skriv ut / PDF</span>
            </button>

            <button
              onClick={() => {
                onSelectTest(testInfo.id);
                onNavigate("analysis");
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Kjør testen</span>
            </button>
          </div>
        </div>

        {/* Research Variables Context Box */}
        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 -mx-5 -mb-5 p-5 rounded-b-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Dine forskningsvariabler i prosjektet:</span>
            </span>

            {/* Quick Presets Dropdown */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Raskt eksempel:</span>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "rct-2groups") {
                    handleApplyPreset({ goal: "two_groups", design: "independent", level: "scale", normal: "yes", iv: "gruppe", dv: "post_kognitiv" });
                  } else if (val === "paired-prepost") {
                    handleApplyPreset({ goal: "two_groups", design: "paired", level: "scale", normal: "yes", iv: "tidspunkt", dv: "kognitiv_skor" });
                  } else if (val === "3groups-pain") {
                    handleApplyPreset({ goal: "multi_groups", design: "independent", level: "scale", normal: "yes", iv: "behandling", dv: "smertereduksjon" });
                  } else if (val === "ordinal-nonparam") {
                    handleApplyPreset({ goal: "two_groups", design: "independent", level: "ordinal", normal: "no", iv: "gruppe", dv: "mestring" });
                  } else if (val === "corr-age-cog") {
                    handleApplyPreset({ goal: "correlation", design: "independent", level: "scale", normal: "yes", iv: "alder", dv: "post_kognitiv" });
                  } else if (val === "regression-pred") {
                    handleApplyPreset({ goal: "prediction", design: "independent", level: "scale", normal: "yes", iv: "etterlevelse", dv: "post_kognitiv" });
                  }
                }}
                className="text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Velg typisk studiedesign --</option>
                <option value="rct-2groups">Klinisk RCT: Intervensjon vs. Kontroll (Skala, N &gt; 30)</option>
                <option value="paired-prepost">Før-og-etter måling (Pre-Post paret test)</option>
                <option value="3groups-pain">3 Behandlingsgrupper (One-Way ANOVA)</option>
                <option value="ordinal-nonparam">Små utvalg / Likert-skala (Mann-Whitney U)</option>
                <option value="corr-age-cog">Sammenheng: Alder vs. Kognisjon (Pearson r)</option>
                <option value="regression-pred">Predikere utfall fra treningsetterlevelse (Regresjon)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Uavhengig variabel (IV) */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                Uavhengig variabel (IV)
              </span>
              {dataset && dataset.variables.length > 0 ? (
                <select
                  value={ivName}
                  onChange={(e) => setIvName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono bg-white"
                >
                  {dataset.variables.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.level})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ivName}
                  onChange={(e) => setIvName(e.target.value)}
                  placeholder="f.eks. Behandlingsgruppe"
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                />
              )}
              <span className="text-[10px] text-slate-500 block">
                {selectedGoal === "two_groups"
                  ? "2 kategorier (f.eks. Aktiv vs. Kontroll)"
                  : selectedGoal === "multi_groups"
                  ? "3+ kategorier"
                  : "Prediktor / X-variabel"}
              </span>
            </div>

            {/* Avhengig variabel (DV) */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                Avhengig variabel (DV / Utfall)
              </span>
              {dataset && dataset.variables.length > 0 ? (
                <select
                  value={dvName}
                  onChange={(e) => setDvName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1 font-mono bg-white"
                >
                  {dataset.variables.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.level})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={dvName}
                  onChange={(e) => setDvName(e.target.value)}
                  placeholder="f.eks. Kognitiv skår (0–30)"
                  className="w-full text-xs border border-slate-300 rounded px-2 py-1"
                />
              )}
              <span className="text-[10px] text-slate-500 block">
                Målenivå: {outcomeLevel === "scale" ? "Skala (Kontinuerlig)" : outcomeLevel === "ordinal" ? "Ordinal (Rangert)" : "Kategorisk"}
              </span>
            </div>

            {/* Design type */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                Uavhengighet (Design)
              </span>
              <div className="flex items-center space-x-1 pt-0.5">
                <button
                  onClick={() => setDesignType("independent")}
                  className={`flex-1 text-[11px] py-1 rounded font-medium transition-colors ${
                    designType === "independent"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Uavhengig (Between)
                </button>
                <button
                  onClick={() => setDesignType("paired")}
                  className={`flex-1 text-[11px] py-1 rounded font-medium transition-colors ${
                    designType === "paired"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Paret (Within)
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {designType === "paired" ? "Samme personer før/etter" : "Ulike personer i hver gruppe"}
              </span>
            </div>

            {/* Normality assumption */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                Normalfordeling
              </span>
              <div className="flex items-center space-x-1 pt-0.5">
                <button
                  onClick={() => setIsNormal("yes")}
                  className={`flex-1 text-[11px] py-1 rounded font-medium transition-colors ${
                    isNormal === "yes"
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Ja (Parametrisk)
                </button>
                <button
                  onClick={() => setIsNormal("no")}
                  className={`flex-1 text-[11px] py-1 rounded font-medium transition-colors ${
                    isNormal === "no"
                      ? "bg-amber-700 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Nei (Ikke-param.)
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {isNormal === "yes" ? "N > 30 eller bjelleformet" : "Skjevhet eller lite utvalg"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visual Graph Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-slate-900">
              Aktiv Beslutningssti (Klikk på noder for å utforske alternativer)
            </span>
          </div>
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
            Aktiv sti lyser grønt
          </span>
        </div>

        {/* Level 1: Formål / Problemstilling */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-semibold uppercase text-slate-700 tracking-wider">
              Nivå 1: Hovedformål med undersøkelsen
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {goalOptions.map((item) => {
              const isSelected = selectedGoal === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedGoal(item.id)}
                  className={`text-left p-2.5 rounded-lg border transition-all text-xs ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{item.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {item.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Connector Line */}
        <div className="flex justify-center -my-2">
          <div className="w-0.5 h-6 bg-slate-200 relative">
            <div className="absolute inset-0 bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Level 2: Design / Sammenligningsstruktur */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-semibold uppercase text-slate-700 tracking-wider">
              Nivå 2: Forskningsdesign & Uavhengighet
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setDesignType("independent")}
              className={`p-3 rounded-lg border text-left transition-all ${
                designType === "independent"
                  ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Uavhengige grupper (Between-Subjects)</span>
                {designType === "independent" && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Forskjellige deltakere i hver betingelse. Ingen paring eller gjentatte observasjoner.
              </p>
            </button>

            <button
              onClick={() => setDesignType("paired")}
              className={`p-3 rounded-lg border text-left transition-all ${
                designType === "paired"
                  ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Paret / Gjentatte målinger (Within-Subjects)</span>
                {designType === "paired" && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Samme deltakere måles over tid (f.eks. pre-test og post-test), eller matchede tvillingpar.
              </p>
            </button>
          </div>
        </div>

        {/* Connector Line */}
        <div className="flex justify-center -my-2">
          <div className="w-0.5 h-6 bg-slate-200 relative">
            <div className="absolute inset-0 bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Level 3: Målenivå & Forutsetning */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
              3
            </span>
            <span className="text-xs font-semibold uppercase text-slate-700 tracking-wider">
              Nivå 3: Målenivå & Forutsetning om Normalfordeling
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Scale + Normal */}
            <button
              onClick={() => {
                setOutcomeLevel("scale");
                setIsNormal("yes");
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                outcomeLevel === "scale" && isNormal === "yes"
                  ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Kontinuerlig Skala & Normalfordelt</span>
                {outcomeLevel === "scale" && isNormal === "yes" && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <span className="text-[10px] text-emerald-800 font-semibold uppercase block mt-0.5">
                Parametrisk analyse
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Intervall/forholdstall. N &gt; 30–50 per gruppe, eller tilnærmet bjelleformet fordeling.
              </p>
            </button>

            {/* Scale + Skewed OR Ordinal */}
            <button
              onClick={() => {
                setOutcomeLevel("ordinal");
                setIsNormal("no");
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                outcomeLevel === "ordinal" || isNormal === "no"
                  ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Ordinal eller Skjevfordelt</span>
                {(outcomeLevel === "ordinal" || isNormal === "no") && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <span className="text-[10px] text-amber-800 font-semibold uppercase block mt-0.5">
                Ikke-parametrisk analyse
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Likert-skalaer, rangeringer, eller kraftige avvik fra normalfordeling i små utvalg.
              </p>
            </button>

            {/* Binary / Nominal */}
            <button
              onClick={() => {
                setOutcomeLevel("binary");
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                outcomeLevel === "binary"
                  ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Dikotom / Kategorisk</span>
                {outcomeLevel === "binary" && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <span className="text-[10px] text-purple-800 font-semibold uppercase block mt-0.5">
                Kategorisk modellering
              </span>
              <p className="text-[11px] text-slate-600 mt-1">
                Utfallsvariabelen er todelt (Frisk / Syk, Bestått / Strøket, Ja / Nei).
              </p>
            </button>
          </div>
        </div>

        {/* Connector Line */}
        <div className="flex justify-center -my-2">
          <div className="w-0.5 h-6 bg-slate-200 relative">
            <div className="absolute inset-0 bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Level 4: Destination Node (Recommended Test) */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Anbefalt statistisk test for dine variabler</span>
              </span>
              <h3 className="text-xl font-bold text-white">
                {testInfo.name}
              </h3>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                onClick={() => {
                  onSelectTest(testInfo.id);
                  onNavigate("assumptions");
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 shadow-xs"
                title="Sjekk forutsetninger for denne testen mot datasettet"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sjekk forutsetninger</span>
              </button>

              <button
                onClick={() => {
                  onSelectTest(testInfo.id);
                  onNavigate("analysis");
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                title="Gå til analyse og kjør testen"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Kjør i analyse</span>
              </button>

              <ExportButtonGroup
                testInfo={testInfo}
                datasetName={dataset?.name || "SPSS Survival Manual"}
                apaNarrative={testInfo.apaExample}
              />
            </div>
          </div>

          {/* Test Specific Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60 space-y-2">
              <span className="font-semibold text-emerald-300 block">
                Hvorfor denne testen for dine data?
              </span>
              <p className="text-slate-300 leading-relaxed">
                {testInfo.whenToUse}
              </p>
              <div className="pt-2 border-t border-slate-700/60 text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-400">Uavhengig variabel (IV):</span> {ivName}
                </div>
                <div>
                  <span className="text-slate-400">Avhengig variabel (DV):</span> {dvName}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60 space-y-2">
              <span className="font-semibold text-emerald-300 block">
                SPSS Menyvei & Effektstørrelse
              </span>
              <div className="font-mono text-emerald-400 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 text-[11px]">
                {testInfo.spssMenuPath}
              </div>
              <div className="pt-2 border-t border-slate-700/60 text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-400">Effektstørrelsesmål:</span> {testInfo.effectSizeMetric}
                </div>
                {testInfo.nonParametricAlternative && (
                  <div>
                    <span className="text-slate-400">Ikke-parametrisk alternativ:</span> {testInfo.nonParametricAlternative}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* APA Example preview */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              APA 7 Rapporteringsmal:
            </span>
            <p className="text-xs font-serif italic text-slate-200 leading-relaxed">
              «{testInfo.apaExample}»
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
