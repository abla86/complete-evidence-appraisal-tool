import { StudyExtraction, Rob2StudyAssessment, MetaAnalysisResult, MetaStudyResult } from '../types';

export function calculateDichotomousMetaAnalysis(
  extractions: Record<string, StudyExtraction>,
  robAssessments: Record<string, Rob2StudyAssessment>,
  outcomeId: string,
  modelType: 'fixed' | 'random' = 'random',
  includeOnlyLowRob: boolean = false
): MetaAnalysisResult | null {
  const eligibleStudies: {
    studyId: string;
    studyName: string;
    year: number;
    eventsT: number;
    totalT: number;
    eventsC: number;
    totalC: number;
    rob: 'Low risk' | 'Some concerns' | 'High risk';
  }[] = [];

  for (const [sId, ext] of Object.entries(extractions)) {
    const outcome = ext.outcomes.find(o => o.outcomeId === outcomeId && o.type === 'dichotomous');
    if (!outcome) continue;

    const eventsT = outcome.eventsIntervention ?? 0;
    const totalT = outcome.totalIntervention ?? 0;
    const eventsC = outcome.eventsControl ?? 0;
    const totalC = outcome.totalControl ?? 0;

    if (totalT <= 0 || totalC <= 0) continue;

    const rob = robAssessments[sId]?.overall || 'Some concerns';
    if (includeOnlyLowRob && rob === 'High risk') continue;

    // Study name parse
    const nameParts = sId.split('_');
    const author = nameParts[0] || sId;
    const year = parseInt(nameParts[1]) || 2022;

    eligibleStudies.push({
      studyId: sId,
      studyName: `${author} et al.`,
      year,
      eventsT,
      totalT,
      eventsC,
      totalC,
      rob,
    });
  }

  if (eligibleStudies.length === 0) return null;

  // Compute ln(RR) and SE for each study with 0.5 continuity correction if zero events
  const calculated = eligibleStudies.map(s => {
    let eT = s.eventsT;
    let tT = s.totalT;
    let eC = s.eventsC;
    let tC = s.totalC;

    if (eT === 0 || eC === 0) {
      eT += 0.5;
      tT += 1;
      eC += 0.5;
      tC += 1;
    }

    const rT = eT / tT;
    const rC = eC / tC;
    const rr = rT / rC;
    const lnRR = Math.log(rr);
    // SE(lnRR) = sqrt( (1/eT - 1/tT) + (1/eC - 1/tC) )
    const varLnRR = (1 / eT - 1 / tT) + (1 / eC - 1 / tC);
    const seLnRR = Math.sqrt(Math.max(0.0001, varLnRR));
    const ciLower = Math.exp(lnRR - 1.96 * seLnRR);
    const ciUpper = Math.exp(lnRR + 1.96 * seLnRR);

    return {
      ...s,
      rr,
      lnRR,
      varLnRR,
      seLnRR,
      ciLower,
      ciUpper,
      fixedWeight: 1 / varLnRR,
    };
  });

  // Fixed effects pooled
  const sumFixedWeight = calculated.reduce((acc, c) => acc + c.fixedWeight, 0);
  const sumWeightEffect = calculated.reduce((acc, c) => acc + c.fixedWeight * c.lnRR, 0);
  const fixedPooledLnRR = sumWeightEffect / sumFixedWeight;

  // Cochran's Q: sum( w_i * (y_i - y_fixed)^2 )
  const df = calculated.length - 1;
  const cochranQ = calculated.reduce((acc, c) => {
    return acc + c.fixedWeight * Math.pow(c.lnRR - fixedPooledLnRR, 2);
  }, 0);

  // DerSimonian-Laird tau^2
  let tauSquared = 0;
  if (df > 0 && cochranQ > df) {
    const sumFixedSq = calculated.reduce((acc, c) => acc + Math.pow(c.fixedWeight, 2), 0);
    const cVal = sumFixedWeight - (sumFixedSq / sumFixedWeight);
    tauSquared = Math.max(0, (cochranQ - df) / cVal);
  }

  // I^2 (%) = max(0, ((Q - df) / Q) * 100)
  const iSquared = cochranQ > df && cochranQ > 0 
    ? Math.min(100, Math.max(0, ((cochranQ - df) / cochranQ) * 100))
    : 0;

  // Random weights
  const withWeights = calculated.map(c => {
    const weight = modelType === 'fixed' 
      ? c.fixedWeight 
      : 1 / (c.varLnRR + tauSquared);
    return { ...c, weight };
  });

  const totalWeight = withWeights.reduce((acc, c) => acc + c.weight, 0);

  const studyResults: MetaStudyResult[] = withWeights.map(c => ({
    studyId: c.studyId,
    studyName: c.studyName,
    year: c.year,
    effectSize: c.lnRR,
    ciLower: Math.log(c.ciLower),
    ciUpper: Math.log(c.ciUpper),
    displayEffect: Number(c.rr.toFixed(2)),
    displayCiLower: Number(c.ciLower.toFixed(2)),
    displayCiUpper: Number(c.ciUpper.toFixed(2)),
    weightPct: Number(((c.weight / totalWeight) * 100).toFixed(1)),
    rob: c.rob,
  }));

  // Pooled estimate
  const pooledLnRR = withWeights.reduce((acc, c) => acc + c.weight * c.lnRR, 0) / totalWeight;
  const pooledVar = 1 / totalWeight;
  const pooledSE = Math.sqrt(pooledVar);

  const pooledEffect = Math.exp(pooledLnRR);
  const pooledCiLower = Math.exp(pooledLnRR - 1.96 * pooledSE);
  const pooledCiUpper = Math.exp(pooledLnRR + 1.96 * pooledSE);

  const zValue = Math.abs(pooledLnRR / pooledSE);
  // Approximation of two-tailed normal p-value from z-score
  const pValue = 2 * (1 - normalCdf(zValue));
  const qPValue = chiSquarePValue(cochranQ, df);

  return {
    outcomeName: outcomeId === 'cv_death_hf' 
      ? 'Kardiovaskulær død eller sykehusinnleggelse for hjertesvikt' 
      : 'Primært endepunkt',
    effectMeasure: 'RR',
    model: modelType,
    studies: studyResults,
    pooledEffect: Number(pooledEffect.toFixed(2)),
    pooledCiLower: Number(pooledCiLower.toFixed(2)),
    pooledCiUpper: Number(pooledCiUpper.toFixed(2)),
    zValue: Number(zValue.toFixed(2)),
    pValue: Number(pValue.toFixed(4)),
    cochranQ: Number(cochranQ.toFixed(2)),
    df,
    qPValue: Number(qPValue.toFixed(4)),
    iSquared: Number(iSquared.toFixed(1)),
    tauSquared: Number(tauSquared.toFixed(4)),
  };
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

function chiSquarePValue(q: number, df: number): number {
  if (df <= 0 || q <= 0) return 1;
  // Wilson-Hilferty transformation approximation for chi-square
  const z = Math.pow(q / df, 1 / 3) - (1 - 2 / (9 * df)) / Math.sqrt(2 / (9 * df));
  return 1 - normalCdf(z);
}

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
  model: 'random' | 'fixed' = 'random'
): CalculatedMetaAnalysis {
  let totalEventsI = 0;
  let totalNI = 0;
  let totalEventsC = 0;
  let totalNC = 0;

  const validStudies = studies.filter(s => s.totalIntervention > 0 && s.totalControl > 0);

  if (validStudies.length === 0) {
    return {
      studyEffects: [],
      pooledEffect: 1.0,
      ciLower: 0.8,
      ciUpper: 1.2,
      i2: 0,
      cochranQ: 0,
      pValueQ: 1,
      totalEventsI: 0,
      totalNI: 0,
      totalEventsC: 0,
      totalNC: 0,
    };
  }

  const rawEffects = validStudies.map(s => {
    let eI = s.eventsIntervention;
    let nI = s.totalIntervention;
    let eC = s.eventsControl;
    let nC = s.totalControl;

    totalEventsI += s.eventsIntervention;
    totalNI += s.totalIntervention;
    totalEventsC += s.eventsControl;
    totalNC += s.totalControl;

    // Continuity correction if zero
    if (eI === 0 || eC === 0) {
      eI += 0.5;
      nI += 1;
      eC += 0.5;
      nC += 1;
    }

    const rI = eI / nI;
    const rC = eC / nC;
    const rr = Math.max(0.01, rI / rC);
    const lnRR = Math.log(rr);
    const variance = (1 / eI - 1 / nI) + (1 / eC - 1 / nC);
    const se = Math.sqrt(Math.max(0.0001, variance));
    const fixedWeight = 1 / variance;

    return {
      studyId: s.studyId,
      citationKey: s.citationKey,
      eventsIntervention: s.eventsIntervention,
      totalIntervention: s.totalIntervention,
      eventsControl: s.eventsControl,
      totalControl: s.totalControl,
      rr,
      lnRR,
      variance,
      se,
      fixedWeight,
      ciLower: Math.exp(lnRR - 1.96 * se),
      ciUpper: Math.exp(lnRR + 1.96 * se),
    };
  });

  const sumFixedWeights = rawEffects.reduce((acc, s) => acc + s.fixedWeight, 0);
  const sumFixedWeightedLnRR = rawEffects.reduce((acc, s) => acc + s.fixedWeight * s.lnRR, 0);
  const fixedPooledLnRR = sumFixedWeightedLnRR / (sumFixedWeights || 1);

  // Cochran Q
  const cochranQ = rawEffects.reduce((acc, s) => acc + s.fixedWeight * Math.pow(s.lnRR - fixedPooledLnRR, 2), 0);
  const df = Math.max(1, rawEffects.length - 1);
  const pValueQ = chiSquarePValue(cochranQ, df);
  const i2 = Math.max(0, Math.min(100, ((cochranQ - df) / (cochranQ || 1)) * 100));

  // DerSimonian-Laird Tau2
  const sumWeightsSq = rawEffects.reduce((acc, s) => acc + Math.pow(s.fixedWeight, 2), 0);
  const c = sumFixedWeights - sumWeightsSq / (sumFixedWeights || 1);
  const tauSquared = model === 'random' && cochranQ > df && c > 0 ? (cochranQ - df) / c : 0;

  // Final weights
  const studyEffectsWithFinalWeights = rawEffects.map(s => {
    const finalVariance = model === 'random' ? s.variance + tauSquared : s.variance;
    const finalWeight = 1 / (finalVariance || 1);
    return {
      ...s,
      finalWeight,
    };
  });

  const totalFinalWeight = studyEffectsWithFinalWeights.reduce((acc, s) => acc + s.finalWeight, 0);
  const sumFinalWeightedLnRR = studyEffectsWithFinalWeights.reduce((acc, s) => acc + s.finalWeight * s.lnRR, 0);
  const pooledLnRR = sumFinalWeightedLnRR / (totalFinalWeight || 1);
  const pooledSE = Math.sqrt(1 / (totalFinalWeight || 1));

  const pooledEffect = Math.exp(pooledLnRR);
  const ciLower = Math.exp(pooledLnRR - 1.96 * pooledSE);
  const ciUpper = Math.exp(pooledLnRR + 1.96 * pooledSE);

  const studyEffects: MetaEffectResult[] = studyEffectsWithFinalWeights.map(s => ({
    studyId: s.studyId,
    citationKey: s.citationKey,
    eventsIntervention: s.eventsIntervention,
    totalIntervention: s.totalIntervention,
    eventsControl: s.eventsControl,
    totalControl: s.totalControl,
    rr: Number(s.rr.toFixed(2)),
    ciLower: Number(s.ciLower.toFixed(2)),
    ciUpper: Number(s.ciUpper.toFixed(2)),
    weight: totalFinalWeight > 0 ? Number(((s.finalWeight / totalFinalWeight) * 100).toFixed(1)) : 0,
  }));

  return {
    studyEffects,
    pooledEffect: Number(pooledEffect.toFixed(2)),
    ciLower: Number(ciLower.toFixed(2)),
    ciUpper: Number(ciUpper.toFixed(2)),
    i2: Number(i2.toFixed(1)),
    cochranQ: Number(cochranQ.toFixed(2)),
    pValueQ: Number(pValueQ.toFixed(4)),
    totalEventsI,
    totalNI,
    totalEventsC,
    totalNC,
  };
}
