import React, { useState } from "react";
import {
  BarChart3,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Activity,
  Maximize2,
} from "lucide-react";

export const EffectSizeView: React.FC = () => {
  // Cohen's d calculator inputs
  const [m1, setM1] = useState<number>(28.1);
  const [sd1, setSd1] = useState<number>(1.45);
  const [m2, setM2] = useState<number>(22.1);
  const [sd2, setSd2] = useState<number>(1.85);

  // Calculate pooled SD and Cohen's d
  const pooledSd = Math.sqrt((sd1 * sd1 + sd2 * sd2) / 2) || 1;
  const diff = m1 - m2;
  const cohensD = diff / pooledSd;

  // Percentage overlap calculation (Cohen's U3 / overlap approximation)
  // % Non-overlap = 2 * NormCDF(d/2) - 1
  const absD = Math.abs(cohensD);
  // Simple approximation of non-overlap
  const overlapPercent = Math.max(
    5,
    Math.min(95, Math.round(100 * Math.exp(-0.5 * (absD / 2) ** 2)))
  );

  const getDInterpretation = (d: number) => {
    const val = Math.abs(d);
    if (val < 0.2) return { label: "Ubetydelig / Triviell effekt", color: "text-slate-600", bg: "bg-slate-100" };
    if (val < 0.5) return { label: "Liten effekt (Small)", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
    if (val < 0.8) return { label: "Moderat / Medium effekt (Medium)", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
    if (val < 1.2) return { label: "Stor effekt (Large)", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" };
    return { label: "Svært stor effekt (Very Large)", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  };

  const interpretation = getDInterpretation(cohensD);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Størrelse vs. Sannsynlighet
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            Effektstørrelse, Konfidensintervall & Klinisk Relevans
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Hvorfor er ikke en p-verdi nok? En p-verdi forteller bare om en observasjon er uvanlig gitt nullhypotesen.
            Effektstørrelsen måler <em>hvor sterk</em> effekten er, uavhengig av utvalgsstørrelsen.
          </p>
        </div>
      </div>

      {/* Conceptual Triad: Statistical vs Practical vs Clinical */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-blue-900 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>1. Statistisk signifikans (p &lt; .05)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Forteller kun at differansen neppe skyldes ren flaks. Med et enormt utvalg (f.eks. N = 10 000) vil selv en differanse på 0.01 poeng bli statistisk signifikant (p &lt; .001).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>2. Praktisk signifikans (Effektstørrelse)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Standardiserer effekten (f.eks. Cohen's d eller r²) slik at den kan sammenlignes på tvers av ulike studier og måleskalaer. Besvarer: «Hvor mange standardavvik skiller gruppene?»
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 text-purple-900 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <span>3. Klinisk signifikans (MCID)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kjernen i helsefag: Gjør endringen en faktisk forskjell for pasienten eller brukeren? Overskrider effekten «Minimal Clinically Important Difference» (MCID)?
          </p>
        </div>
      </div>

      {/* Interactive Cohen's d Calculator */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Interaktiv Kalkulator
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Cohen's d & Distribusjonsoverlapp
            </h2>
          </div>
          <div className="text-xs text-slate-500">
            Formel: d = (M₁ - M₂) / SD_pooled
          </div>
        </div>

        {/* Input sliders/fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Gruppe 1 Gj.snitt (M₁):</label>
            <input
              type="number"
              step="0.1"
              value={m1}
              onChange={(e) => setM1(parseFloat(e.target.value) || 0)}
              className="w-full font-mono p-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Gruppe 1 Standardavvik (SD₁):</label>
            <input
              type="number"
              step="0.1"
              value={sd1}
              onChange={(e) => setSd1(Math.max(0.01, parseFloat(e.target.value) || 1))}
              className="w-full font-mono p-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Gruppe 2 Gj.snitt (M₂):</label>
            <input
              type="number"
              step="0.1"
              value={m2}
              onChange={(e) => setM2(parseFloat(e.target.value) || 0)}
              className="w-full font-mono p-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Gruppe 2 Standardavvik (SD₂):</label>
            <input
              type="number"
              step="0.1"
              value={sd2}
              onChange={(e) => setSd2(Math.max(0.01, parseFloat(e.target.value) || 1))}
              className="w-full font-mono p-2 border border-slate-300 rounded-md bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Calculated Results */}
        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400">Beregnet Cohen's d:</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                d = {cohensD.toFixed(2)}
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${interpretation.bg} ${interpretation.color}`}>
              {interpretation.label}
            </div>
          </div>

          {/* Visual distribution overlap indicator */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Fordelingenes felles overlapp: ca. {overlapPercent} %</span>
              <span>Ulikhet (Non-overlap): ca. {100 - overlapPercent} %</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${100 - overlapPercent}%` }}
              />
              <div
                className="bg-slate-600 h-full transition-all duration-300"
                style={{ width: `${overlapPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Standard Benchmarks Reference Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Klassiske tommelfingerregler for effektstørrelser (Cohen, 1988)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-3">Mål (Metric)</th>
                <th className="p-3">Brukes i</th>
                <th className="p-3">Liten effekt (Small)</th>
                <th className="p-3">Moderat effekt (Medium)</th>
                <th className="p-3">Stor effekt (Large)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-semibold font-mono">Cohen's d</td>
                <td className="p-3 text-slate-600">T-tester (2 grupper)</td>
                <td className="p-3 font-mono">0.20</td>
                <td className="p-3 font-mono">0.50</td>
                <td className="p-3 font-mono">0.80</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold font-mono">Pearson's r</td>
                <td className="p-3 text-slate-600">Bivariat korrelasjon</td>
                <td className="p-3 font-mono">.10</td>
                <td className="p-3 font-mono">.30</td>
                <td className="p-3 font-mono">.50</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold font-mono">Eta-squared (η²)</td>
                <td className="p-3 text-slate-600">Enveis ANOVA</td>
                <td className="p-3 font-mono">.01</td>
                <td className="p-3 font-mono">.06</td>
                <td className="p-3 font-mono">.14</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold font-mono">R² (forklart varians)</td>
                <td className="p-3 text-slate-600">Multippel regresjon</td>
                <td className="p-3 font-mono">.02 (2 %)</td>
                <td className="p-3 font-mono">.13 (13 %)</td>
                <td className="p-3 font-mono">.26 (26 %)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold font-mono">Cramer's V (φ)</td>
                <td className="p-3 text-slate-600">Chi-Square (krysstabeller)</td>
                <td className="p-3 font-mono">.10</td>
                <td className="p-3 font-mono">.30</td>
                <td className="p-3 font-mono">.50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
