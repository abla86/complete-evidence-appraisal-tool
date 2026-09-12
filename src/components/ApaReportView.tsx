import React, { useState } from "react";
import { Copy, CheckCircle2, FileText, AlertTriangle, BookCheck } from "lucide-react";

interface ApaTemplateItem {
  id: string;
  name: string;
  templateNarrative: string;
  exampleFilled: string;
  rules: string[];
}

export const ApaReportView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("independent-t");
  const [copied, setCopied] = useState(false);

  const templates: ApaTemplateItem[] = [
    {
      id: "independent-t",
      name: "Independent-Samples T-Test (To uavhengige grupper)",
      templateNarrative:
        "Det ble gjennomført en to-utvalgs t-test for å sammenligne [utfall] mellom [gruppe 1] og [gruppe 2]. Det var en [statistisk signifikant / ikke-signifikant] forskjell mellom [gruppe 1] (M = [M1], SD = [SD1]) og [gruppe 2] (M = [M2], SD = [SD2]), t([df]) = [t-verdi], p = [p-verdi], 95% CI [[nedre], [øvre]], Cohen's d = [d].",
      exampleFilled:
        "Det ble gjennomført en to-utvalgs t-test for å sammenligne kognitiv skår mellom intervensjonsgruppen og kontrollgruppen. Det var en statistisk signifikant forskjell mellom intervensjonsgruppen (M = 28.10, SD = 1.45) og kontrollgruppen (M = 22.13, SD = 1.85), t(58) = 13.92, p < .001, 95% CI [5.11, 6.83], Cohen's d = 3.60.",
      rules: [
        "Kursiver alle statistiske bokstavsymboler: M, SD, t, p, CI, d.",
        "Dropp ledende null for tall som aldri kan overstige 1 (f.eks. p < .001, p = .019, ikke p = 0.019).",
        "Rapporter alltid frihetsgrader i parentes etter teststørrelsen: t(58).",
        "Oppgi eksakte p-verdier ned til tre desimaler (f.eks. p = .042), unntatt når p < .001.",
      ],
    },
    {
      id: "paired-t",
      name: "Paired-Samples T-Test (Paret design / pre-post)",
      templateNarrative:
        "En paret t-test viste en [statistisk signifikant / ikke-signifikant] endring i [utfall] fra før intervensjonen (M = [M1], SD = [SD1]) til etter intervensjonen (M = [M2], SD = [SD2]), t([df]) = [t-verdi], p = [p-verdi], 95% CI [[nedre], [øvre]], d = [d].",
      exampleFilled:
        "En paret t-test viste en statistisk signifikant bedring i funksjonsskår fra før intervensjonen (M = 23.40, SD = 1.88) til etter intervensjonen (M = 28.13, SD = 1.46), t(14) = 11.20, p < .001, 95% CI [3.83, 5.63], d = 2.89.",
      rules: [
        "Oppgi gjennomsnitt og standardavvik for begge tidspunkter.",
        "Konfidensintervallet representerer den gjennomsnittlige differansen mellom tidspunktene.",
      ],
    },
    {
      id: "one-way-anova",
      name: "One-Way ANOVA (Tre eller flere grupper)",
      templateNarrative:
        "En enveis variansanalyse (ANOVA) viste en [statistisk signifikant / ikke-signifikant] forskjell i [utfall] mellom de [antall] behandlingsgruppene, F([df_between], [df_within]) = [F-verdi], p = [p-verdi], η² = [eta2]. Post-hoc tester med [Tukey HSD / Games-Howell] indikerte at...",
      exampleFilled:
        "En enveis variansanalyse (ANOVA) viste en statistisk signifikant forskjell i smertereduksjon mellom de tre behandlingsgruppene, F(2, 21) = 28.45, p < .001, η² = .73. Post-hoc tester med Tukey HSD indikerte at kombinasjonsbehandling (M = 6.45, SD = 0.82) ga signifikant større reduksjon enn både fysioterapi alene (M = 3.80, SD = 0.95, p < .001) og kognitiv terapi (M = 4.10, SD = 0.70, p < .001).",
      rules: [
        "F-testen krever TO frihetsgrader: F(df_between, df_within), f.eks. F(2, 21) = 28.45.",
        "Rapporter alltid hvilken post-hoc test som ble benyttet dersom F-testen var signifikant.",
        "Oppgi effektstørrelse som eta-squared (η²) eller partial eta-squared (η²_p).",
      ],
    },
    {
      id: "correlation",
      name: "Pearson / Spearman Korrelasjon",
      templateNarrative:
        "Det var en [positiv / negativ], [statistisk signifikant / ikke-signifikant] sammenheng mellom [variabel 1] og [variabel 2], r([df]) = [r-verdi], p = [p-verdi], 95% CI [[nedre], [øvre]].",
      exampleFilled:
        "Det var en sterk, negativ og statistisk signifikant sammenheng mellom deltakernes alder og kognitiv skår, r(28) = -.68, p < .001, 95% CI [-.84, -.42], r² = .46.",
      rules: [
        "Frihetsgrader for korrelasjon er N - 2: r(28) ved N = 30.",
        "Dropp ledende null på korrelasjonskoeffisienten (r = .45, ikke r = 0.45).",
        "Det anbefales sterkt å oppgi r² som uttrykk for felles varians (prosentandel forklart varians).",
      ],
    },
    {
      id: "regression",
      name: "Multippel Lineær Regresjon",
      templateNarrative:
        "En multippel lineær regresjonsanalyse viste at prediktorvariablene samlet forklarte en [signifikant / ikke-signifikant] andel av variansen i [utfall], F([df1], [df2]) = [F], p = [p], R² = [R2], justert R² = [adjR2]. Den sterkeste unike prediktoren var [variabelnavn] (β = [beta], p = [p]).",
      exampleFilled:
        "En multippel lineær regresjonsanalyse viste at prediktorene samlet forklarte en signifikant andel av variansen i post-kognitiv skår, F(3, 56) = 24.18, p < .001, R² = .56, justert R² = .54. Etterlevelse var den sterkeste unike prediktoren i modellen (β = .48, p < .001), fulgt av baseline-skår (β = .34, p = .002).",
      rules: [
        "Rapporter først den overordnede modelltesten (F, df, p, R² og Justert R²).",
        "Rapporter deretter koeffisienter for enkeltprediktorer: ustandardisert B med SE, og standardisert Beta (β).",
      ],
    },
  ];

  const current = templates.find((t) => t.id === selectedId) || templates[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.exampleFilled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Akademisk Formidling
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            APA 7 Rapportering & Vitenskapelig Notasjon
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            I masteroppgaver, forskningsartikler og vitenskapelige rapporter stilles strenge krav til hvordan
            statistiske analyser beskrives. Her finner du ferdige maler og de formelle typografiske reglene i APA 7.
          </p>
        </div>

        {/* Test Selector Tabs */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                selectedId === t.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 bg-slate-100 hover:bg-slate-200"
              }`}
            >
              {t.name.split("(")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Mandatory Academic Disclaimer Banner */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-3 text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold tracking-wide uppercase text-amber-900">
            GENERERT FORSLAG – MÅ KONTROLLERES AV FORSKER
          </span>
          <p className="text-amber-800 leading-relaxed">
            Tekstforslagene nedenfor er basert på standard konvensjoner i APA 7. Som forsker eller student er du selv
            ansvarlig for å etterprøve at tallene stemmer overens med rådata og studiedesign før innlevering.
          </p>
        </div>
      </div>

      {/* Main Reporting Showcase */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {current.name}
          </h2>
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Kopiert til utklipp!" : "Kopier APA-eksempel"}</span>
          </button>
        </div>

        {/* Narrative Example */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Eksempel på ferdig resultattekst (APA 7):
          </span>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-serif leading-relaxed text-slate-900 italic">
            «{current.exampleFilled}»
          </div>
        </div>

        {/* Structural Template */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Fyll-inn mal:
          </span>
          <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs leading-relaxed border border-slate-800">
            {current.templateNarrative}
          </div>
        </div>

        {/* APA 7 Rules */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
            <BookCheck className="w-4 h-4 text-emerald-600" />
            <span>Kritiske APA 7 notisregler for denne testen:</span>
          </span>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {current.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* APA 7 Table Example Layout */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          APA 7 Tabellretningslinjer (Ingen vertikale linjer!)
        </h3>
        <p className="text-xs text-slate-600">
          APA 7 forbyr vertikale tabellinjer. Bruk kun tre horisontale linjer: én over tabellhodet, én under tabellhodet, og én i bunnen før notatene.
        </p>

        {/* Mock APA Table */}
        <div className="border-t-2 border-b-2 border-slate-900 py-2">
          <div className="text-xs font-semibold text-slate-900">Table 1</div>
          <div className="text-xs italic text-slate-700 mb-2">Descriptive Statistics and T-Test Results for Cognitive Scores</div>
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-900">
              <tr>
                <th className="py-2">Group</th>
                <th className="py-2">n</th>
                <th className="py-2">M</th>
                <th className="py-2">SD</th>
                <th className="py-2">t</th>
                <th className="py-2">df</th>
                <th className="py-2">p</th>
                <th className="py-2">95% CI</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1.5">Intervention</td>
                <td className="py-1.5">30</td>
                <td className="py-1.5">28.10</td>
                <td className="py-1.5">1.45</td>
                <td className="py-1.5">13.92</td>
                <td className="py-1.5">58</td>
                <td className="py-1.5">&lt; .001</td>
                <td className="py-1.5">[5.11, 6.83]</td>
              </tr>
              <tr>
                <td className="py-1.5">Control</td>
                <td className="py-1.5">30</td>
                <td className="py-1.5">22.13</td>
                <td className="py-1.5">1.85</td>
                <td className="py-1.5">-</td>
                <td className="py-1.5">-</td>
                <td className="py-1.5">-</td>
                <td className="py-1.5">-</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-slate-500 italic">
          Note. CI = confidence interval. Statistically significant at p &lt; .05.
        </div>
      </div>
    </div>
  );
};
