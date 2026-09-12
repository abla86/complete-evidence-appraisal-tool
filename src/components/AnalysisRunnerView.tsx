import React, { useState, useMemo } from "react";
import { Dataset } from "../types";
import { testsLibrary } from "../data/testsLibrary";
import {
  calculateDescriptives,
  calculateIndependentTTest,
  calculatePairedTTest,
  calculateOneWayAnova,
  calculateCorrelation,
  calculateLinearRegression,
  calculateMannWhitneyU,
  calculateCronbachAlpha,
  calculateChiSquare,
} from "../utils/statisticsEngine";
import {
  Play,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  FileText,
  ChevronDown,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  ShieldAlert,
  ArrowRightCircle,
  Sparkles,
} from "lucide-react";
import {
  exportAnalysisToWord,
  exportAnalysisToExcel,
  triggerPrint,
} from "../utils/exportUtils";
import { validateTestAssumptions } from "../utils/validationEngine";
import { ExportButtonGroup } from "./ExportButtonGroup";

interface AnalysisRunnerViewProps {
  dataset: Dataset;
  selectedTestId?: string;
}

export const AnalysisRunnerView: React.FC<AnalysisRunnerViewProps> = ({
  dataset,
  selectedTestId = "independent-t-test",
}) => {
  const [activeTestId, setActiveTestId] = useState<string>(selectedTestId);
  const [copied, setCopied] = useState(false);

  // Variable mappings state
  const [selectedGroupVar, setSelectedGroupVar] = useState<string>("gruppe");
  const [selectedOutcomeVar, setSelectedOutcomeVar] = useState<string>("post_kognitiv");
  const [selectedPairPre, setSelectedPairPre] = useState<string>("pre_kognitiv");
  const [selectedPairPost, setSelectedPairPost] = useState<string>("post_kognitiv");
  const [selectedVarX, setSelectedVarX] = useState<string>("alder");
  const [selectedVarY, setSelectedVarY] = useState<string>("post_kognitiv");

  const currentTest = testsLibrary.find((t) => t.id === activeTestId) || testsLibrary[0];

  // Live Assumption Validation against current dataset and selected variables
  const assumptionValidation = useMemo(() => {
    return validateTestAssumptions(activeTestId, dataset, {
      ivName:
        activeTestId.includes("t-test") ||
        activeTestId.includes("anova") ||
        activeTestId.includes("mann-whitney") ||
        activeTestId.includes("kruskal")
          ? selectedGroupVar
          : undefined,
      dvName:
        activeTestId.includes("t-test") ||
        activeTestId.includes("anova") ||
        activeTestId.includes("mann-whitney") ||
        activeTestId.includes("kruskal")
          ? selectedOutcomeVar
          : undefined,
      pairPre: selectedPairPre,
      pairPost: selectedPairPost,
      varX: selectedVarX,
      varY: selectedVarY,
    });
  }, [
    activeTestId,
    dataset,
    selectedGroupVar,
    selectedOutcomeVar,
    selectedPairPre,
    selectedPairPost,
    selectedVarX,
    selectedVarY,
  ]);

  // Helpers to get column data from dataset
  const getColumnData = (colName: string): any[] => {
    return dataset.rows.map((r) => r[colName] ?? r[colName.toLowerCase()]);
  };

  const getNumericColumn = (colName: string): number[] => {
    return getColumnData(colName)
      .map(Number)
      .filter((n) => !isNaN(n));
  };

  // Run the analysis dynamically
  const testResults = useMemo(() => {
    if (activeTestId === "independent-t-test") {
      const groups = Array.from(new Set(getColumnData(selectedGroupVar).filter(Boolean)));
      const g1Label = String(groups[0] || "Gruppe 1");
      const g2Label = String(groups[1] || "Gruppe 2");

      const g1Values = dataset.rows
        .filter((r) => String(r[selectedGroupVar] ?? r[selectedGroupVar.toLowerCase()]) === g1Label)
        .map((r) => Number(r[selectedOutcomeVar] ?? r[selectedOutcomeVar.toLowerCase()]))
        .filter((n) => !isNaN(n));

      const g2Values = dataset.rows
        .filter((r) => String(r[selectedGroupVar] ?? r[selectedGroupVar.toLowerCase()]) === g2Label)
        .map((r) => Number(r[selectedOutcomeVar] ?? r[selectedOutcomeVar.toLowerCase()]))
        .filter((n) => !isNaN(n));

      if (g1Values.length > 1 && g2Values.length > 1) {
        return calculateIndependentTTest(g1Values, g2Values, g1Label, g2Label);
      }
    }

    if (activeTestId === "paired-t-test") {
      const pre = getNumericColumn(selectedPairPre);
      const post = getNumericColumn(selectedPairPost);
      if (pre.length > 2 && post.length > 2) {
        return calculatePairedTTest(pre, post, selectedPairPre, selectedPairPost);
      }
    }

    if (activeTestId === "one-way-anova") {
      // Group by program or gruppe
      const groupVar = dataset.variables.find((v) => v.level === "nominal")?.name || "program";
      const outcomeVar =
        dataset.variables.find((v) => v.level === "scale" && v.name !== "id" && v.name !== "alder")?.name ||
        "smertereduksjon";

      const categories = Array.from(new Set(getColumnData(groupVar).filter(Boolean)));
      const groupsData = categories.map((cat) => ({
        name: String(cat),
        values: dataset.rows
          .filter((r) => String(r[groupVar] ?? r[groupVar.toLowerCase()]) === String(cat))
          .map((r) => Number(r[outcomeVar] ?? r[outcomeVar.toLowerCase()]))
          .filter((n) => !isNaN(n)),
      }));

      if (groupsData.length >= 2 && groupsData.every((g) => g.values.length > 0)) {
        return calculateOneWayAnova(groupsData);
      }
    }

    if (activeTestId === "pearson-correlation" || activeTestId === "spearman-correlation") {
      const x = getNumericColumn(selectedVarX);
      const y = getNumericColumn(selectedVarY);
      const method = activeTestId === "spearman-correlation" ? "spearman" : "pearson";
      if (x.length > 2 && y.length > 2) {
        return calculateCorrelation(x, y, selectedVarX, selectedVarY, method);
      }
    }

    if (activeTestId === "linear-regression") {
      const x = getNumericColumn(selectedVarX);
      const y = getNumericColumn(selectedVarY);
      if (x.length > 2 && y.length > 2) {
        return calculateLinearRegression(x, y, selectedVarX, selectedVarY);
      }
    }

    if (activeTestId === "mann-whitney-u") {
      const groups = Array.from(new Set(getColumnData(selectedGroupVar).filter(Boolean)));
      const g1Label = String(groups[0] || "Gruppe 1");
      const g2Label = String(groups[1] || "Gruppe 2");

      const g1Values = dataset.rows
        .filter((r) => String(r[selectedGroupVar] ?? r[selectedGroupVar.toLowerCase()]) === g1Label)
        .map((r) => Number(r[selectedOutcomeVar] ?? r[selectedOutcomeVar.toLowerCase()]))
        .filter((n) => !isNaN(n));

      const g2Values = dataset.rows
        .filter((r) => String(r[selectedGroupVar] ?? r[selectedGroupVar.toLowerCase()]) === g2Label)
        .map((r) => Number(r[selectedOutcomeVar] ?? r[selectedOutcomeVar.toLowerCase()]))
        .filter((n) => !isNaN(n));

      if (g1Values.length > 1 && g2Values.length > 1) {
        return calculateMannWhitneyU(g1Values, g2Values, g1Label, g2Label);
      }
    }

    if (activeTestId === "cronbach-alpha") {
      // Find items
      const itemCols = dataset.variables.filter((v) => v.name.toLowerCase().startsWith("item"));
      if (itemCols.length >= 2) {
        const itemNames = itemCols.map((c) => c.name);
        const matrix = dataset.rows.map((r) => itemNames.map((name) => Number(r[name])));
        return calculateCronbachAlpha(matrix, itemNames);
      }
    }

    if (activeTestId === "chi-square") {
      const nomVars = dataset.variables.filter((v) => v.level === "nominal");
      if (nomVars.length >= 2) {
        const v1 = getColumnData(nomVars[0].name);
        const v2 = getColumnData(nomVars[1].name);
        return calculateChiSquare(v1, v2);
      }
    }

    return null;
  }, [
    activeTestId,
    dataset,
    selectedGroupVar,
    selectedOutcomeVar,
    selectedPairPre,
    selectedPairPost,
    selectedVarX,
    selectedVarY,
  ]);

  // Generate APA string
  const apaText = useMemo(() => {
    if (!testResults) return currentTest.apaExample;

    if (activeTestId === "independent-t-test") {
      const res = testResults as any;
      const isSig = res.pValue < 0.05;
      return `Det ble gjennomført en to-utvalgs t-test (independent-samples t-test) for å sammenligne ${selectedOutcomeVar} mellom ${res.group1Stats.name} og ${res.group2Stats.name}. Det var en ${
        isSig ? "statistisk signifikant" : "ikke-signifikant"
      } forskjell mellom ${res.group1Stats.name} (M = ${res.group1Stats.mean.toFixed(2)}, SD = ${
        res.group1Stats.sd.toFixed(2)
      }) og ${res.group2Stats.name} (M = ${res.group2Stats.mean.toFixed(2)}, SD = ${
        res.group2Stats.sd.toFixed(2)
      }), t(${res.df}) = ${res.t.toFixed(2)}, p ${
        res.pValue < 0.001 ? "< .001" : "= " + res.pValue.toFixed(3)
      }, 95% CI [${res.ciLower.toFixed(2)}, ${res.ciUpper.toFixed(2)}], Cohen's d = ${res.cohensD.toFixed(2)}.`;
    }

    if (activeTestId === "paired-t-test") {
      const res = testResults as any;
      const isSig = res.pValue < 0.05;
      return `En paret t-test (paired-samples t-test) viste en ${
        isSig ? "statistisk signifikant" : "ikke-signifikant"
      } endring fra ${res.group1Stats.name} (M = ${res.group1Stats.mean.toFixed(2)}, SD = ${
        res.group1Stats.sd.toFixed(2)
      }) til ${res.group2Stats.name} (M = ${res.group2Stats.mean.toFixed(2)}, SD = ${
        res.group2Stats.sd.toFixed(2)
      }), t(${res.df}) = ${res.t.toFixed(2)}, p ${
        res.pValue < 0.001 ? "< .001" : "= " + res.pValue.toFixed(3)
      }, 95% CI [${res.ciLower.toFixed(2)}, ${res.ciUpper.toFixed(2)}], d = ${res.cohensD.toFixed(2)}.`;
    }

    if (activeTestId === "one-way-anova") {
      const res = testResults as any;
      return `En enveis variansanalyse (One-Way ANOVA) indikerte en ${
        res.pValue < 0.05 ? "statistisk signifikant" : "ikke-signifikant"
      } forskjell mellom gruppene, F(${res.dfBetween}, ${res.dfWithin}) = ${res.f.toFixed(2)}, p ${
        res.pValue < 0.001 ? "< .001" : "= " + res.pValue.toFixed(3)
      }, η² = ${res.etaSquared.toFixed(2)}.`;
    }

    if (activeTestId === "pearson-correlation" || activeTestId === "spearman-correlation") {
      const res = testResults as any;
      return `Det var en ${res.r > 0 ? "positiv" : "negativ"}, ${
        res.pValue < 0.05 ? "statistisk signifikant" : "ikke-signifikant"
      } ${activeTestId === "spearman-correlation" ? "Spearman" : "Pearson"} korrelasjon mellom ${
        res.var1
      } og ${res.var2}, r(${res.df}) = ${res.r.toFixed(2)}, p ${
        res.pValue < 0.001 ? "< .001" : "= " + res.pValue.toFixed(3)
      }, 95% CI [${res.ciLower.toFixed(2)}, ${res.ciUpper.toFixed(2)}], r² = ${res.rSquared.toFixed(2)}.`;
    }

    return currentTest.apaExample;
  }, [testResults, activeTestId, currentTest, selectedOutcomeVar]);

  const copyApaText = () => {
    navigator.clipboard.writeText(apaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Test Selector Top Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Statistikkbibliotek & Beregningsmotor
            </span>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">
              {currentTest.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              SPSS Meny: {currentTest.spssMenuPath}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={activeTestId}
              onChange={(e) => setActiveTestId(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <optgroup label="Sammenligning av grupper:">
                <option value="independent-t-test">Independent-Samples T-Test</option>
                <option value="paired-t-test">Paired-Samples T-Test</option>
                <option value="one-way-anova">One-Way ANOVA</option>
                <option value="repeated-measures-anova">Repeated-Measures ANOVA (Oversikt)</option>
              </optgroup>
              <optgroup label="Ikke-parametriske tester:">
                <option value="mann-whitney-u">Mann–Whitney U-Test</option>
                <option value="wilcoxon-signed-rank">Wilcoxon Signed-Rank Test</option>
                <option value="kruskal-wallis">Kruskal–Wallis H-Test</option>
              </optgroup>
              <optgroup label="Sammenheng & Prediksjon:">
                <option value="pearson-correlation">Pearson Korrelasjon</option>
                <option value="spearman-correlation">Spearman Rank Korrelasjon</option>
                <option value="linear-regression">Lineær Regresjon</option>
                <option value="chi-square">Chi-Square Test (Kji-kvadrat)</option>
              </optgroup>
              <optgroup label="Psykometri & Avansert:">
                <option value="cronbach-alpha">Cronbach's Alpha</option>
                <option value="ancova">ANCOVA (Kovariansanalyse)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Variable Config Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-slate-600">Velg variabler fra datasett:</span>

          {activeTestId === "independent-t-test" && (
            <>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Gruppe (IV):</span>
                <select
                  value={selectedGroupVar}
                  onChange={(e) => setSelectedGroupVar(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  {dataset.variables
                    .filter((v) => v.level === "nominal")
                    .map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Utfall (DV):</span>
                <select
                  value={selectedOutcomeVar}
                  onChange={(e) => setSelectedOutcomeVar(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  {dataset.variables
                    .filter((v) => v.level === "scale")
                    .map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          {activeTestId === "paired-t-test" && (
            <>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Pre-måling:</span>
                <select
                  value={selectedPairPre}
                  onChange={(e) => setSelectedPairPre(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  {dataset.variables.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Post-måling:</span>
                <select
                  value={selectedPairPost}
                  onChange={(e) => setSelectedPairPost(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  {dataset.variables.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(activeTestId === "pearson-correlation" ||
            activeTestId === "spearman-correlation" ||
            activeTestId === "linear-regression") && (
            <>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Variabel X (Prediktor):</span>
                <select
                  value={selectedVarX}
                  onChange={(e) => setSelectedVarX(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  {dataset.variables
                    .filter((v) => v.level === "scale")
                    .map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Variabel Y (Utfall):</span>
                <select
                  value={selectedVarY}
                  onChange={(e) => setSelectedVarY(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 bg-white"
                >
                  {dataset.variables
                    .filter((v) => v.level === "scale")
                    .map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Assumption Validation Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            {assumptionValidation.overallStatus === "valid" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : assumptionValidation.overallStatus === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Live forutsetningskontroll for {currentTest.name}
              </h2>
              <p className="text-xs text-slate-500">
                Sanntidskontroll av metodiske forutsetninger basert på valgte variabler i datasettet.
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              assumptionValidation.overallStatus === "valid"
                ? "bg-emerald-100 text-emerald-800"
                : assumptionValidation.overallStatus === "warning"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {assumptionValidation.overallStatus === "valid"
              ? "✓ Forutsetninger oppfylt"
              : assumptionValidation.overallStatus === "warning"
              ? "⚠️ Forutsetningsadvarsel"
              : "🛑 Kriteriebrudd"}
          </span>
        </div>

        {/* Alternative Test Suggestion Banner */}
        {assumptionValidation.alternativeTestSuggestion && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Anbefalt alternativ: {assumptionValidation.alternativeTestSuggestion.name}</span>
              </div>
              <p className="text-amber-800 leading-relaxed max-w-xl">
                {assumptionValidation.alternativeTestSuggestion.reason}
              </p>
            </div>

            <button
              onClick={() => {
                if (assumptionValidation.alternativeTestSuggestion) {
                  setActiveTestId(assumptionValidation.alternativeTestSuggestion.testId);
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 shadow-xs"
            >
              <span>Bytt til anbefalt test</span>
              <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Assumptions Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {assumptionValidation.assumptions.map((assump) => (
            <div
              key={assump.id}
              className={`p-3.5 rounded-lg border space-y-2 ${
                assump.status === "passed"
                  ? "bg-slate-50/70 border-slate-200"
                  : assump.status === "warning"
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-rose-50/50 border-rose-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-900">
                  {assump.status === "passed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : assump.status === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{assump.name}</span>
                </div>
                <span
                  className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                    assump.status === "passed"
                      ? "bg-emerald-100 text-emerald-800"
                      : assump.status === "warning"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {assump.status === "passed"
                    ? "Oppfylt"
                    : assump.status === "warning"
                    ? "Advarsel"
                    : "Brudd"}
                </span>
              </div>

              <div className="font-mono text-[11px] text-slate-600 bg-white/70 p-2 rounded border border-slate-200/60 space-y-0.5">
                <div>
                  <span className="text-slate-400 font-sans">Målt verdi: </span>
                  <span className="font-semibold text-slate-800">{assump.measuredValue}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Kriterium: </span>
                  <span className="text-slate-700">{assump.threshold}</span>
                </div>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                {assump.explanation}
              </p>

              <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-slate-200/50">
                <span className="font-semibold">SPSS råd: </span>
                {assump.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module 4: «Hvorfor denne testen?» Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">
            «Hvorfor denne testen?» – Metodisk grunnlag
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <span className="font-semibold text-slate-900">Når brukes den?</span>
            <p className="text-slate-600 leading-relaxed">{currentTest.whenToUse}</p>
            <div className="pt-2 border-t border-slate-200/80">
              <span className="font-medium text-slate-500">Eksempelspørsmål:</span>
              <p className="italic text-slate-800 mt-0.5">«{currentTest.exampleQuestion}»</p>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <span className="font-semibold text-slate-900">Variabler & Målenivå</span>
            <div className="text-slate-700">
              <div><span className="font-medium">Uavhengig variabel (IV):</span> {currentTest.independentVar}</div>
              <div className="mt-1"><span className="font-medium">Avhengig variabel (DV):</span> {currentTest.dependentVar}</div>
            </div>
            <div className="pt-2 border-t border-slate-200/80">
              <span className="font-medium text-slate-500">Hypoteser:</span>
              <div className="font-mono text-[11px] text-slate-800 mt-0.5">{currentTest.h0}</div>
              <div className="font-mono text-[11px] text-emerald-800 mt-0.5">{currentTest.h1}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module 6 & Output: SPSS Output Table Display */}
      {testResults && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-emerald-800 text-emerald-200">
                SPSS Output
              </span>
              <h3 className="text-sm font-semibold">
                Beregnet resultat for {currentTest.name}
              </h3>
            </div>
            
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <ExportButtonGroup
                testInfo={currentTest}
                results={testResults}
                datasetName={dataset.name}
                apaNarrative={apaText}
                assumptions={assumptionValidation.assumptions.map((a) => ({
                  name: a.name,
                  status: (a.status === "passed" ? "met" : a.status) as "met" | "warning" | "violated",
                  measuredValue: a.measuredValue,
                  threshold: a.threshold,
                  explanation: a.description,
                }))}
              />
            </div>
          </div>

          {/* Render specific test table */}
          <div className="p-4 overflow-x-auto">
            {activeTestId === "independent-t-test" && (
              <div className="space-y-4">
                {/* Group Statistics Table */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1">Group Statistics</div>
                  <table className="w-full text-xs text-left border border-slate-300 font-mono">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 font-sans">Gruppe</th>
                        <th className="p-2 border-r border-slate-300">N</th>
                        <th className="p-2 border-r border-slate-300">Mean (M)</th>
                        <th className="p-2 border-r border-slate-300">Std. Deviation (SD)</th>
                        <th className="p-2">Std. Error Mean</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 border-r border-slate-300 font-sans">{(testResults as any).group1Stats.name}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).group1Stats.n}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).group1Stats.mean.toFixed(2)}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).group1Stats.sd.toFixed(2)}</td>
                        <td className="p-2">{((testResults as any).group1Stats.sd / Math.sqrt((testResults as any).group1Stats.n)).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-300 font-sans">{(testResults as any).group2Stats.name}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).group2Stats.n}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).group2Stats.mean.toFixed(2)}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).group2Stats.sd.toFixed(2)}</td>
                        <td className="p-2">{((testResults as any).group2Stats.sd / Math.sqrt((testResults as any).group2Stats.n)).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Independent Samples Test Table */}
                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-1">Independent Samples Test</div>
                  <table className="w-full text-xs text-left border border-slate-300 font-mono">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300 font-sans">Forutsetning</th>
                        <th className="p-2 border-r border-slate-300">t</th>
                        <th className="p-2 border-r border-slate-300">df</th>
                        <th className="p-2 border-r border-slate-300">Sig. (2-tailed)</th>
                        <th className="p-2 border-r border-slate-300">Mean Difference</th>
                        <th className="p-2 border-r border-slate-300">95% CI Lower</th>
                        <th className="p-2">95% CI Upper</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-emerald-50/50">
                        <td className="p-2 border-r border-slate-300 font-sans font-medium text-emerald-900">Equal variances assumed</td>
                        <td className="p-2 border-r border-slate-300 font-bold">{(testResults as any).t.toFixed(3)}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).df}</td>
                        <td className="p-2 border-r border-slate-300 font-bold text-emerald-700">
                          {(testResults as any).pValue < 0.001 ? ".000" : (testResults as any).pValue.toFixed(3)}
                        </td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).meanDiff.toFixed(2)}</td>
                        <td className="p-2 border-r border-slate-300">{(testResults as any).ciLower.toFixed(2)}</td>
                        <td className="p-2">{(testResults as any).ciUpper.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTestId === "one-way-anova" && (
              <table className="w-full text-xs text-left border border-slate-300 font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 font-sans">Kilde</th>
                    <th className="p-2 border-r border-slate-300">Sum of Squares</th>
                    <th className="p-2 border-r border-slate-300">df</th>
                    <th className="p-2 border-r border-slate-300">Mean Square</th>
                    <th className="p-2 border-r border-slate-300">F</th>
                    <th className="p-2">Sig. (p)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-sans">Between Groups</td>
                    <td className="p-2 border-r border-slate-300">{(testResults as any).ssBetween.toFixed(2)}</td>
                    <td className="p-2 border-r border-slate-300">{(testResults as any).dfBetween}</td>
                    <td className="p-2 border-r border-slate-300">{(testResults as any).msBetween.toFixed(2)}</td>
                    <td className="p-2 border-r border-slate-300 font-bold">{(testResults as any).f.toFixed(3)}</td>
                    <td className="p-2 font-bold text-emerald-700">{(testResults as any).pValue < 0.001 ? ".000" : (testResults as any).pValue.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-sans">Within Groups</td>
                    <td className="p-2 border-r border-slate-300">{(testResults as any).ssWithin.toFixed(2)}</td>
                    <td className="p-2 border-r border-slate-300">{(testResults as any).dfWithin}</td>
                    <td className="p-2 border-r border-slate-300">{(testResults as any).msWithin.toFixed(2)}</td>
                    <td className="p-2 border-r border-slate-300">-</td>
                    <td className="p-2">-</td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTestId === "linear-regression" && (
              <div className="space-y-3">
                <table className="w-full text-xs text-left border border-slate-300 font-mono">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 font-sans">Model</th>
                      <th className="p-2 border-r border-slate-300">R</th>
                      <th className="p-2 border-r border-slate-300">R Square (R²)</th>
                      <th className="p-2 border-r border-slate-300">Adjusted R Square</th>
                      <th className="p-2">Std. Error of the Estimate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border-r border-slate-300 font-sans">1</td>
                      <td className="p-2 border-r border-slate-300">{(testResults as any).r.toFixed(3)}</td>
                      <td className="p-2 border-r border-slate-300 font-bold">{(testResults as any).rSquared.toFixed(3)}</td>
                      <td className="p-2 border-r border-slate-300">{(testResults as any).adjustedRSquared.toFixed(3)}</td>
                      <td className="p-2">{(testResults as any).stdError.toFixed(3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTestId === "cronbach-alpha" && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Cronbach's Alpha:</span>
                    <div className="text-xl font-bold font-mono text-emerald-700">
                      α = {(testResults as any).alpha.toFixed(3)}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500">Antall ledd:</span>
                    <div className="font-semibold text-slate-800">{(testResults as any).numberOfItems} items</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Module 6: Human Explanation Panel */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Pedagogisk Tolkning: «Hva betyr dette?»
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-semibold text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hva betyr dette resultatet?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Testen viser en {(testResults as any).pValue < 0.05 ? "statistisk signifikant" : "ikke-signifikant"} effekt (p = {(testResults as any).pValue < 0.001 ? "< .001" : (testResults as any).pValue.toFixed(3)}).
                  {(testResults as any).pValue < 0.05
                    ? " Gitt at nullhypotesen var sann, ville det vært ekstremt usannsynlig å observere en så stor forskjell utelukkende ved tilfeldig utvalgsvariasjon."
                    : " Vi har ikke tilstrekkelig grunnlag til å forkaste nullhypotesen."}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-semibold text-amber-800 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Hva betyr det IKKE?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  En lav p-verdi beviser <strong>IKKE</strong> at effekten er stor, viktig eller klinisk meningsfull. Det beviser heller ikke årsakssammenheng alene uten et metodisk kontrollert design.
                </p>
              </div>
            </div>

            {/* Academic Reporting Section with Mandatory Disclaimer */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                    Forslag til resultattekst (APA 7)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => exportAnalysisToWord(currentTest, testResults, apaText, dataset.name)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-colors"
                    title="Last ned APA 7 rapport i Word (.doc)"
                  >
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span>Word (.doc)</span>
                  </button>
                  <button
                    onClick={copyApaText}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? "Kopiert!" : "Kopier tekst"}</span>
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded text-[11px] font-semibold text-amber-300">
                GENERERT FORSLAG – MÅ KONTROLLERES AV FORSKER
              </div>

              <p className="text-xs font-serif leading-relaxed text-slate-200 italic bg-slate-950/60 p-3 rounded border border-slate-800">
                «{apaText}»
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
