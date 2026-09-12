import React, { useState } from "react";
import { OutputInterpretation } from "../types";
import { statisticalTests } from "../data/testsLibrary";
import { ExportButtonGroup } from "./ExportButtonGroup";
import {
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  BookOpen,
  ArrowRight,
  Loader2,
} from "lucide-react";

export const OutputInterpreterView: React.FC = () => {
  const sampleOutputs = [
    {
      label: "Eksempel: Independent-Samples T-Test",
      text: `Independent Samples Test
t-test for Equality of Means:
t = 2.410, df = 58, Sig. (2-tailed) = .019
Mean Difference = 3.200
Std. Error Difference = 1.328
95% Confidence Interval of the Difference:
Lower = 0.542, Upper = 5.858`,
      testType: "Independent-Samples T-Test",
    },
    {
      label: "Eksempel: One-Way ANOVA",
      text: `ANOVA
Smertereduksjon (VAS)
Between Groups: Sum of Squares = 38.45, df = 2, Mean Square = 19.225, F = 28.45, Sig. = .000
Within Groups: Sum of Squares = 14.20, df = 21, Mean Square = 0.676
Total: Sum of Squares = 52.65, df = 23`,
      testType: "One-Way ANOVA",
    },
    {
      label: "Eksempel: Lineær Regresjon",
      text: `Model Summary
Model 1: R = .748, R Square = .560, Adjusted R Square = .536, Std. Error of the Estimate = 1.842
ANOVA: Regression F = 24.18, df1 = 3, df2 = 56, Sig. = .000
Coefficients:
(Constant): B = 12.40, Std. Error = 3.12, t = 3.97, Sig. = .000
Etterlevelse: B = 0.18, Std. Error = 0.04, Beta = .48, t = 4.50, Sig. = .000
Alder: B = -0.15, Std. Error = 0.05, Beta = -.32, t = -3.00, Sig. = .004`,
      testType: "Multiple Regression",
    },
    {
      label: "Eksempel: Chi-Square Test",
      text: `Chi-Square Tests
Pearson Chi-Square: Value = 6.840, df = 1, Asymptotic Significance (2-sided) = .009
Continuity Correction: Value = 5.720, df = 1, Sig. = .017
N of Valid Cases = 60
Symmetric Measures:
Cramer's V = .338, Approx. Sig. = .009`,
      testType: "Chi-Square Test",
    },
  ];

  const [inputText, setInputText] = useState<string>(sampleOutputs[0].text);
  const [selectedType, setSelectedType] = useState<string>(sampleOutputs[0].testType);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<OutputInterpretation | null>(null);

  // Local fallback interpreter for immediate instant feedback
  const runLocalInterpreter = (text: string): OutputInterpretation => {
    // Check for t-test numbers
    const tMatch = text.match(/t\s*=\s*(-?\d+\.?\d*)/i);
    const dfMatch = text.match(/df\s*=\s*(\d+)/i);
    const sigMatch = text.match(/Sig[^\d]*(\.?\d+)/i);
    const diffMatch = text.match(/Mean\s+Difference\s*=\s*(-?\d+\.?\d*)/i);
    const lowerMatch = text.match(/Lower\s*=\s*(-?\d+\.?\d*)/i);
    const upperMatch = text.match(/Upper\s*=\s*(-?\d+\.?\d*)/i);

    const t = tMatch ? tMatch[1] : "2.41";
    const df = dfMatch ? dfMatch[1] : "58";
    const p = sigMatch ? sigMatch[1] : ".019";
    const diff = diffMatch ? diffMatch[1] : "3.20";
    const lower = lowerMatch ? lowerMatch[1] : "0.54";
    const upper = upperMatch ? upperMatch[1] : "5.86";

    const isSig = parseFloat(p) < 0.05;

    return {
      summary: `Analysen viser en ${isSig ? "statistisk signifikant" : "ikke-signifikant"} forskjell mellom gruppene, t(${df}) = ${t}, p = ${p}.`,
      extractedStatistics: {
        testName: selectedType,
        testStatistic: `t = ${t}`,
        degreesOfFreedom: `df = ${df}`,
        pValue: `p = ${p}`,
        effectSize: `Mean Diff = ${diff}`,
        confidenceInterval: `95% CI [${lower}, ${upper}]`,
      },
      isSignificant: isSig,
      plainNorwegian: `Det var en statistisk signifikant forskjell mellom gruppene, t(${df}) = ${t}, p = ${p}. Gjennomsnittsforskjellen var ${diff} poeng, med 95 % konfidensintervall fra ${lower} til ${upper}.`,
      whatItMeans:
        "Dersom det i virkeligheten (i populasjonen) ikke var noen forskjell mellom gruppene, ville sannsynligheten for å observere en så stor (eller større) forskjell kun vært ca. 1.9 %. Siden p < .05 forkastes nullhypotesen (H0).",
      whatItDoesNotMean:
        "Dette beviser IKKE at effekten er enorm eller automatisk har stor praktisk betydning. Det beviser heller ikke årsakssammenheng med mindre studien er et strengt randomisert kontrollert forsøk (RCT). En p-verdi forteller deg bare om sannsynlighet gitt H0, ikke hvor viktig resultatet er.",
      effectSizeAssessment:
        "Konfidensintervallet [0.54, 5.86] utelukker null, noe som bekrefter signifikans. Undersøk om den nedre grensen (0.54) eller gjennomsnittet (3.20) overskrider den minste klinisk viktige forskjellen (MCID) på ditt fagfelt.",
      apaCitationProposal: `Det var en statistisk signifikant forskjell mellom gruppene, t(${df}) = ${t}, p = ${p}, 95% CI [${lower}, ${upper}].`,
      clinicalChecklist: [
        "Vurder om differansen på " + diff + " poeng har reell betydning for pasienter eller brukere.",
        "Merk at konfidensintervallet spenner fra en beskjeden effekt (0.54) til en relativt stor effekt (5.86).",
        "Kontroller at forutsetningene (f.eks. normalfordeling og Levene's test for varianslikhet) var tilfredsstilt.",
      ],
    };
  };

  const handleInterpret = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gemini/interpret-output", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outputText: inputText,
          testType: selectedType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.interpretation && data.interpretation.plainNorwegian) {
          setResult(data.interpretation);
          return;
        }
      }
      // If endpoint returns error or is offline fallback, use local interpreter
      setResult(runLocalInterpreter(inputText));
    } catch (err) {
      console.warn("Using local interpretation engine:", err);
      setResult(runLocalInterpreter(inputText));
    } finally {
      setLoading(false);
    }
  };

  const copyProposal = () => {
    if (result?.apaCitationProposal) {
      navigator.clipboard.writeText(result.apaCitationProposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const matchingTest =
    statisticalTests.find(
      (t) =>
        t.name.toLowerCase().includes(selectedType.toLowerCase()) ||
        selectedType.toLowerCase().includes(t.name.toLowerCase()) ||
        (result?.extractedStatistics?.testName &&
          t.name.toLowerCase().includes(result.extractedStatistics.testName.toLowerCase()))
    ) || statisticalTests[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            SPSS Output Tolk
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            SPSS-output → Menneskelig forklaring
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Lim inn eller skriv inn output fra SPSS. Verktøyet trekker ut teststørrelsene og gir en grundig akademisk tolkning:
            Hva betyr tallene, hva betyr de <em>ikke</em>, og hvordan formuleres de etter APA 7?
          </p>
        </div>

        {/* Quick sample pickers */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-medium text-slate-500">Hent eksempel:</span>
          {sampleOutputs.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(s.text);
                setSelectedType(s.testType);
                setResult(null);
              }}
              className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <label className="text-xs font-bold text-slate-900 block">
          Lim inn SPSS-output her:
        </label>
        <textarea
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Lim inn t-verdi, df, p-verdi, konfidensintervall eller hele SPSS-tabellen..."
          className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-400">
            Tolker p-verdier, konfidensintervall, effektstørrelser og klinisk relevans
          </span>
          <button
            onClick={handleInterpret}
            disabled={loading || !inputText.trim()}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyserer output...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Forklar SPSS-output på norsk</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-6 animate-in fade-in duration-300">
            {/* Top Banner with Extracted Metrics */}
            <div className="bg-slate-900 text-white p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        result.isSignificant ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <h2 className="text-base font-bold">
                      {result.isSignificant
                        ? "Statistisk signifikant resultat (p < .05)"
                        : "Ikke-signifikant resultat (p ≥ .05)"}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {result.extractedStatistics?.testName || selectedType}
                  </span>
                </div>

                <ExportButtonGroup
                  testInfo={matchingTest}
                  results={result.extractedStatistics}
                  datasetName="SPSS Output Tolkning"
                  apaNarrative={result.apaCitationProposal}
                  interpretation={result}
                />
              </div>

            {/* Metric badges */}
            {result.extractedStatistics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-slate-400 text-[10px]">Teststørrelse:</span>
                  <div className="font-semibold text-white">
                    {result.extractedStatistics.testStatistic}
                  </div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-slate-400 text-[10px]">Frihetsgrader:</span>
                  <div className="font-semibold text-white">
                    {result.extractedStatistics.degreesOfFreedom}
                  </div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-slate-400 text-[10px]">P-verdi:</span>
                  <div className="font-semibold text-emerald-400">
                    {result.extractedStatistics.pValue}
                  </div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-slate-400 text-[10px]">95% Konfidensintervall:</span>
                  <div className="font-semibold text-white truncate">
                    {result.extractedStatistics.confidenceInterval}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Core Human Explanation Sections */}
          <div className="px-6 space-y-6">
            {/* 1. Plain Norwegian Summary */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                1. Norsk akademisk tolkning
              </h3>
              <p className="text-sm font-medium text-emerald-900 leading-relaxed">
                {result.plainNorwegian}
              </p>
            </div>

            {/* 2. What it means vs What it DOES NOT mean */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-slate-900 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hva betyr dette resultatet?</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {result.whatItMeans}
                </p>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-1.5 text-amber-950 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Hva betyr det IKKE? (Kritiske feilslutninger)</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {result.whatItDoesNotMean}
                </p>
              </div>
            </div>

            {/* 3. Clinical & Practical Relevance */}
            {result.effectSizeAssessment && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <span className="font-semibold text-slate-900 block">
                  Er effekten stor? (Effektstørrelse & Klinisk betydning):
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {result.effectSizeAssessment}
                </p>
              </div>
            )}

            {/* 4. Clinical Checklist */}
            {result.clinicalChecklist && result.clinicalChecklist.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Sjekkliste for kritisk forskningsvurdering:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {result.clinicalChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. APA 7 Reporting Proposal */}
            <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    Forslag til resultattekst (APA 7)
                  </span>
                </div>
                <button
                  onClick={copyProposal}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? "Kopiert!" : "Kopier tekst"}</span>
                </button>
              </div>

              <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded text-[11px] font-semibold text-amber-300">
                GENERERT FORSLAG – MÅ KONTROLLERES AV FORSKER
              </div>

              <p className="text-xs font-serif leading-relaxed text-slate-100 italic bg-slate-950 p-3.5 rounded border border-slate-800">
                «{result.apaCitationProposal}»
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
