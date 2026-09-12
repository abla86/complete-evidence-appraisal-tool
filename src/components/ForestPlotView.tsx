import React from 'react';
import { createForestPlotSvg, metaAnalyze, type MetaStudy } from '../services/metaAnalysisEngine';

export default function ForestPlotView({ studies }: { studies: MetaStudy[] }) {
  const r = metaAnalyze(studies, 'RANDOM_DL');
  const svg = createForestPlotSvg(r, studies);
  return (
    <section>
      <h2>Forest Plot</h2>
      <div className="forest-plot-svg" dangerouslySetInnerHTML={{ __html: svg }} />
      <p>I²: {r.i2.toFixed(1)}%</p>
    </section>
  );
}
