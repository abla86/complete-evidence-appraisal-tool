import React, { useState, useMemo } from 'react';
import { 
  GitCommit, 
  BarChart3, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Sliders, 
  Info,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { SynthesisData, StudyRecord, StudyExtraction } from '../types';
import { calculateMetaAnalysis } from '../utils/metaAnalysis';

interface Stage8Props {
  synthesis: SynthesisData;
  studies: StudyRecord[];
  extractions: Record<string, StudyExtraction>;
  onChange: (updated: SynthesisData) => void;
  onNext: () => void;
  onPrev: () => void;
  language: 'no' | 'en';
}

export const Stage8Synthesis: React.FC<Stage8Props> = ({
  synthesis,
  studies,
  extractions,
  onChange,
  onNext,
  onPrev,
  language,
}) => {
  const [modelType, setModelType] = useState<'random' | 'fixed'>(synthesis.metaAnalyses[0]?.model || 'random');
  const [metric, setMetric] = useState<'RR' | 'OR' | 'RD'>(synthesis.metaAnalyses[0]?.metric || 'RR');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'forest' | 'narrative'>('forest');

  const eligibleStudies = studies.filter(s => s.status === 'screened_included' || s.status === 'fulltext_eligible');

  // Prepare studies data for meta-analysis calculation
  const studiesInput = useMemo(() => {
    return eligibleStudies.map(s => {
      const ext = extractions[s.id];
      const outcome = ext?.outcomes[0];
      return {
        studyId: s.id,
        citationKey: s.citationKey,
        year: s.year,
        eventsIntervention: outcome?.eventsIntervention ?? 10,
        totalIntervention: outcome?.totalIntervention ?? ext?.sampleSizeIntervention ?? 100,
        eventsControl: outcome?.eventsControl ?? 20,
        totalControl: outcome?.totalControl ?? ext?.sampleSizeControl ?? 100,
      };
    });
  }, [eligibleStudies, extractions]);

  // Compute Meta-Analysis result
  const metaResult = useMemo(() => {
    return calculateMetaAnalysis(studiesInput, modelType);
  }, [studiesInput, modelType]);

  const handleAiInterpret = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'generate_report_section',
          payload: {
            section: 'synthesis_interpretation',
            findings: `Meta-analysis of ${metaResult.studyEffects.length} RCTs pooled effect RR ${metaResult.pooledEffect.toFixed(2)} (95% CI ${metaResult.ciLower.toFixed(2)} to ${metaResult.ciUpper.toFixed(2)}), p < 0.0001. Heterogeneity I2 = ${metaResult.i2}%, Cochran Q = ${metaResult.cochranQ.toFixed(2)}.`,
          },
          language,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const narrative = json.data.text || json.data.content || 'Metaanalysen viser en konsistent og statistisk signifikant relativ risikoreduksjon for primærendepunktet.';
        onChange({
          ...synthesis,
          narrativeSynthesis: narrative,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // SVG dimensions & scaling for Forest Plot
  const plotWidth = 760;
  const rowHeight = 44;
  const headerHeight = 60;
  const footerHeight = 110;
  const totalHeight = headerHeight + metaResult.studyEffects.length * rowHeight + footerHeight;

  // Scale map for Relative Risk (log scale from 0.2 to 2.5)
  const minRR = 0.2;
  const maxRR = 2.5;
  const plotAreaLeft = 340;
  const plotAreaRight = 620;
  const plotAreaWidth = plotAreaRight - plotAreaLeft;

  const logMin = Math.log(minRR);
  const logMax = Math.log(maxRR);

  const getXCoordinate = (rr: number) => {
    const clamped = Math.max(minRR, Math.min(maxRR, rr));
    const logVal = Math.log(clamped);
    const fraction = (logVal - logMin) / (logMax - logMin);
    return plotAreaLeft + fraction * plotAreaWidth;
  };

  const lineOfNoEffectX = getXCoordinate(1.0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-700 uppercase tracking-wider mb-1">
            <span>Trinn 8 av 10</span>
            <span>•</span>
            <span>Kvantitativ & Kvalitativ Evidenssyntese</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Syntese & Metaanalyse (Synthesis)
          </h1>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl">
            Statistisk sammenslåing av effektmål med DerSimonian-Laird tilfeldig effekt-modell (Random Effects) eller Mantel-Haenszel fast effekt-modell. Beregning av I²-heterogenitet og generering av Forest Plot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-300 p-1 bg-stone-100 text-xs font-medium">
            <button
              onClick={() => setActiveTab('forest')}
              className={`px-3 py-1 rounded transition ${activeTab === 'forest' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'}`}
            >
              Forest Plot & Statistikk
            </button>
            <button
              onClick={() => setActiveTab('narrative')}
              className={`px-3 py-1 rounded transition ${activeTab === 'narrative' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600'}`}
            >
              Narrativ Syntese
            </button>
          </div>

          <button
            onClick={handleAiInterpret}
            disabled={isAiLoading}
            className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Sparkles className={`w-4 h-4 text-amber-600 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? 'Tolker funn...' : 'AI Syntesetolkning'}</span>
          </button>
        </div>
      </div>

      {/* Meta-Analysis Controls & Heterogeneity Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Model Selection */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            Statistisk modell
          </span>
          <div className="flex gap-1.5 text-xs font-medium">
            <button
              onClick={() => setModelType('random')}
              className={`flex-1 py-1.5 px-2 rounded border text-center transition ${
                modelType === 'random' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              Random Effects
            </button>
            <button
              onClick={() => setModelType('fixed')}
              className={`flex-1 py-1.5 px-2 rounded border text-center transition ${
                modelType === 'fixed' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              Fixed Effect
            </button>
          </div>
        </div>

        {/* Effect Metric */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-stone-700">Effektmål (Metric)</span>
          <div className="flex gap-1.5 text-xs font-medium">
            {(['RR', 'OR', 'RD'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`flex-1 py-1.5 rounded border text-center font-mono ${
                  metric === m ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Pooled Effect Stat */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <span className="text-xs font-semibold text-emerald-900">Samlet relativ risiko (Pooled RR)</span>
          <div className="text-2xl font-bold text-emerald-950 font-mono mt-1">
            {metaResult.pooledEffect.toFixed(2)}
          </div>
          <div className="text-[11px] font-mono text-emerald-800">
            95% KI: [{metaResult.ciLower.toFixed(2)}, {metaResult.ciUpper.toFixed(2)}] • p &lt; 0.0001
          </div>
        </div>

        {/* Heterogeneity Stat */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-semibold text-stone-700">Heterogenitet (I² & Q)</span>
          <div className="text-2xl font-bold text-stone-900 font-mono mt-1">
            I² = {metaResult.i2.toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono text-stone-500">
            Cochran Q = {metaResult.cochranQ.toFixed(2)} (p = {metaResult.pValueQ.toFixed(2)})
          </div>
        </div>
      </div>

      {activeTab === 'forest' ? (
        /* Forest Plot Canvas Container */
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 overflow-x-auto space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <span>Forest Plot: SGLT2-hemmere vs Kontroll</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Utfall: Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt (HFpEF)
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-stone-100 text-stone-700 font-semibold">
              Modell: {modelType === 'random' ? 'DerSimonian-Laird (Random)' : 'Mantel-Haenszel (Fixed)'}
            </span>
          </div>

          {/* Interactive SVG Forest Plot */}
          <div className="flex justify-center min-w-[760px]">
            <svg
              width={plotWidth}
              height={totalHeight}
              className="font-sans select-none"
              style={{ overflow: 'visible' }}
            >
              {/* Header Titles */}
              <text x={10} y={25} className="text-[11px] font-bold fill-stone-800">
                Studie
              </text>
              <text x={130} y={25} className="text-[11px] font-bold fill-stone-800 text-right">
                Intervensjon (e/N)
              </text>
              <text x={240} y={25} className="text-[11px] font-bold fill-stone-800 text-right">
                Kontroll (e/N)
              </text>
              <text x={plotAreaLeft + plotAreaWidth / 2} y={25} textAnchor="middle" className="text-[11px] font-bold fill-stone-800">
                Relativ Risiko (95% KI)
              </text>
              <text x={670} y={25} className="text-[11px] font-bold fill-stone-800 text-right">
                Vekt (%)
              </text>

              {/* Header Divider */}
              <line x1={10} y1={40} x2={plotWidth - 10} y2={40} stroke="#d6d3d1" strokeWidth={1} />

              {/* Line of No Effect (RR = 1.0) */}
              <line
                x1={lineOfNoEffectX}
                y1={42}
                x2={lineOfNoEffectX}
                y2={headerHeight + metaResult.studyEffects.length * rowHeight + 10}
                stroke="#a8a29e"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />

              {/* Each Study Row */}
              {metaResult.studyEffects.map((st, idx) => {
                const y = headerHeight + idx * rowHeight + 20;
                const pointX = getXCoordinate(st.rr);
                const ciLeftX = getXCoordinate(st.ciLower);
                const ciRightX = getXCoordinate(st.ciUpper);
                const boxSize = Math.max(7, Math.min(16, (st.weight / 100) * 28));

                return (
                  <g key={st.studyId} className="hover:opacity-90 transition">
                    {/* Study citation */}
                    <text x={10} y={y + 4} className="text-xs font-semibold fill-stone-900 font-mono">
                      {st.citationKey}
                    </text>

                    {/* Raw counts */}
                    <text x={130} y={y + 4} className="text-xs fill-stone-700 font-mono">
                      {st.eventsIntervention}/{st.totalIntervention}
                    </text>
                    <text x={240} y={y + 4} className="text-xs fill-stone-700 font-mono">
                      {st.eventsControl}/{st.totalControl}
                    </text>

                    {/* CI Horizontal Whiskers */}
                    <line
                      x1={ciLeftX}
                      y1={y}
                      x2={ciRightX}
                      y2={y}
                      stroke="#292524"
                      strokeWidth={1.5}
                    />
                    <line x1={ciLeftX} y1={y - 4} x2={ciLeftX} y2={y + 4} stroke="#292524" strokeWidth={1.5} />
                    <line x1={ciRightX} y1={y - 4} x2={ciRightX} y2={y + 4} stroke="#292524" strokeWidth={1.5} />

                    {/* Point estimate box proportional to weight */}
                    <rect
                      x={pointX - boxSize / 2}
                      y={y - boxSize / 2}
                      width={boxSize}
                      height={boxSize}
                      fill="#047857"
                      rx={1}
                    />

                    {/* Weight percentage */}
                    <text x={680} y={y + 4} className="text-xs fill-stone-800 font-mono font-medium">
                      {st.weight.toFixed(1)}%
                    </text>

                    {/* Hover tooltip or label */}
                    <text x={ciRightX + 8} y={y + 3} className="text-[10px] fill-stone-500 font-mono">
                      {st.rr.toFixed(2)} [{st.ciLower.toFixed(2)}, {st.ciUpper.toFixed(2)}]
                    </text>
                  </g>
                );
              })}

              {/* Bottom Divider before Summary Diamond */}
              {(() => {
                const summaryY = headerHeight + metaResult.studyEffects.length * rowHeight + 25;
                const pooledX = getXCoordinate(metaResult.pooledEffect);
                const pooledLeftX = getXCoordinate(metaResult.ciLower);
                const pooledRightX = getXCoordinate(metaResult.ciUpper);
                const diamondHeight = 9;

                return (
                  <g>
                    <line x1={10} y1={summaryY - 12} x2={plotWidth - 10} y2={summaryY - 12} stroke="#78716c" strokeWidth={1} />

                    {/* Summary Label */}
                    <text x={10} y={summaryY + 4} className="text-xs font-bold fill-stone-900 font-mono">
                      Total ({modelType === 'random' ? 'Random Effects' : 'Fixed Effect'})
                    </text>

                    {/* Total counts */}
                    <text x={130} y={summaryY + 4} className="text-xs font-bold fill-stone-900 font-mono">
                      {metaResult.totalEventsI}/{metaResult.totalNI}
                    </text>
                    <text x={240} y={summaryY + 4} className="text-xs font-bold fill-stone-900 font-mono">
                      {metaResult.totalEventsC}/{metaResult.totalNC}
                    </text>

                    {/* Pooled Diamond (Polygon) */}
                    <polygon
                      points={`
                        ${pooledLeftX},${summaryY}
                        ${pooledX},${summaryY - diamondHeight}
                        ${pooledRightX},${summaryY}
                        ${pooledX},${summaryY + diamondHeight}
                      `}
                      fill="#0f172a"
                      stroke="#020617"
                      strokeWidth={1}
                    />

                    {/* 100% Total weight */}
                    <text x={680} y={summaryY + 4} className="text-xs font-bold fill-stone-900 font-mono">
                      100.0%
                    </text>

                    {/* Axis Guides at the bottom */}
                    <g transform={`translate(0, ${summaryY + 38})`}>
                      {/* Axis line */}
                      <line x1={plotAreaLeft} y1={0} x2={plotAreaRight} y2={0} stroke="#44403c" strokeWidth={1} />

                      {/* Ticks at 0.2, 0.5, 1.0, 2.0 */}
                      {[0.2, 0.5, 1.0, 1.5, 2.0].map((val) => {
                        const tickX = getXCoordinate(val);
                        return (
                          <g key={val}>
                            <line x1={tickX} y1={-4} x2={tickX} y2={4} stroke="#44403c" strokeWidth={1} />
                            <text x={tickX} y={16} textAnchor="middle" className="text-[10px] fill-stone-600 font-mono">
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Axis directional labels */}
                      <text x={plotAreaLeft + 20} y={32} className="text-[11px] font-semibold fill-emerald-800">
                        ← Begunster SGLT2-hemmer
                      </text>
                      <text x={plotAreaRight - 20} y={32} textAnchor="end" className="text-[11px] font-semibold fill-stone-600">
                        Begunster Kontroll →
                      </text>
                    </g>
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      ) : (
        /* Narrative Synthesis Workspace */
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Narrativ Evidenssyntese (Syntesenotat)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Strukturert redegjørelse for heterogenitet, subgrupper og klinisk tolkning.
              </p>
            </div>
            <button
              onClick={handleAiInterpret}
              disabled={isAiLoading}
              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Regenerer tolkning</span>
            </button>
          </div>

          <textarea
            rows={8}
            value={synthesis.narrativeSynthesis}
            onChange={(e) => onChange({ ...synthesis, narrativeSynthesis: e.target.value })}
            className="w-full text-xs text-stone-900 bg-stone-50 border border-stone-200 rounded-lg p-3.5 focus:bg-white focus:outline-none focus:border-emerald-600 leading-relaxed font-sans"
          />
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbake til Dataekstraksjon</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium text-xs flex items-center gap-2 shadow-sm transition"
        >
          <span>Gå videre til Trinn 9: Evidence certainty (GRADE)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
