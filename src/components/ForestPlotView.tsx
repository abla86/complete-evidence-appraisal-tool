import React, { useMemo } from 'react';
import { createForestPlotSvg, metaAnalyze, type MetaStudy } from '../services/metaAnalysisEngine';

interface ForestPlotViewProps {
  studies: MetaStudy[];
}

/**
 * Renders the generated forest plot as an SVG image instead of injecting
 * generated markup into the DOM. The SVG generator is therefore kept outside
 * React's HTML sink and cannot introduce DOM markup through a React HTML
 * injection API.
 */
export default function ForestPlotView({ studies }: ForestPlotViewProps) {
  const result = useMemo(() => metaAnalyze(studies, 'RANDOM_DL'), [studies]);
  const svgDataUrl = useMemo(() => {
    const svg = createForestPlotSvg(result, studies);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [result, studies]);

  return (
    <section aria-labelledby="forest-plot-title">
      <h2 id="forest-plot-title">Forest Plot</h2>
      <img
        className="forest-plot-svg"
        src={svgDataUrl}
        alt="Forest plot showing the individual studies and pooled meta-analysis estimate."
        loading="lazy"
      />
      <p>I²: {result.i2.toFixed(1)}%</p>
    </section>
  );
}
