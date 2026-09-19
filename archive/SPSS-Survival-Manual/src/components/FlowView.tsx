import React from "react";
import { TabId } from "./Navigation";
import { ArrowRight, CheckCircle, BookOpen, ExternalLink, HelpCircle } from "lucide-react";

interface FlowViewProps {
  onNavigate: (tab: TabId) => void;
}

interface StepItem {
  number: number;
  title: string;
  subtitle: string;
  description: string;
  keyQuestion: string;
  targetTab?: TabId;
  badge: string;
}

export const FlowView: React.FC<FlowViewProps> = ({ onNavigate }) => {
  const steps: StepItem[] = [
    {
      number: 1,
      title: "Forskningsspørsmål",
      subtitle: "Hva ønsker du egentlig å finne ut av?",
      description:
        "Definer et klart, presist og avgrenset spørsmål. I helsefag og anvendt forskning struktureres dette ofte ved PICO-modellen (Populasjon, Intervensjon, Kontroll, Utfall).",
      keyQuestion: "Hva er den overordnede vitenskapelige eller faglige nysgjerrigheten?",
      targetTab: "pico",
      badge: "Metode",
    },
    {
      number: 2,
      title: "Problemstilling / Hypotese",
      subtitle: "Formulering av H₀ og H₁",
      description:
        "Gjør forskningsspørsmålet testbart. Formuler nullhypotesen (H₀: ingen forskjell/sammenheng) og alternativhypotesen (H₁: det er en reell effekt).",
      keyQuestion: "Hva forventer du å observere om intervensjonen fungerer?",
      targetTab: "analysis",
      badge: "Hypotese",
    },
    {
      number: 3,
      title: "Variabler",
      subtitle: "Uavhengige (IV) og avhengige (DV) variabler",
      description:
        "Identifiser hvilken variabel som utgjør årsak/gruppe/prediktor (uavhengig variabel), og hva som utgjør utfallet/responsen (avhengig variabel).",
      keyQuestion: "Hvilken variabel påvirker hva?",
      targetTab: "data",
      badge: "Design",
    },
    {
      number: 4,
      title: "Målenivå",
      subtitle: "Nominal, Ordinal, Skala (Intervall/Forhold)",
      description:
        "Bestemmer hvilke matematiske operasjoner som er tillatt. Kategoriske data kan ikke gjennomsnittsberegnes; skala-data tillater parametriske tester.",
      keyQuestion: "Er verdiene rene kategorier (kjønn), rangeringer (Likert), eller reelle målbare tall (alder, reaksjonstid)?",
      targetTab: "data",
      badge: "Måling",
    },
    {
      number: 5,
      title: "Datakontroll & Kvalitet",
      subtitle: "Screening, missing data og uteliggere",
      description:
        "Før enhver statistisk test må dataene renses. Kontroller for umulige verdier (f.eks. alder = 999), systematiske bortfall og ekstreme observasjoner.",
      keyQuestion: "Er dataene fri for tastefeil, og hvordan håndterer du manglende verdier?",
      targetTab: "data",
      badge: "Kvalitet",
    },
    {
      number: 6,
      title: "Valg av statistisk analyse",
      subtitle: "Beslutningstre basert på forskningsdesign",
      description:
        "Bruk analyseveilederen for å matche problemstilling, antall grupper, uavhengighet og målenivå med riktig analysemetode.",
      keyQuestion: "Hvilken test er designet for nøyaktig din datastruktur?",
      targetTab: "wizard",
      badge: "Veileder",
    },
    {
      number: 7,
      title: "Forutsetningskontroll",
      subtitle: "Normalitet, homoscedastisitet, linearitet",
      description:
        "Parametriske tester krever at visse matematiske betingelser er oppfylt. Lær hva som skjer ved brudd og når du bør velge robuste eller ikke-parametriske alternativer.",
      keyQuestion: "Tåler dataene dine forutsetningene til testen du har valgt?",
      targetTab: "assumptions",
      badge: "Forutsetning",
    },
    {
      number: 8,
      title: "SPSS-analyse",
      subtitle: "Gjennomføring i SPSS og syntaks",
      description:
        "Menyvei i SPSS (Analyze → ...) og valg av opsjoner som deskriptiv statistikk, konfidensintervall og varianshomogenitet.",
      keyQuestion: "Hvilke knapper og innstillinger må krysses av i SPSS?",
      targetTab: "analysis",
      badge: "Gjennomføring",
    },
    {
      number: 9,
      title: "Output & Tabeller",
      subtitle: "Tolkning av tabeller fra SPSS",
      description:
        "Fokuser på de kritiske tallene: teststørrelse (t, F, r, U), frihetsgrader (df), p-verdi (Sig.), gjennomsnittsdifferanser og standardfeil.",
      keyQuestion: "Hvor i den store SPSS-tabellen står svaret du trenger?",
      targetTab: "interpreter",
      badge: "Output",
    },
    {
      number: 10,
      title: "Tolkning: Hva betyr dette?",
      subtitle: "Statistisk signifikans vs. Hva det IKKE betyr",
      description:
        "En p-verdi < .05 betyr kun at observasjonen er usannsynlig gitt nullhypotesen. Det beviser ikke kausalitet, og det betyr ikke automatisk at effekten er stor.",
      keyQuestion: "Hva kan du legitimt konkludere med, og hvilke feilslutninger må unngås?",
      targetTab: "interpreter",
      badge: "Tolkning",
    },
    {
      number: 11,
      title: "Effektstørrelse",
      subtitle: "Cohen's d, Pearson's r, η², Odds Ratio",
      description:
        "Måler styrken eller størrelsen på fenomenet, uavhengig av utvalgsstørrelsen (N). Skiller mellom ren statistisk signifikans og praktisk betydning.",
      keyQuestion: "Er effekten triviell eller substansiell for praksisfeltet?",
      targetTab: "effect-size",
      badge: "Effekt",
    },
    {
      number: 12,
      title: "Konfidensintervall (95% KI)",
      subtitle: "Presisjon i estimeringen",
      description:
        "95% KI viser intervallet som med 95% sikkerhet fanger opp den sanne populasjonsparameteren. Gir langt mer klinisk informasjon enn en isolert p-verdi.",
      keyQuestion: "Hvor presist er estimatet ditt, og omfatter intervallet den klinisk minste viktige forskjellen (MCID)?",
      targetTab: "effect-size",
      badge: "Presisjon",
    },
    {
      number: 13,
      title: "Akademisk rapportering & APA 7",
      subtitle: "Formatert for oppgaver, artikler og rapporter",
      description:
        "Skriv opp resultatet etter standardene i APA 7 med korrekt statistisk notasjon (kursiv t, p, CI, M, SD), tabelloppsett og vitenskapelig nøytralitet.",
      keyQuestion: "Hvordan formuleres dette akademisk i henhold til forskningskonvensjoner?",
      targetTab: "apa",
      badge: "Rapportering",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Intro Hero Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 mb-2">
              Metodisk Kjernefilosofi
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Hovedflyten i Kvantitativ Analyse
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              «SPSS Survival Manual – Digital» lærer deg å tenke som en forsker. Statistikk er ikke en samling
              tilfeldige knapper i et program, men en logisk kjede fra den kliniske idéen til akademisk formidling.
            </p>
          </div>
          <button
            onClick={() => onNavigate("wizard")}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm self-start md:self-center"
          >
            <span>Start Analyseveileder</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Structured Pipeline Timeline */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-emerald-400/80 transition-all group"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start space-x-3.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 font-semibold flex items-center justify-center text-sm shrink-0 border border-slate-200 transition-colors">
                  {step.number}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h2 className="text-base font-semibold text-slate-900">
                      {step.title}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-emerald-800">
                    {step.subtitle}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed pt-1">
                    {step.description}
                  </p>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 pt-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="italic">Nøkkelspørsmål: {step.keyQuestion}</span>
                  </div>
                </div>
              </div>

              {step.targetTab && (
                <button
                  onClick={() => onNavigate(step.targetTab!)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors self-start sm:self-auto shrink-0"
                >
                  <span>Åpne verktøy</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Note */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start space-x-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-950">
            Husk: En p-verdi gir aldri et fullstendig svar alene!
          </p>
          <p className="mt-0.5 text-emerald-800">
            I moderne kvantitativ metode og kunnskapsbasert praksis må du alltid rapportere effektstørrelse (f.eks. Cohen's d) og 95% konfidensintervall, samt vurdere om resultatet er klinisk eller praktisk relevant for mennesker.
          </p>
        </div>
      </div>
    </div>
  );
};
