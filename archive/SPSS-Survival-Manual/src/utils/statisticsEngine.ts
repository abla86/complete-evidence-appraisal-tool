import {
  DescriptiveStats,
  TTestResult,
  AnovaResult,
  CorrelationResult,
  RegressionResult,
  MannWhitneyResult,
  CronbachResult,
} from "../types";

// Statistical helper: standard error & normal CDF approximations
function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26 approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// Student's t distribution p-value (two-tailed) approximation via Hill's algorithm / beta approx
export function tDistributionTwoTailed(tVal: number, df: number): number {
  const t = Math.abs(tVal);
  if (df <= 0) return 1.0;
  if (t === 0) return 1.0;

  // For large df, standard normal is a very close approximation
  if (df > 120) {
    const p = 2 * (1 - normalCdf(t));
    return Math.max(0.0001, Math.min(1, p));
  }

  // Peizer-Pratt / Hill approximation for t distribution
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;

  // Incomplete beta function approximation
  let p = incompleteBeta(x, a, b);
  return Math.max(0.00001, Math.min(1, p));
}

// Incomplete beta approximation using continued fraction
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt =
    Math.exp(
      gammaLn(a + b) -
        gammaLn(a) -
        gammaLn(b) +
        a * Math.log(x) +
        b * Math.log(1 - x)
    );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(x, a, b)) / a;
  } else {
    return 1 - (bt * betaContinuedFraction(1 - x, b, a)) / b;
  }
}

function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 100;
  const epsilon = 3.0e-7;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < 1.0e-30) d = 1.0e-30;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < 1.0e-30) d = 1.0e-30;
    c = 1.0 + aa / c;
    if (Math.abs(c) < 1.0e-30) c = 1.0e-30;
    d = 1.0 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < 1.0e-30) d = 1.0e-30;
    c = 1.0 + aa / c;
    if (Math.abs(c) < 1.0e-30) c = 1.0e-30;
    d = 1.0 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1.0) < epsilon) break;
  }

  return h;
}

function gammaLn(z: number): number {
  // Lanczos approximation
  const g = 7;
  const C = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109583115812,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaLn(1 - z);
  }

  z -= 1;
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }

  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// F-distribution p-value approximation
export function fDistributionPValue(fVal: number, df1: number, df2: number): number {
  if (fVal <= 0 || df1 <= 0 || df2 <= 0) return 1.0;
  const x = df2 / (df2 + df1 * fVal);
  return incompleteBeta(x, df2 / 2, df1 / 2);
}

// Chi-square distribution p-value approximation
export function chiSquarePValue(chiSq: number, df: number): number {
  if (chiSq <= 0 || df <= 0) return 1.0;
  return 1 - incompleteGamma(df / 2, chiSq / 2);
}

function incompleteGamma(s: number, x: number): number {
  if (x < 0) return 0;
  let sum = 0;
  let term = 1 / s;
  sum = term;
  for (let n = 1; n < 100; n++) {
    term *= x / (s + n);
    sum += term;
    if (term < 1e-10) break;
  }
  return sum * Math.exp(-x + s * Math.log(x) - gammaLn(s));
}

// Descriptive Statistics Calculator
export function calculateDescriptives(
  values: number[],
  varName = "Variabel"
): DescriptiveStats {
  const clean = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
  const n = clean.length;
  const missing = values.length - n;

  if (n === 0) {
    return {
      variable: varName,
      n: 0,
      missing,
      mean: 0,
      median: 0,
      sd: 0,
      variance: 0,
      min: 0,
      max: 0,
      range: 0,
      skewness: 0,
      kurtosis: 0,
    };
  }

  clean.sort((a, b) => a - b);
  const sum = clean.reduce((acc, val) => acc + val, 0);
  const mean = sum / n;

  const median =
    n % 2 === 0
      ? (clean[n / 2 - 1] + clean[n / 2]) / 2
      : clean[Math.floor(n / 2)];

  const min = clean[0];
  const max = clean[n - 1];
  const range = max - min;

  const sumSqDiff = clean.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = n > 1 ? sumSqDiff / (n - 1) : 0;
  const sd = Math.sqrt(variance);

  // Skewness and Kurtosis
  let m3 = 0;
  let m4 = 0;
  for (const v of clean) {
    const diff = v - mean;
    m3 += Math.pow(diff, 3);
    m4 += Math.pow(diff, 4);
  }

  let skewness = 0;
  let kurtosis = 0;
  if (n > 2 && sd > 0) {
    skewness = (n / ((n - 1) * (n - 2))) * (m3 / Math.pow(sd, 3));
  }
  if (n > 3 && sd > 0) {
    const term1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const term2 = m4 / Math.pow(variance, 2);
    const term3 = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    kurtosis = term1 * term2 - term3; // excess kurtosis (normal = 0)
  }

  return {
    variable: varName,
    n,
    missing,
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    sd: Number(sd.toFixed(2)),
    variance: Number(variance.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    range: Number(range.toFixed(2)),
    skewness: Number(skewness.toFixed(3)),
    kurtosis: Number(kurtosis.toFixed(3)),
  };
}

// Independent-Samples T-Test
export function calculateIndependentTTest(
  group1Values: number[],
  group2Values: number[],
  group1Name = "Gruppe 1",
  group2Name = "Gruppe 2"
): TTestResult {
  const g1 = group1Values.filter((v) => !isNaN(v));
  const g2 = group2Values.filter((v) => !isNaN(v));

  const n1 = g1.length;
  const n2 = g2.length;

  const m1 = g1.reduce((a, b) => a + b, 0) / n1;
  const m2 = g2.reduce((a, b) => a + b, 0) / n2;

  const v1 = g1.reduce((a, b) => a + Math.pow(b - m1, 2), 0) / (n1 - 1);
  const v2 = g2.reduce((a, b) => a + Math.pow(b - m2, 2), 0) / (n2 - 1);

  const sd1 = Math.sqrt(v1);
  const sd2 = Math.sqrt(v2);

  const df = n1 + n2 - 2;
  const pooledVariance = ((n1 - 1) * v1 + (n2 - 1) * v2) / df;
  const pooledSD = Math.sqrt(pooledVariance);

  const seDiff = Math.sqrt(pooledVariance * (1 / n1 + 1 / n2));
  const meanDiff = m1 - m2;
  const t = seDiff > 0 ? meanDiff / seDiff : 0;

  const pValue = tDistributionTwoTailed(t, df);
  const cohensD = pooledSD > 0 ? meanDiff / pooledSD : 0;

  // Approximate 95% critical value t_crit ~ 1.96 + 2.37/df
  const tCrit = 1.96 + (df > 0 ? 2.37 / df : 0);
  const ciLower = meanDiff - tCrit * seDiff;
  const ciUpper = meanDiff + tCrit * seDiff;

  // Simple F-ratio for Levene's variance equality indicator
  const leveneF = v2 > 0 ? Math.max(v1, v2) / Math.min(v1, v2) : 1;
  const leveneP = fDistributionPValue(leveneF, n1 - 1, n2 - 1);

  return {
    testName: "Independent-Samples T-Test",
    t: Number(t.toFixed(3)),
    df,
    pValue: Number(pValue.toFixed(4)),
    meanDiff: Number(meanDiff.toFixed(2)),
    ciLower: Number(ciLower.toFixed(2)),
    ciUpper: Number(ciUpper.toFixed(2)),
    cohensD: Number(cohensD.toFixed(3)),
    group1Stats: {
      name: group1Name,
      n: n1,
      mean: Number(m1.toFixed(2)),
      sd: Number(sd1.toFixed(2)),
    },
    group2Stats: {
      name: group2Name,
      n: n2,
      mean: Number(m2.toFixed(2)),
      sd: Number(sd2.toFixed(2)),
    },
    leveneF: Number(leveneF.toFixed(3)),
    leveneP: Number(leveneP.toFixed(4)),
  };
}

// Paired-Samples T-Test
export function calculatePairedTTest(
  preValues: number[],
  postValues: number[],
  preName = "Tidspunkt 1",
  postName = "Tidspunkt 2"
): TTestResult {
  const n = Math.min(preValues.length, postValues.length);
  const diffs: number[] = [];

  for (let i = 0; i < n; i++) {
    if (!isNaN(preValues[i]) && !isNaN(postValues[i])) {
      diffs.push(postValues[i] - preValues[i]);
    }
  }

  const validN = diffs.length;
  const meanDiff = diffs.reduce((a, b) => a + b, 0) / validN;
  const varDiff =
    diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / (validN - 1);
  const sdDiff = Math.sqrt(varDiff);
  const seDiff = sdDiff / Math.sqrt(validN);

  const df = validN - 1;
  const t = seDiff > 0 ? meanDiff / seDiff : 0;
  const pValue = tDistributionTwoTailed(t, df);
  const cohensD = sdDiff > 0 ? meanDiff / sdDiff : 0;

  const tCrit = 1.96 + (df > 0 ? 2.37 / df : 0);
  const ciLower = meanDiff - tCrit * seDiff;
  const ciUpper = meanDiff + tCrit * seDiff;

  const mPre = preValues.slice(0, validN).reduce((a, b) => a + b, 0) / validN;
  const mPost = postValues.slice(0, validN).reduce((a, b) => a + b, 0) / validN;
  const sdPre = Math.sqrt(
    preValues.slice(0, validN).reduce((a, b) => a + Math.pow(b - mPre, 2), 0) /
      (validN - 1)
  );
  const sdPost = Math.sqrt(
    postValues.slice(0, validN).reduce((a, b) => a + Math.pow(b - mPost, 2), 0) /
      (validN - 1)
  );

  return {
    testName: "Paired-Samples T-Test",
    t: Number(t.toFixed(3)),
    df,
    pValue: Number(pValue.toFixed(4)),
    meanDiff: Number(meanDiff.toFixed(2)),
    ciLower: Number(ciLower.toFixed(2)),
    ciUpper: Number(ciUpper.toFixed(2)),
    cohensD: Number(cohensD.toFixed(3)),
    group1Stats: {
      name: preName,
      n: validN,
      mean: Number(mPre.toFixed(2)),
      sd: Number(sdPre.toFixed(2)),
    },
    group2Stats: {
      name: postName,
      n: validN,
      mean: Number(mPost.toFixed(2)),
      sd: Number(sdPost.toFixed(2)),
    },
  };
}

// One-Way ANOVA
export function calculateOneWayAnova(
  groups: { name: string; values: number[] }[]
): AnovaResult {
  const cleanGroups = groups.map((g) => ({
    name: g.name,
    values: g.values.filter((v) => !isNaN(v)),
  }));

  let totalN = 0;
  let totalSum = 0;

  const groupStats = cleanGroups.map((g) => {
    const n = g.values.length;
    const sum = g.values.reduce((a, b) => a + b, 0);
    const mean = n > 0 ? sum / n : 0;
    const sd =
      n > 1
        ? Math.sqrt(
            g.values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1)
          )
        : 0;

    totalN += n;
    totalSum += sum;

    return { name: g.name, n, mean, sd, values: g.values };
  });

  const grandMean = totalN > 0 ? totalSum / totalN : 0;
  const k = cleanGroups.length;

  let ssBetween = 0;
  let ssWithin = 0;

  for (const g of groupStats) {
    ssBetween += g.n * Math.pow(g.mean - grandMean, 2);
    for (const val of g.values) {
      ssWithin += Math.pow(val - g.mean, 2);
    }
  }

  const dfBetween = k - 1;
  const dfWithin = totalN - k;

  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;

  const f = msWithin > 0 ? msBetween / msWithin : 0;
  const pValue = fDistributionPValue(f, dfBetween, dfWithin);
  const etaSquared =
    ssBetween + ssWithin > 0 ? ssBetween / (ssBetween + ssWithin) : 0;

  return {
    testName: "One-Way ANOVA",
    f: Number(f.toFixed(3)),
    dfBetween,
    dfWithin,
    pValue: Number(pValue.toFixed(4)),
    etaSquared: Number(etaSquared.toFixed(3)),
    groups: groupStats.map((g) => ({
      name: g.name,
      n: g.n,
      mean: Number(g.mean.toFixed(2)),
      sd: Number(g.sd.toFixed(2)),
    })),
    ssBetween: Number(ssBetween.toFixed(2)),
    ssWithin: Number(ssWithin.toFixed(2)),
    msBetween: Number(msBetween.toFixed(2)),
    msWithin: Number(msWithin.toFixed(2)),
  };
}

// Pearson or Spearman Correlation
export function calculateCorrelation(
  x: number[],
  y: number[],
  var1Name = "X",
  var2Name = "Y",
  method: "pearson" | "spearman" = "pearson"
): CorrelationResult {
  const pairs: [number, number][] = [];
  const nRaw = Math.min(x.length, y.length);

  for (let i = 0; i < nRaw; i++) {
    if (!isNaN(x[i]) && !isNaN(y[i])) {
      pairs.push([x[i], y[i]]);
    }
  }

  const n = pairs.length;
  if (n < 3) {
    return {
      var1: var1Name,
      var2: var2Name,
      r: 0,
      t: 0,
      df: 0,
      pValue: 1,
      rSquared: 0,
      ciLower: 0,
      ciUpper: 0,
      n,
      method,
    };
  }

  let finalX: number[] = pairs.map((p) => p[0]);
  let finalY: number[] = pairs.map((p) => p[1]);

  if (method === "spearman") {
    finalX = rankArray(finalX);
    finalY = rankArray(finalY);
  }

  const meanX = finalX.reduce((a, b) => a + b, 0) / n;
  const meanY = finalY.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = finalX[i] - meanX;
    const dy = finalY[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  const r = den > 0 ? num / den : 0;
  const clampedR = Math.max(-0.9999, Math.min(0.9999, r));

  const df = n - 2;
  const t =
    1 - clampedR * clampedR > 0
      ? (clampedR * Math.sqrt(df)) / Math.sqrt(1 - clampedR * clampedR)
      : 0;

  const pValue = tDistributionTwoTailed(t, df);
  const rSquared = clampedR * clampedR;

  // 95% CI via Fisher's z-transformation
  const z = 0.5 * Math.log((1 + clampedR) / (1 - clampedR));
  const seZ = 1 / Math.sqrt(n - 3);
  const zLower = z - 1.96 * seZ;
  const zUpper = z + 1.96 * seZ;

  const ciLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
  const ciUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);

  return {
    var1: var1Name,
    var2: var2Name,
    r: Number(clampedR.toFixed(3)),
    t: Number(t.toFixed(3)),
    df,
    pValue: Number(pValue.toFixed(4)),
    rSquared: Number(rSquared.toFixed(3)),
    ciLower: Number(ciLower.toFixed(2)),
    ciUpper: Number(ciUpper.toFixed(2)),
    n,
    method,
  };
}

function rankArray(arr: number[]): number[] {
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) {
      j++;
    }
    const rank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = rank;
    }
    i = j;
  }
  return ranks;
}

// Linear Regression
export function calculateLinearRegression(
  x: number[],
  y: number[],
  xName = "Prediktor",
  yName = "Utfall"
): RegressionResult {
  const corr = calculateCorrelation(x, y, xName, yName, "pearson");
  const n = corr.n;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  const ssX = x.reduce((a, b) => a + Math.pow(b - meanX, 2), 0);
  const ssY = y.reduce((a, b) => a + Math.pow(b - meanY, 2), 0);

  const beta = corr.r;
  const b1 = ssX > 0 ? (corr.r * Math.sqrt(ssY / (n - 1))) / Math.sqrt(ssX / (n - 1)) : 0;
  const b0 = meanY - b1 * meanX;

  const rSq = corr.rSquared;
  const adjRSq = n > 2 ? 1 - ((1 - rSq) * (n - 1)) / (n - 2) : rSq;

  const ssResidual = (1 - rSq) * ssY;
  const seEstimate = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : 0;

  const seB1 = ssX > 0 ? seEstimate / Math.sqrt(ssX) : 0;
  const seB0 =
    ssX > 0 ? seEstimate * Math.sqrt(1 / n + (meanX * meanX) / ssX) : 0;

  const tB1 = seB1 > 0 ? b1 / seB1 : 0;
  const tB0 = seB0 > 0 ? b0 / seB0 : 0;

  const pB1 = tDistributionTwoTailed(tB1, n - 2);
  const pB0 = tDistributionTwoTailed(tB0, n - 2);

  const fVal = n > 2 && 1 - rSq > 0 ? (rSq * (n - 2)) / (1 - rSq) : 0;
  const pF = fDistributionPValue(fVal, 1, n - 2);

  return {
    dependentVar: yName,
    r: Number(corr.r.toFixed(3)),
    rSquared: Number(rSq.toFixed(3)),
    adjustedRSquared: Number(adjRSq.toFixed(3)),
    stdError: Number(seEstimate.toFixed(3)),
    f: Number(fVal.toFixed(3)),
    df1: 1,
    df2: n - 2,
    pValue: Number(pF.toFixed(4)),
    coefficients: [
      {
        variable: "(Konstant)",
        b: Number(b0.toFixed(3)),
        stdErrorB: Number(seB0.toFixed(3)),
        beta: 0,
        t: Number(tB0.toFixed(3)),
        pValue: Number(pB0.toFixed(4)),
      },
      {
        variable: xName,
        b: Number(b1.toFixed(3)),
        stdErrorB: Number(seB1.toFixed(3)),
        beta: Number(beta.toFixed(3)),
        t: Number(tB1.toFixed(3)),
        pValue: Number(pB1.toFixed(4)),
      },
    ],
  };
}

// Mann-Whitney U Test (Non-parametric alternative to independent t-test)
export function calculateMannWhitneyU(
  group1Values: number[],
  group2Values: number[],
  group1Name = "Gruppe 1",
  group2Name = "Gruppe 2"
): MannWhitneyResult {
  const g1 = group1Values.filter((v) => !isNaN(v));
  const g2 = group2Values.filter((v) => !isNaN(v));

  const n1 = g1.length;
  const n2 = g2.length;
  const totalN = n1 + n2;

  const all = [
    ...g1.map((v) => ({ v, g: 1 })),
    ...g2.map((v) => ({ v, g: 2 })),
  ];

  all.sort((a, b) => a.v - b.v);

  // Assign ranks
  const ranks = new Array(totalN);
  let i = 0;
  while (i < totalN) {
    let j = i;
    while (j < totalN && all[j].v === all[i].v) {
      j++;
    }
    const rank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[k] = rank;
    }
    i = j;
  }

  let r1 = 0;
  let r2 = 0;
  for (let k = 0; k < totalN; k++) {
    if (all[k].g === 1) r1 += ranks[k];
    else r2 += ranks[k];
  }

  const u1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - r1;
  const u2 = n1 * n2 + (n2 * (n2 + 1)) / 2 - r2;
  const u = Math.min(u1, u2);
  const w = r1;

  const meanU = (n1 * n2) / 2;
  const sigmaU = Math.sqrt((n1 * n2 * (totalN + 1)) / 12);
  const z = sigmaU > 0 ? (u - meanU) / sigmaU : 0;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));

  // Effect size r = z / sqrt(N)
  const effectR = Math.abs(z) / Math.sqrt(totalN);

  const med1 = calculateDescriptives(g1).median;
  const med2 = calculateDescriptives(g2).median;

  return {
    u: Number(u.toFixed(1)),
    w: Number(w.toFixed(1)),
    z: Number(z.toFixed(3)),
    pValue: Number(pValue.toFixed(4)),
    r: Number(effectR.toFixed(3)),
    group1: {
      name: group1Name,
      n: n1,
      meanRank: Number((r1 / n1).toFixed(2)),
      median: med1,
    },
    group2: {
      name: group2Name,
      n: n2,
      meanRank: Number((r2 / n2).toFixed(2)),
      median: med2,
    },
  };
}

// Cronbach's Alpha Calculator (Psychometrics)
export function calculateCronbachAlpha(
  itemsMatrix: number[][], // rows = respondents, cols = item scores
  itemNames: string[]
): CronbachResult {
  const k = itemNames.length;
  const n = itemsMatrix.length;

  if (k < 2 || n < 3) {
    return {
      alpha: 0,
      numberOfItems: k,
      sampleSize: n,
      itemStats: [],
    };
  }

  // Calculate variance for each item
  const itemVars: number[] = [];
  const itemMeans: number[] = [];
  const itemSds: number[] = [];

  for (let j = 0; j < k; j++) {
    const colValues = itemsMatrix.map((row) => row[j]).filter((v) => !isNaN(v));
    const desc = calculateDescriptives(colValues);
    itemMeans.push(desc.mean);
    itemSds.push(desc.sd);
    itemVars.push(desc.variance);
  }

  const sumItemVars = itemVars.reduce((a, b) => a + b, 0);

  // Total scores per respondent
  const totalScores: number[] = [];
  for (let i = 0; i < n; i++) {
    const rowSum = itemsMatrix[i].reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
    totalScores.push(rowSum);
  }

  const totalDesc = calculateDescriptives(totalScores);
  const varTotal = totalDesc.variance;

  const alpha =
    varTotal > 0 ? (k / (k - 1)) * (1 - sumItemVars / varTotal) : 0;

  // Item if deleted calculation
  const itemStats = itemNames.map((name, idx) => {
    // sub matrix excluding col idx
    const subMatrix = itemsMatrix.map((r) => r.filter((_, col) => col !== idx));
    const subNames = itemNames.filter((_, col) => col !== idx);
    const subResult =
      k > 2 ? calculateCronbachAlpha(subMatrix, subNames).alpha : 0;

    return {
      item: name,
      mean: itemMeans[idx],
      sd: itemSds[idx],
      alphaIfDeleted: Number(subResult.toFixed(3)),
    };
  });

  return {
    alpha: Number(alpha.toFixed(3)),
    numberOfItems: k,
    sampleSize: n,
    itemStats,
  };
}

// Chi-Square Test of Independence
export interface ChiSquareResult {
  chiSquare: number;
  df: number;
  pValue: number;
  cramersV: number;
  expectedFrequenciesCheck: {
    passed: boolean;
    cellsBelow5Count: number;
    cellsBelow5Percent: number;
    minimumExpected: number;
  };
  table: {
    rowCategories: string[];
    colCategories: string[];
    observed: number[][];
    expected: number[][];
  };
}

export function calculateChiSquare(
  rowValues: (string | number)[],
  colValues: (string | number)[]
): ChiSquareResult {
  const rowCats = Array.from(new Set(rowValues)).map(String).sort();
  const colCats = Array.from(new Set(colValues)).map(String).sort();

  const r = rowCats.length;
  const c = colCats.length;

  const observed: number[][] = Array.from({ length: r }, () =>
    new Array(c).fill(0)
  );

  const n = Math.min(rowValues.length, colValues.length);
  for (let i = 0; i < n; i++) {
    const rIdx = rowCats.indexOf(String(rowValues[i]));
    const cIdx = colCats.indexOf(String(colValues[i]));
    if (rIdx >= 0 && cIdx >= 0) {
      observed[rIdx][cIdx]++;
    }
  }

  const rowTotals = observed.map((row) => row.reduce((a, b) => a + b, 0));
  const colTotals = new Array(c).fill(0);
  for (let j = 0; j < c; j++) {
    for (let i = 0; i < r; i++) {
      colTotals[j] += observed[i][j];
    }
  }

  const totalN = rowTotals.reduce((a, b) => a + b, 0);
  const expected: number[][] = Array.from({ length: r }, () =>
    new Array(c).fill(0)
  );

  let chiSq = 0;
  let cellsBelow5 = 0;
  let minExpected = Infinity;

  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const exp = (rowTotals[i] * colTotals[j]) / (totalN || 1);
      expected[i][j] = Number(exp.toFixed(2));
      if (exp < 5) cellsBelow5++;
      if (exp < minExpected) minExpected = exp;

      if (exp > 0) {
        chiSq += Math.pow(observed[i][j] - exp, 2) / exp;
      }
    }
  }

  const df = (r - 1) * (c - 1);
  const pVal = chiSquarePValue(chiSq, df);

  const minDim = Math.min(r - 1, c - 1);
  const cramersV =
    totalN > 0 && minDim > 0 ? Math.sqrt(chiSq / (totalN * minDim)) : 0;

  const totalCells = r * c;
  const cellsBelow5Percent = totalCells > 0 ? (cellsBelow5 / totalCells) * 100 : 0;

  return {
    chiSquare: Number(chiSq.toFixed(3)),
    df,
    pValue: Number(pVal.toFixed(4)),
    cramersV: Number(cramersV.toFixed(3)),
    expectedFrequenciesCheck: {
      passed: cellsBelow5Percent <= 20 && minExpected >= 1,
      cellsBelow5Count: cellsBelow5,
      cellsBelow5Percent: Number(cellsBelow5Percent.toFixed(1)),
      minimumExpected: Number(minExpected.toFixed(2)),
    },
    table: {
      rowCategories: rowCats,
      colCategories: colCats,
      observed,
      expected,
    },
  };
}
