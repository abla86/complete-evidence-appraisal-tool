/**
 * Deterministic dichotomous meta-analysis engine consolidated from Evidence-OS.
 *
 * The engine calculates study-level risk ratios with continuity correction,
 * fixed/random-effects pooling, Cochran's Q, I² and confidence intervals.
 * It intentionally has no UI or persistence dependencies.
 */

export interface MetaStudyInput {
  studyId: string;
  citationKey: string;
  year: number;
  eventsIntervention: number;
  totalIntervention: number;
  eventsControl: number;
  totalControl: number;
}

export interface MetaEffectResult {
  studyId: string;
  citationKey: string;
  eventsIntervention: number;
  totalIntervention: number;
  eventsControl: number;
  totalControl: number;
  rr: number;
  ciLower: number;
  ciUpper: number;
  weight: number;
}

export interface CalculatedMetaAnalysis {
  studyEffects: MetaEffectResult[];
  pooledEffect: number;
  ciLower: number;
  ciUpper: number;
  i2: number;
  cochranQ: number;
  pValueQ: number;
  totalEventsI: number;
  totalNI: number;
  totalEventsC: number;
  totalNC: number;
}

export function calculateMetaAnalysis(
  studies: MetaStudyInput[],
  model: 'random' | 'fixed' = 'random',
): CalculatedMetaAnalysis {
  const validStudies = studies.filter(
    (study) =>
      study.totalIntervention > 0 &&
      study.totalControl > 0 &&
      study.eventsIntervention >= 0 &&
      study.eventsControl >= 0 &&
      study.eventsIntervention <= study.totalIntervention &&
      study.eventsControl <= study.totalControl,
  );

  const totals = validStudies.reduce(
    (acc, study) => ({
      totalEventsI: acc.totalEventsI + study.eventsIntervention,
      totalNI: acc.totalNI + study.totalIntervention,
      totalEventsC: acc.totalEventsC + study.eventsControl,
      totalNC: acc.totalNC + study.totalControl,
    }),
    { totalEventsI: 0, totalNI: 0, totalEventsC: 0, totalNC: 0 },
  );

  if (validStudies.length === 0) {
    return {
      studyEffects: [],
      pooledEffect: 1,
      ciLower: 0.8,
      ciUpper: 1.2,
      i2: 0,
      cochranQ: 0,
      pValueQ: 1,
      ...totals,
    };
  }

  const effects = validStudies.map((study) => {
    let eventsI = study.eventsIntervention;
    let totalI = study.totalIntervention;
    let eventsC = study.eventsControl;
    let totalC = study.totalControl;

    // Apply the standard 0.5 continuity correction to both arms when either
    // arm has zero events. This avoids undefined log risk ratios.
    if (eventsI === 0 || eventsC === 0) {
      eventsI += 0.5;
      totalI += 1;
      eventsC += 0.5;
      totalC += 1;
    }

    const riskI = eventsI / totalI;
    const riskC = eventsC / totalC;
    const rr = Math.max(Number.MIN_VALUE, riskI / riskC);
    const logRr = Math.log(rr);
    const variance = Math.max(
      0.0001,
      (1 / eventsI - 1 / totalI) + (1 / eventsC - 1 / totalC),
    );
    const standardError = Math.sqrt(variance);

    return {
      studyId: study.studyId,
      citationKey: study.citationKey,
      eventsIntervention: study.eventsIntervention,
      totalIntervention: study.totalIntervention,
      eventsControl: study.eventsControl,
      totalControl: study.totalControl,
      rr,
      logRr,
      variance,
      fixedWeight: 1 / variance,
      ciLower: Math.exp(logRr - 1.96 * standardError),
      ciUpper: Math.exp(logRr + 1.96 * standardError),
    };
  });

  const sumFixedWeights = effects.reduce((sum, effect) => sum + effect.fixedWeight, 0);
  const fixedLogRr =
    effects.reduce((sum, effect) => sum + effect.fixedWeight * effect.logRr, 0) /
    sumFixedWeights;
  const degreesOfFreedom = Math.max(1, effects.length - 1);
  const cochranQ = effects.reduce(
    (sum, effect) => sum + effect.fixedWeight * (effect.logRr - fixedLogRr) ** 2,
    0,
  );
  const i2 = Math.max(
    0,
    Math.min(100, ((cochranQ - degreesOfFreedom) / Math.max(cochranQ, 1e-12)) * 100),
  );

  const sumWeightSquares = effects.reduce(
    (sum, effect) => sum + effect.fixedWeight ** 2,
    0,
  );
  const correction = sumFixedWeights - sumWeightSquares / sumFixedWeights;
  const tauSquared =
    model === 'random' && cochranQ > degreesOfFreedom && correction > 0
      ? (cochranQ - degreesOfFreedom) / correction
      : 0;

  const weightedEffects = effects.map((effect) => ({
    ...effect,
    finalWeight:
      1 / (model === 'random' ? effect.variance + tauSquared : effect.variance),
  }));
  const totalWeight = weightedEffects.reduce((sum, effect) => sum + effect.finalWeight, 0);
  const pooledLogRr =
    weightedEffects.reduce((sum, effect) => sum + effect.finalWeight * effect.logRr, 0) /
    totalWeight;
  const pooledStandardError = Math.sqrt(1 / totalWeight);
  const pooledEffect = Math.exp(pooledLogRr);
  const ciLower = Math.exp(pooledLogRr - 1.96 * pooledStandardError);
  const ciUpper = Math.exp(pooledLogRr + 1.96 * pooledStandardError);

  return {
    studyEffects: weightedEffects.map((effect) => ({
      studyId: effect.studyId,
      citationKey: effect.citationKey,
      eventsIntervention: effect.eventsIntervention,
      totalIntervention: effect.totalIntervention,
      eventsControl: effect.eventsControl,
      totalControl: effect.totalControl,
      rr: round(effect.rr, 2),
      ciLower: round(effect.ciLower, 2),
      ciUpper: round(effect.ciUpper, 2),
      weight: round((effect.finalWeight / totalWeight) * 100, 1),
    })),
    pooledEffect: round(pooledEffect, 2),
    ciLower: round(ciLower, 2),
    ciUpper: round(ciUpper, 2),
    i2: round(i2, 1),
    cochranQ: round(cochranQ, 2),
    pValueQ: round(chiSquarePValue(cochranQ, degreesOfFreedom), 4),
    ...totals,
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const density = 0.3989423 * Math.exp((-x * x) / 2);
  const probability =
    density *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - probability : probability;
}

function chiSquarePValue(q: number, degreesOfFreedom: number): number {
  if (degreesOfFreedom <= 0 || q <= 0) return 1;
  const z =
    (q / degreesOfFreedom) ** (1 / 3) -
    (1 - 2 / (9 * degreesOfFreedom)) / Math.sqrt(2 / (9 * degreesOfFreedom));
  return 1 - normalCdf(z);
}
