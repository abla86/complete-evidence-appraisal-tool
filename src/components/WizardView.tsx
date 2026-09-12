import React, { useState } from "react";
import { Dataset } from "../types";
import { testsLibrary } from "../data/testsLibrary";
import { TabId } from "./Navigation";
import { VisualDecisionTree } from "./VisualDecisionTree";
import {
  HelpCircle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  BookOpen,
  GitFork,
  ListOrdered,
  FileText,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import {
  exportDecisionTreeToWord,
  exportDecisionTreeToExcel,
  triggerPrint,
} from "../utils/exportUtils";

interface WizardViewProps {
  dataset?: Dataset;
  onSelectTest: (testId: string) => void;
  onNavigate: (tab: TabId) => void;
}

export const WizardView: React.FC<WizardViewProps> = ({
  dataset,
  onSelectTest,
  onNavigate,
}) => {
  // Mode switcher: 'visual_tree' vs 'step_by_step'
  const [viewMode, setViewMode] = useState<"visual_tree" | "step_by_step">(
    "visual_tree"
  );

  // Wizard State for step-by-step
  const [goal, setGoal] = useState<string>("");
  const [numGroups, setNumGroups] = useState<string>("");
  const [outcomeType, setOutcomeType] = useState<string>("");
  const [designType, setDesignType] = useState<string>("");
  const [isNormal, setIsNormal] = useState<string>("");

  const resetWizard = () => {
    setGoal("");
    setNumGroups("");
    setOutcomeType("");
    setDesignType("");
    setIsNormal("");
  };

  // Determine recommendation based on choices
  const getRecommendation = () => {
    if (!goal) return null;

    if (goal === "two_groups") {
      if (designType === "paired") {
        if (isNormal === "no") return "wilcoxon-signed-rank";
        return "paired-t-test";
      }
      if (designType === "independent") {
        if (isNormal === "no" || outcomeType === "ordinal") return "mann-whitney-u";
        return "independent-t-test";
      }
    }

    if (goal === "multi_groups") {
      if (designType === "paired") {
        return "repeated-measures-anova";
      }
      if (isNormal === "no" || outcomeType === "ordinal") {
        return "kruskal-wallis";
      }
      return "one-way-anova";
    }

    if (goal === "time_change") {
      if (numGroups === "2") {
        if (isNormal === "no") return "wilcoxon-signed-rank";
        return "paired-t-test";
      }
      return "repeated-measures-anova";
    }

    if (goal === "correlation") {
      if (outcomeType === "ordinal" || isNormal === "no") {
        return "spearman-correlation";
      }
      return "pearson-correlation";
    }

    if (goal === "prediction") {
      if (outcomeType === "binary") {
        return "logistic-regression";
      }
      return "linear-regression";
    }

    if (goal === "categorical") {
      return "chi-square";
    }

    if (goal === "reliability") {
      return "cronbach-alpha";
    }

    if (goal === "covariate") {
      return "ancova";
    }

    return null;
  };

  const recommendedTestId = getRecommendation();
  const testInfo = testsLibrary.find((t) => t.id === recommendedTestId);

  const handleExportWord = () => {
    if (!testInfo) return;
    exportDecisionTreeToWord({
      goal: goal || "Forskningsproblemstilling",
      designType: designType || "Uavhengige grupper",
      outcomeType: outcomeType || "Skala",
      isNormal: isNormal === "yes" ? "Normalfordelt" : "Skjevfordelt",
      recommendedTest: testInfo,
    });
  };

  const handleExportExcel = () => {
    if (!testInfo) return;
    exportDecisionTreeToExcel({
      goal: goal || "Forskningsproblemstilling",
      designType: designType || "Uavhengig",
      outcomeType: outcomeType || "Skala",
      isNormal: isNormal === "yes" ? "Normalfordelt" : "Skjevfordelt",
      recommendedTest: testInfo.name,
      justification: testInfo.whenToUse,
      spssMenuPath: testInfo.spssMenuPath,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("visual_tree")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "visual_tree"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <GitFork className="w-4 h-4 text-emerald-400" />
            <span>Visuelt Beslutningstre (Diagram)</span>
          </button>

          <button
            onClick={() => setViewMode("step_by_step")}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "step_by_step"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ListOrdered className="w-4 h-4 text-emerald-400" />
            <span>Stegvis Veileder (Spørsmål)</span>
          </button>
        </div>

        {dataset && (
          <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
            Aktivt datasett: <strong className="text-slate-700">{dataset.name}</strong>
          </span>
        )}
      </div>

      {/* Render View Mode */}
      {viewMode === "visual_tree" ? (
        <VisualDecisionTree
          dataset={dataset}
          onSelectTest={onSelectTest}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Stegvis spørreveileder
                </span>
                <h1 className="text-xl font-bold text-slate-900">
                  «Hvilken test skal jeg velge?»
                </h1>
                <p className="text-sm text-slate-600">
                  Svar på spørsmålene under for å navigere stegvis til anbefalt analyse.
                </p>
              </div>
              {(goal || numGroups || outcomeType || designType || isNormal) && (
                <button
                  onClick={resetWizard}
                  className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start på nytt</span>
                </button>
              )}
            </div>
          </div>

      {/* Step 1: Research Goal */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h2 className="text-sm font-semibold text-slate-900">
            Hva ønsker du å undersøke?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {[
            { id: "two_groups", label: "Forskjell mellom to grupper", desc: "F.eks. Intervensjon vs. Kontroll" },
            { id: "multi_groups", label: "Forskjell mellom 3+ grupper", desc: "F.eks. 3 ulike behandlingsformer" },
            { id: "time_change", label: "Endring over tid / før-etter", desc: "Målt på samme personer (pre-post)" },
            { id: "correlation", label: "Sammenheng mellom variabler", desc: "Korrelasjon mellom to kontinuerlige målinger" },
            { id: "prediction", label: "Prediksjon / Årsaksforklaring", desc: "Regresjonsmodell med prediktorer" },
            { id: "categorical", label: "Kategoriske data (krysstabell)", desc: "F.eks. Kjønn vs. Fullføringsgrad" },
            { id: "reliability", label: "Reliabilitet / Spørreskjema", desc: "Cronbach's alpha på Likert-skala" },
            { id: "covariate", label: "Justere for kovariat (ANCOVA)", desc: "Gruppe-sammenligning med kontrollvariabel" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setGoal(item.id);
                // Reset downstream
                setNumGroups("");
                setDesignType("");
                setIsNormal("");
              }}
              className={`text-left p-3 rounded-lg border transition-all ${
                goal === item.id
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                {item.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Design & Independence (conditional) */}
      {goal && ["two_groups", "multi_groups", "time_change"].includes(goal) && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-semibold text-slate-900">
              Er målingene uavhengige eller fra de samme personene?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setDesignType("independent")}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                designType === "independent"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Uavhengige grupper (Between-groups)
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Ulike personer i hver gruppe (f.eks. person A er i intervensjon, person B er i kontroll).
              </div>
            </button>

            <button
              onClick={() => setDesignType("paired")}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                designType === "paired"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Paret design / Gjentatte målinger (Within-groups)
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Samme personer måles flere ganger (f.eks. før og etter intervensjon, eller matchede par).
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Outcome Variable Type */}
      {goal && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              {["two_groups", "multi_groups", "time_change"].includes(goal) ? "3" : "2"}
            </span>
            <h2 className="text-sm font-semibold text-slate-900">
              Hva slags målenivå har utfallsvariabelen (avhengig variabel)?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => setOutcomeType("scale")}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                outcomeType === "scale"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Kontinuerlig / Skala
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Intervall eller forholdstall: alder, reaksjonstid, vekt, blodtrykk, kognitiv totalskår.
              </div>
            </button>

            <button
              onClick={() => setOutcomeType("ordinal")}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                outcomeType === "ordinal"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Ordinal / Rangert
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Rangerte kategorier uten fast intervall: Likert-skalaer (1–5), smerteskalaer, utdanningsnivå.
              </div>
            </button>

            <button
              onClick={() => setOutcomeType("binary")}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                outcomeType === "binary"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Kategorisk / Todelt (Binær)
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Rene grupper/dikotome: Ja/Nei, Frisk/Syk, Bestått/Strøket, Kvinne/Mann.
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Normality */}
      {goal && outcomeType === "scale" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="text-sm font-semibold text-slate-900">
              Er dataene tilnærmet normalfordelte i utvalget?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setIsNormal("yes")}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                isNormal === "yes"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Ja, tilnærmet normalfordelt (eller N &gt; 30–50)
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Histogrammet er bjelleformet, skewness/kurtosis er innenfor ±1.96, eller Shapiro-Wilk p &gt; .05.
              </div>
            </button>

            <button
              onClick={() => setIsNormal("no")}
              className={`text-left p-3.5 rounded-lg border transition-all ${
                isNormal === "no"
                  ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="text-xs font-semibold text-slate-900">
                Nei, skjevfordelt eller små utvalg med avvik
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Tydelig høyreskjevhet, venstreskjevhet, mange uteliggere, eller lite utvalg (N &lt; 20).
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Result Card: Recommendation & Justification */}
      {testInfo && (
        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                Anbefalt statistisk analyse
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {testInfo.name}
              </h2>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                onClick={handleExportWord}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
                title="Last ned metodebegrunnelse i Word (.doc)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Word (.doc)</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
                title="Last ned beslutningsmatrise i Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={triggerPrint}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
                title="Skriv ut eller lagre som PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>Skriv ut / PDF</span>
              </button>

              <button
                onClick={() => {
                  onSelectTest(testInfo.id);
                  onNavigate("analysis");
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Kjør i appen</span>
              </button>
            </div>
          </div>

          {/* Detailed Justification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
              <div className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Hvorfor akkurat denne testen?</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {testInfo.whenToUse}
              </p>
              <div className="pt-2 border-t border-slate-700/60">
                <span className="font-medium text-slate-400">Eksempelproblemstilling:</span>
                <p className="text-slate-200 italic mt-0.5">
                  «{testInfo.exampleQuestion}»
                </p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
              <div className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>SPSS menyvei</span>
              </div>
              <p className="font-mono text-emerald-400 text-xs bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800">
                {testInfo.spssMenuPath}
              </p>
              <div className="pt-2 border-t border-slate-700/60">
                <span className="font-medium text-slate-400">Effektstørrelsesmål:</span>
                <p className="text-slate-200 mt-0.5">{testInfo.effectSizeMetric}</p>
              </div>
            </div>
          </div>

          {/* Hypotheses */}
          <div className="bg-slate-800/50 p-3.5 rounded-lg border border-slate-700/50 space-y-1.5 text-xs">
            <div className="font-semibold text-slate-300">Hypoteser for denne analysen:</div>
            <div className="text-slate-300 font-mono text-xs">{testInfo.h0}</div>
            <div className="text-emerald-300 font-mono text-xs">{testInfo.h1}</div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
