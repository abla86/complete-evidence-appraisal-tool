import React, { useState, useMemo } from "react";
import { Dataset } from "../types";
import { testsLibrary } from "../data/testsLibrary";
import { validateTestAssumptions } from "../utils/validationEngine";
import { triggerPrint } from "../utils/exportUtils";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Search,
  Activity,
  Sparkles,
  ArrowRightCircle,
  Printer,
  Sliders,
} from "lucide-react";

interface AssumptionItem {
  id: string;
  name: string;
  category: "Generell" | "Varians" | "Regresjon" | "Gjentatte målinger" | "Kategorisk";
  appliesTo: string[];
  definition: string;
  howToCheckSPSS: string;
  criteria: string;
  impactOfViolation: string;
  actionPlan: string;
  robustnessNote: string;
}

interface AssumptionsViewProps {
  dataset?: Dataset;
  onSelectTest?: (testId: string) => void;
}

export const AssumptionsView: React.FC<AssumptionsViewProps> = ({
  dataset,
  onSelectTest,
}) => {
  const [activeTab, setActiveTab] = useState<"catalog" | "live">("catalog");
  const [selectedAssumptionId, setSelectedAssumptionId] = useState<string>("normality");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Live checker state
  const [liveTestId, setLiveTestId] = useState<string>("independent-t-test");
  const [selectedGroupVar, setSelectedGroupVar] = useState<string>("gruppe");
  const [selectedOutcomeVar, setSelectedOutcomeVar] = useState<string>("post_kognitiv");
  const [selectedPairPre, setSelectedPairPre] = useState<string>("pre_kognitiv");
  const [selectedPairPost, setSelectedPairPost] = useState<string>("post_kognitiv");
  const [selectedVarX, setSelectedVarX] = useState<string>("alder");
  const [selectedVarY, setSelectedVarY] = useState<string>("post_kognitiv");

  const activeLiveTest = testsLibrary.find((t) => t.id === liveTestId) || testsLibrary[0];

  // Evaluate assumptions live on dataset
  const liveValidation = useMemo(() => {
    if (!dataset) return null;
    return validateTestAssumptions(liveTestId, dataset, {
      ivName:
        liveTestId.includes("t-test") ||
        liveTestId.includes("anova") ||
        liveTestId.includes("mann-whitney") ||
        liveTestId.includes("kruskal")
          ? selectedGroupVar
          : undefined,
      dvName:
        liveTestId.includes("t-test") ||
        liveTestId.includes("anova") ||
        liveTestId.includes("mann-whitney") ||
        liveTestId.includes("kruskal")
          ? selectedOutcomeVar
          : undefined,
      pairPre: selectedPairPre,
      pairPost: selectedPairPost,
      varX: selectedVarX,
      varY: selectedVarY,
    });
  }, [
    liveTestId,
    dataset,
    selectedGroupVar,
    selectedOutcomeVar,
    selectedPairPre,
    selectedPairPost,
    selectedVarX,
    selectedVarY,
  ]);

  const assumptions: AssumptionItem[] = [
    {
      id: "normality",
      name: "Normalfordeling av data / residualer",
      category: "Generell",
      appliesTo: ["Independent T-Test", "Paired T-Test", "ANOVA", "Lineær Regresjon", "Pearson Korrelasjon"],
      definition:
        "At observasjonene (eller residualene) i populasjonen følger den gaussiske bjellekurven med symmetrisk fordeling rundt gjennomsnittet.",
      howToCheckSPSS:
        "Analyze → Descriptive Statistics → Explore... (Flytt variabel til Dependent List, klikk Plots → kryss av for 'Normality plots with tests' og 'Histogram').",
      criteria:
        "Shapiro-Wilk test: p > .05 indikerer normalfordeling. Skewness (skjevhet) og Kurtosis (spisshet): Verdier mellom -1.96 og +1.96 (eller -1.0 til +1.0 for streng vurdering). Q-Q plot: Punktene bør ligge tett inntil den rette diagonale linjen.",
      impactOfViolation:
        "Ved små utvalg (N < 30) kan type I-feilraten (falske positiver) øke, og p-verdien kan bli upålitelig.",
      actionPlan:
        "1. Bytt til ikke-parametrisk alternativ (Mann-Whitney U, Wilcoxon, Kruskal-Wallis, Spearman).\n2. Vurder matematisk transformasjon (f.eks. Log10 eller kvadratrot) ved markant høyreskjevhet.\n3. Benytt bootstrapping i SPSS (velg Bootstrap → 1000 resamples).",
      robustnessNote:
        "Sentralgrenseteoremet (Central Limit Theorem): Ved store utvalg (N > 30–50 per gruppe) er t-tester og ANOVA bemerkelsesverdig robuste mot brudd på normalfordeling, fordi gjennomsnittenes utvalgsfordeling uansett tilnærmer seg normalfordeling.",
    },
    {
      id: "homogeneity",
      name: "Homogenitet av varians (Homoscedastisitet)",
      category: "Varians",
      appliesTo: ["Independent T-Test", "One-Way ANOVA", "ANCOVA"],
      definition:
        "At variansen (spredningen) i den avhengige variabelen er omtrent lik på tvers av alle gruppene som sammenlignes (σ₁² ≈ σ₂²).",
      howToCheckSPSS:
        "T-test: Genereres automatisk som 'Levene's Test for Equality of Variances'. ANOVA: Analyze → Compare Means → One-Way ANOVA → Options → kryss av 'Homogeneity of variance test'.",
      criteria:
        "Levene's test: Hvis p > .05, er forutsetningen oppfylt (like varianser). Hvis p < .05, er variansene signifikant ulike.",
      impactOfViolation:
        "Hvis den minste gruppen har størst varians, blir standard t-test for liberal (falsk signifikans). Hvis den største gruppen har størst varians, blir testen for konservativ.",
      actionPlan:
        "For Independent T-test: Les av raden 'Equal variances not assumed' (Welch's t-test). Den justerer frihetsgradene automatisk.\nFor ANOVA: Kryss av for 'Welch' eller 'Brown-Forsythe' under Options.",
      robustnessNote:
        "Hvis gruppene har nøyaktig lik størrelse (f.eks. n₁ = 30, n₂ = 30), er ANOVA svært robust mot moderate variansforskjeller.",
    },
    {
      id: "linearity",
      name: "Linearitet",
      category: "Regresjon",
      appliesTo: ["Pearson Korrelasjon", "Lineær Regresjon", "ANCOVA"],
      definition:
        "At sammenhengen mellom variablene kan beskrives tilfredsstillende med en rett linje, snarere enn en kurve, U-form eller terskeleffekt.",
      howToCheckSPSS:
        "Graphs → Chart Builder → Scatter/Dot (Simple Scatter). Legg X på x-aksen og Y på y-aksen, og legg til 'Loess line' eller tilpasningslinje.",
      criteria:
        "Spredningsplottet skal vise en jevn lineær trend uten markante buer, bananformer eller U-kurver.",
      impactOfViolation:
        "Pearson r og lineær regresjon vil undervurdere eller fullstendig feiltolke sammenhengen dersom den er kurvlineær.",
      actionPlan:
        "1. Inkluder polynomiske ledd (f.eks. X²) i regresjonsmodellen.\n2. Benytt Spearman rang-korrelasjon dersom sammenhengen er monoton, men ikke-lineær.",
      robustnessNote:
        "Inspiser alltid scatterplot visuelt; et høyt tall på r kan skjule en ikke-lineær dynamikk.",
    },
    {
      id: "multicollinearity",
      name: "Fravær av multikollinearitet",
      category: "Regresjon",
      appliesTo: ["Multiple Lineær Regresjon", "MANOVA"],
      definition:
        "At to eller flere uavhengige prediktorer ikke er så høyt korrelerte med hverandre at de i praksis måler det samme fenomenet.",
      howToCheckSPSS:
        "Analyze → Regression → Linear → Statistics → kryss av for 'Collinearity diagnostics'.",
      criteria:
        "Toleranse (Tolerance) > 0.10. VIF (Variance Inflation Factor) < 5 (eller < 10 i mindre strenge kilder). Bivariate korrelasjoner mellom prediktorer bør være r < .80.",
      impactOfViolation:
        "Regresjonskoeffisientene blir ustabile med oppblåste standardfeil, og SPSS klarer ikke å isolere den unike effekten til hver enkelt prediktor.",
      actionPlan:
        "1. Fjern den ene av de to overlappende variablene.\n2. Slå sammen variablene til en samleindeks (f.eks. gjennomsnittsskår).\n3. Gjennomfør en prinsipiell komponentanalyse (PCA).",
      robustnessNote:
        "Multikollinearitet påvirker ikke modellens samlede prediksjonsevne (R²), men gjør individuelle regresjonsvekter (Beta) upålitelige.",
    },
    {
      id: "sphericity",
      name: "Sfærisitet (Sphericity)",
      category: "Gjentatte målinger",
      appliesTo: ["Repeated-Measures ANOVA (3+ måletidspunkter)"],
      definition:
        "At variansene til differansene mellom alle par av gjentatte målinger er like i populasjonen.",
      howToCheckSPSS:
        "Analyze → General Linear Model → Repeated Measures... Genereres i tabellen 'Mauchly's Test of Sphericity'.",
      criteria:
        "Mauchly's W: Hvis p > .05, er sfærisitetsforutsetningen oppfylt. Hvis p < .05, foreligger et brudd på forutsetningen.",
      impactOfViolation:
        "F-testen blir for liberal, med økt risiko for type I-feil (oppblåst signifikans).",
      actionPlan:
        "Bruk korreksjon for frihetsgradene:\n1. Hvis Greenhouse-Geisser Epsilon (ε) < .75, bruk Greenhouse-Geisser korreksjon.\n2. Hvis Epsilon > .75, bruk Huynh-Feldt korreksjon.\n3. Alternativt kan man benytte Mixed Models eller multivariat analyse (MANOVA-tilnærming).",
      robustnessNote:
        "Ved kun to gjentatte målinger (pre-post) kan ikke sfærisitet brytes, da det kun finnes én enkelt differanse.",
    },
    {
      id: "independence",
      name: "Uavhengighet mellom observasjoner",
      category: "Generell",
      appliesTo: ["Alle standard statistiske tester"],
      definition:
        "At hver måling er uavhengig av de andre målingene – at en deltakers skår ikke påvirkes av eller overlapper med en annen deltakers skår.",
      howToCheckSPSS:
        "Kan IKKE testes statistisk i SPSS alene. Dette er et spørsmål om forskningsdesign og datainnsamlingsmetode.",
      criteria:
        "Ingen klynger (f.eks. elever i samme skoleklasse, pasienter hos samme behandler, tvillinger) uten at det tas høyde for i modellen.",
      impactOfViolation:
        "Dette er den mest kritiske forutsetningen. Brudd på uavhengighet kan føre til massiv oppblåsing av falske signifikanser.",
      actionPlan:
        "Bruk flernivåmodellering (Hierarchical Linear Modeling / Linear Mixed Models) dersom dataene er samlet inn i naturlige klynger.",
      robustnessNote:
        "Ingen parametrisk test er robust mot alvorlige brudd på uavhengighet.",
    },
    {
      id: "expected-counts",
      name: "Forventede cellefrekvenser i Krysstabell",
      category: "Kategorisk",
      appliesTo: ["Chi-Square Test of Independence"],
      definition:
        "At cellene i en krysstabell har tilstrekkelig mange forventede observasjoner til at kji-kvadratfordelingen er gyldig.",
      howToCheckSPSS:
        "Analyze → Descriptive Statistics → Crosstabs → Cells → kryss av for 'Expected'. Les fotnoten under Chi-Square Tests tabellen.",
      criteria:
        "I 2x2 tabeller: Ingen celler med forventet frekvens < 5. I større tabeller: Minst 80 % av cellene må ha forventet frekvens ≥ 5, og ingen < 1.",
      impactOfViolation:
        "P-verdien blir upålitelig og overestimerer eller underestimerer sammenhengen.",
      actionPlan:
        "For 2x2 tabeller: Les av Fisher's Exact Test i stedet for Pearson Chi-Square.\nFor større tabeller: Slå sammen logiske kategorier (rekoding) for å øke celletallene.",
      robustnessNote:
        "Fisher's Exact Test beregner den eksakte sannsynligheten direkte uten å stole på en tilnærmet kji-kvadratfordeling.",
    },
  ];

  const filtered = assumptions.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.appliesTo.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const active = assumptions.find((a) => a.id === selectedAssumptionId) || assumptions[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Metodisk Robusthet & Validitet
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Forutsetningskontroll & Tiltak ved Brudd
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Statistiske tester bygger på metodiske forutsetninger. Lær hvordan du sjekker dem i SPSS,
              når testene er robuste, eller kjør en live forutsetningstest direkte på ditt datasett.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto shrink-0">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "catalog"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lærebok (SPSS Survival)
            </button>
            <button
              onClick={() => setActiveTab("live")}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "live"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live sjekk på datasett</span>
            </button>
          </div>
        </div>

        {/* Search if in catalog mode */}
        {activeTab === "catalog" && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk i forutsetninger (f.eks. normalitet, Levene, VIF, sfærisitet)..."
                className="text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg w-full bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mode 1: Catalog view */}
      {activeTab === "catalog" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left list */}
          <div className="space-y-2">
            {filtered.map((item) => {
              const isSelected = item.id === active.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedAssumptionId(item.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      {item.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    Gjelder: {item.appliesTo.join(", ")}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-emerald-700 uppercase font-mono">
                    {active.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {active.name}
                </h2>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                  <span className="font-medium">Gjelder for:</span>
                  <span>{active.appliesTo.join(" • ")}</span>
                </div>
              </div>

              {/* Definition */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-700">
                <span className="font-semibold text-slate-900 block mb-1">
                  Hva er denne forutsetningen?
                </span>
                {active.definition}
              </div>

              {/* How to check in SPSS & Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-900">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Hvordan sjekkes dette i SPSS?</span>
                  </div>
                  <p className="font-mono text-xs text-emerald-800 bg-white p-2 rounded border border-slate-200">
                    {active.howToCheckSPSS}
                  </p>
                </div>

                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Kriterier for oppfyllelse</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed pt-1">
                    {active.criteria}
                  </p>
                </div>
              </div>

              {/* What happens on violation */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-semibold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Hva skjer ved brudd?</span>
                </div>
                <p className="text-amber-900 leading-relaxed">
                  {active.impactOfViolation}
                </p>
              </div>

              {/* Action Plan / Remedies */}
              <div className="p-4 bg-emerald-950 text-white rounded-xl text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-semibold text-emerald-300">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Hvilke tiltak kan forskeren gjøre?</span>
                </div>
                <div className="whitespace-pre-line text-slate-200 leading-relaxed font-sans">
                  {active.actionPlan}
                </div>
              </div>

              {/* Robustness note */}
              <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start space-x-2.5">
                <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">
                    Robusthetsvurdering & Praksis:
                  </span>{" "}
                  {active.robustnessNote}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Live forutsetningssjekker på aktivt datasett */}
      {activeTab === "live" && (
        <div className="space-y-6">
          {!dataset ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
              Ingen aktivt datasett lastet. Vennligst velg eller last opp et datasett i fanen «Datasett».
            </div>
          ) : (
            <>
              {/* Test and Variable Selector Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Konfigurer test og variabler fra «{dataset.name}»
                    </h3>
                    <p className="text-xs text-slate-500">
                      Velg testen du ønsker å vurdere mot forutsetningene i dine data.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={triggerPrint}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-300"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-700" />
                      <span>Skriv ut / PDF</span>
                    </button>

                    {onSelectTest && (
                      <button
                        onClick={() => onSelectTest(liveTestId)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <span>Åpne i analysemodul</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Statistisk test:
                    </label>
                    <select
                      value={liveTestId}
                      onChange={(e) => setLiveTestId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="independent-t-test">Independent-Samples T-Test</option>
                      <option value="paired-t-test">Paired-Samples T-Test</option>
                      <option value="one-way-anova">One-Way ANOVA</option>
                      <option value="pearson-correlation">Pearson Korrelasjon</option>
                      <option value="linear-regression">Lineær Regresjon</option>
                      <option value="mann-whitney-u">Mann–Whitney U-Test</option>
                      <option value="wilcoxon-signed-rank">Wilcoxon Signed-Rank Test</option>
                      <option value="kruskal-wallis">Kruskal–Wallis H-Test</option>
                      <option value="chi-square">Chi-Square Test</option>
                    </select>
                  </div>

                  {/* Dynamic variable selectors */}
                  {(liveTestId === "independent-t-test" ||
                    liveTestId === "one-way-anova" ||
                    liveTestId === "mann-whitney-u" ||
                    liveTestId === "kruskal-wallis") && (
                    <>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Gruppe (Uavhengig variabel - IV):
                        </label>
                        <select
                          value={selectedGroupVar}
                          onChange={(e) => setSelectedGroupVar(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                        >
                          {dataset.variables
                            .filter((v) => v.level === "nominal" || v.level === "ordinal")
                            .map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name} ({v.level})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Utfallsmål (Avhengig variabel - DV):
                        </label>
                        <select
                          value={selectedOutcomeVar}
                          onChange={(e) => setSelectedOutcomeVar(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                        >
                          {dataset.variables
                            .filter((v) => v.level === "scale" || v.type === "numeric")
                            .map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name} ({v.level})
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  {(liveTestId === "paired-t-test" ||
                    liveTestId === "wilcoxon-signed-rank") && (
                    <>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Måling 1 (Tidspunkt 1 / Pre):
                        </label>
                        <select
                          value={selectedPairPre}
                          onChange={(e) => setSelectedPairPre(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                        >
                          {dataset.variables
                            .filter((v) => v.type === "numeric")
                            .map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Måling 2 (Tidspunkt 2 / Post):
                        </label>
                        <select
                          value={selectedPairPost}
                          onChange={(e) => setSelectedPairPost(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                        >
                          {dataset.variables
                            .filter((v) => v.type === "numeric")
                            .map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  {(liveTestId === "pearson-correlation" ||
                    liveTestId === "linear-regression") && (
                    <>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Variabel X (Prediktor / Kovariat):
                        </label>
                        <select
                          value={selectedVarX}
                          onChange={(e) => setSelectedVarX(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                        >
                          {dataset.variables
                            .filter((v) => v.type === "numeric")
                            .map((v) => (
                              <option key={v.id} value={v.name}>
                                {v.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Variabel Y (Utfallsmål):
                        </label>
                        <select
                          value={selectedVarY}
                          onChange={(e) => setSelectedVarY(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                        >
                          {dataset.variables
                            .filter((v) => v.type === "numeric")
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

              {/* Diagnostic Results */}
              {liveValidation && (
                <div className="space-y-4">
                  {/* Overall Verdict Banner */}
                  <div
                    className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      liveValidation.overallStatus === "valid"
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : liveValidation.overallStatus === "warning"
                        ? "bg-amber-50/70 border-amber-200 text-amber-950"
                        : "bg-rose-50/70 border-rose-200 text-rose-950"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {liveValidation.overallStatus === "valid" ? (
                        <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                      ) : liveValidation.overallStatus === "warning" ? (
                        <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                      )}

                      <div>
                        <h4 className="text-base font-bold">
                          {liveValidation.overallStatus === "valid"
                            ? "Forutsetningene er oppfylt!"
                            : liveValidation.overallStatus === "warning"
                            ? "Metodiske advarsler identifisert"
                            : "Kriteriebrudd for denne testen"}
                        </h4>
                        <p className="text-xs mt-1 leading-relaxed max-w-2xl">
                          {liveValidation.overallStatus === "valid"
                            ? `Alle evaluerte forutsetninger for ${activeLiveTest.name} holder innenfor akseptable metodiske grenser i datasettet «${dataset.name}».`
                            : liveValidation.overallStatus === "warning"
                            ? `En eller flere forutsetninger (f.eks. fordelingsskjevhet eller varianslikhet) er utfordret. Testen kan vurderes med forsiktighet eller alternative tolkninger.`
                            : `De valgte variablene tilfredsstiller ikke basiskravene for ${activeLiveTest.name}. Du bør vurdere den anbefalte alternative testen nedenfor.`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider self-start sm:self-center shrink-0 ${
                        liveValidation.overallStatus === "valid"
                          ? "bg-emerald-200 text-emerald-900"
                          : liveValidation.overallStatus === "warning"
                          ? "bg-amber-200 text-amber-900"
                          : "bg-rose-200 text-rose-900"
                      }`}
                    >
                      {liveValidation.overallStatus === "valid"
                        ? "Godkjent"
                        : liveValidation.overallStatus === "warning"
                        ? "Advarsel"
                        : "Brudd"}
                    </span>
                  </div>

                  {/* Alternative Test Callout if applicable */}
                  {liveValidation.alternativeTestSuggestion && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>
                            Anbefalt alternativ: {liveValidation.alternativeTestSuggestion.name}
                          </span>
                        </div>
                        <p className="text-amber-800 leading-relaxed max-w-xl">
                          {liveValidation.alternativeTestSuggestion.reason}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (liveValidation.alternativeTestSuggestion) {
                            setLiveTestId(liveValidation.alternativeTestSuggestion.testId);
                          }
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors shrink-0 shadow-xs"
                      >
                        <span>Bytt til anbefalt test</span>
                        <ArrowRightCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Detailed Assumptions Checklist */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                      Spesifikk kontroll av enkeltforutsetninger ({liveValidation.assumptions.length})
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {liveValidation.assumptions.map((assump) => (
                        <div
                          key={assump.id}
                          className={`p-4 rounded-xl border space-y-2 ${
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

                          <div className="font-mono text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-slate-200/60 space-y-0.5">
                            <div>
                              <span className="text-slate-400 font-sans">Målt verdi: </span>
                              <span className="font-semibold text-slate-800">
                                {assump.measuredValue}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-sans">Kriterium: </span>
                              <span className="text-slate-700">{assump.threshold}</span>
                            </div>
                          </div>

                          <p className="text-slate-600 leading-relaxed text-xs">
                            {assump.explanation}
                          </p>

                          <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-slate-200/50">
                            <span className="font-semibold">SPSS fremgangsmåte: </span>
                            {assump.recommendation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
