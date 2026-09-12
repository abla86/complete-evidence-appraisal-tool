import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Search,
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

export const AssumptionsView: React.FC = () => {
  const [selectedAssumptionId, setSelectedAssumptionId] = useState<string>("normality");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Metodisk Robusthet
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Forutsetningskontroll & Tiltak ved Brudd
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Statistiske tester bygger på matematiske forutsetninger. Lær hvordan du sjekker dem i SPSS,
            når testene er robuste, og hva du gjør dersom forutsetningene brytes.
          </p>
        </div>

        {/* Search */}
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
      </div>

      {/* Two Column Layout: Selection List vs Deep Dive Detail */}
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
    </div>
  );
};
