export type MeasurementLevel = "nominal" | "ordinal" | "scale";

export interface VariableMeta {
  id: string;
  name: string;
  label: string;
  type: "numeric" | "string";
  level: MeasurementLevel;
  values?: Record<string | number, string>; // e.g. { 1: "Kontroll", 2: "Intervensjon" }
  missingCount: number;
}

export interface DataRow {
  id: string | number;
  [key: string]: any;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  variables: VariableMeta[];
  rows: DataRow[];
}

export type AnalysisCategory =
  | "descriptive"
  | "comparison"
  | "nonparametric"
  | "correlation"
  | "regression"
  | "psychometrics"
  | "advanced";

export interface StatisticalTestInfo {
  id: string;
  name: string;
  category: AnalysisCategory;
  spssMenuPath: string;
  whenToUse: string;
  exampleQuestion: string;
  independentVar: string;
  dependentVar: string;
  h0: string;
  h1: string;
  assumptions: string[];
  nonParametricAlternative?: string;
  effectSizeMetric: string;
  apaExample: string;
  apaTemplate: string;
}

export interface DescriptiveStats {
  variable: string;
  n: number;
  missing: number;
  mean: number;
  median: number;
  sd: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  skewness: number;
  kurtosis: number;
}

export interface TTestResult {
  testName: string;
  t: number;
  df: number;
  pValue: number;
  meanDiff: number;
  ciLower: number;
  ciUpper: number;
  cohensD: number;
  group1Stats: { name: string; n: number; mean: number; sd: number };
  group2Stats: { name: string; n: number; mean: number; sd: number };
  leveneF?: number;
  leveneP?: number;
}

export interface AnovaResult {
  testName: string;
  f: number;
  dfBetween: number;
  dfWithin: number;
  pValue: number;
  etaSquared: number;
  groups: { name: string; n: number; mean: number; sd: number }[];
  ssBetween: number;
  ssWithin: number;
  msBetween: number;
  msWithin: number;
}

export interface CorrelationResult {
  var1: string;
  var2: string;
  r: number;
  t: number;
  df: number;
  pValue: number;
  rSquared: number;
  ciLower: number;
  ciUpper: number;
  n: number;
  method: "pearson" | "spearman";
}

export interface RegressionResult {
  dependentVar: string;
  r: number;
  rSquared: number;
  adjustedRSquared: number;
  stdError: number;
  f: number;
  df1: number;
  df2: number;
  pValue: number;
  coefficients: {
    variable: string;
    b: number;
    stdErrorB: number;
    beta: number;
    t: number;
    pValue: number;
  }[];
}

export interface MannWhitneyResult {
  u: number;
  w: number;
  z: number;
  pValue: number;
  r: number;
  group1: { name: string; n: number; meanRank: number; median: number };
  group2: { name: string; n: number; meanRank: number; median: number };
}

export interface CronbachResult {
  alpha: number;
  numberOfItems: number;
  sampleSize: number;
  itemStats: { item: string; mean: number; sd: number; alphaIfDeleted: number }[];
}

export interface OutputInterpretation {
  summary: string;
  extractedStatistics?: {
    testName?: string;
    testStatistic?: string;
    degreesOfFreedom?: string;
    pValue?: string;
    effectSize?: string;
    confidenceInterval?: string;
  };
  isSignificant: boolean;
  plainNorwegian: string;
  whatItMeans: string;
  whatItDoesNotMean: string;
  effectSizeAssessment?: string;
  apaCitationProposal: string;
  clinicalChecklist?: string[];
}
