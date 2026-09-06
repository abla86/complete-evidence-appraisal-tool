import React from 'react';
import DOMPurify from 'dompurify';
import { createForestPlotSvg, metaAnalyze, type MetaStudy } from '../services/metaAnalysisEngine';

interface ForestPlotViewProps {
  studies: MetaStudy[];
}

export default function ForestPlotView({ studies }: ForestPlotViewProps) {
  if (studies.length < 2) {
    return (
      <section>
        <h2>Forest Plot</h2>
        <p>Minst to studier kreves for å beregne en metaanalyse og forest plot.</p>
      </section>
    );
  }

  const result = metaAnalyze(studies);

  return (
    <section>
      <h2>Forest Plot</h2>
      <div
        className="forest-plot-svg"
        aria-label="Forest plot"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(createForestPlotSvg(result, studies), { USE_PROFILES: { svg: true } }) }}
      />
      <p>I²: {result.i2.toFixed(1)}%</p>
    </section>
  );
}
