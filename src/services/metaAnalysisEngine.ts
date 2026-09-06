export type MetaModel = 'FIXED_IV' | 'FIXED_MH' | 'RANDOM_DL';

export interface MetaStudy {
  id: string;
  label: string;
  effect: number;
  variance: number;
}

export interface MetaResult {
  model: MetaModel;
  pooledEffect: number;
  se: number;
  ciLow: number;
  ciHigh: number;
  Q: number;
  df: number;
  i2: number;
  tau2: number;
  weights: Record<string, number>;
}

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function metaAnalyze(studies: MetaStudy[], model: MetaModel = 'RANDOM_DL'): MetaResult {
  if (studies.length < 2) throw new Error('Minst to studier kreves.');
  const ids = studies.map(study => study.id.trim());
  if (ids.some(id => !id) || new Set(ids).size !== ids.length) throw new Error('Studier må ha unike, ikke-tomme ID-er.');
  if (studies.some(study => !Number.isFinite(study.variance) || study.variance <= 0)) {
    throw new Error('Varians må være positiv.');
  }
  if (studies.some(study => !Number.isFinite(study.effect))) {
    throw new Error('Effektstørrelser må være numeriske.');
  }

  const fixedWeights = studies.map(study => 1 / study.variance);
  const fixedEffect = sum(studies.map((study, index) => study.effect * fixedWeights[index])) / sum(fixedWeights);
  const Q = sum(studies.map((study, index) => fixedWeights[index] * (study.effect - fixedEffect) ** 2));
  const df = studies.length - 1;
  const weightSum = sum(fixedWeights);
  const c = weightSum - sum(fixedWeights.map(weight => weight * weight)) / weightSum;
  const tau2 = model === 'RANDOM_DL' ? Math.max(0, (Q - df) / Math.max(c, Number.EPSILON)) : 0;
  const randomWeights = studies.map(study => 1 / (study.variance + tau2));
  const randomWeightSum = sum(randomWeights);
  const pooledEffect = sum(studies.map((study, index) => study.effect * randomWeights[index])) / randomWeightSum;
  const se = Math.sqrt(1 / randomWeightSum);
  const z = 1.96;

  return {
    model,
    pooledEffect,
    se,
    ciLow: pooledEffect - z * se,
    ciHigh: pooledEffect + z * se,
    Q,
    df,
    i2: Q > 0 ? Math.max(0, ((Q - df) / Q) * 100) : 0,
    tau2,
    weights: Object.fromEntries(
      studies.map((study, index) => [study.id, randomWeights[index] / randomWeightSum]),
    ),
  };
}

export function createForestPlotSvg(result: MetaResult, studies: MetaStudy[]): string {
  const low = Math.min(
    ...studies.map(study => study.effect - 1.96 * Math.sqrt(study.variance)),
    result.ciLow,
  );
  const high = Math.max(
    ...studies.map(study => study.effect + 1.96 * Math.sqrt(study.variance)),
    result.ciHigh,
  );
  const x = (effect: number): number => 40 + ((effect - low) / (high - low || 1)) * 520;

  const rows = studies.map((study, index) => {
    const y = 30 + index * 36;
    const studyLow = x(study.effect - 1.96 * Math.sqrt(study.variance));
    const studyHigh = x(study.effect + 1.96 * Math.sqrt(study.variance));
    const weight = result.weights[study.id] ?? 0;
    const size = 8 + weight * 16;

    return \`<text x="0" y="\${y + 4}">\${escapeXml(study.label)}</text><line x1="\${studyLow}" x2="\${studyHigh}" y1="\${y}" y2="\${y}" stroke="black"/><rect x="\${x(study.effect) - size / 2}" y="\${y - size / 2}" width="\${size}" height="\${size}" fill="black"/>\`;
  }).join('');

  return \`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="\${80 + studies.length * 36}" role="img" aria-label="Forest plot"><line x1="\${x(0)}" x2="\${x(0)}" y1="10" y2="\${60 + studies.length * 36}" stroke="black"/>\${rows}<polygon points="\${x(result.ciLow)},\${70 + studies.length * 36} \${x(result.pooledEffect)},\${62 + studies.length * 36} \${x(result.ciHigh)},\${70 + studies.length * 36} \${x(result.pooledEffect)},\${78 + studies.length * 36}" fill="black"/></svg>\`;
}
