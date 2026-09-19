export type StageId = 
  | 'question'
  | 'pico'
  | 'search'
  | 'screening'
  | 'appraisal'
  | 'rob'
  | 'extraction'
  | 'synthesis'
  | 'grade'
  | 'report';

export interface StageDefinition {
  id: StageId;
  stepNumber: number;
  labelNo: string;
  labelEn: string;
  shortDesc: string;
  icon: string;
}

export type QuestionType = 'intervention' | 'prognosis' | 'diagnosis' | 'etiology' | 'qualitative';

export interface FinerCriteria {
  feasible: { score: 'Good' | 'Moderate' | 'Needs attention'; note: string };
  interesting: { score: 'Good' | 'Moderate' | 'Needs attention'; note: string };
  novel: { score: 'Good' | 'Moderate' | 'Needs attention'; note: string };
  ethical: { score: 'Good' | 'Moderate' | 'Needs attention'; note: string };
  relevant: { score: 'Good' | 'Moderate' | 'Needs attention'; note: string };
}

export interface ResearchQuestionData {
  title: string;
  primaryQuestion: string;
  secondaryQuestions: string[];
  contextRationale: string;
  questionType: QuestionType;
  finer: FinerCriteria;
  protocolRegistration: string;
  lastModified: string;
}

export interface PicoData {
  frameworkType: 'PICO' | 'PECO';
  population: string;
  intervention: string;
  comparison: string;
  primaryOutcome: string;
  secondaryOutcomes: string[];
  studyDesigns: string[];
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  meshTerms: {
    domain: 'P' | 'I' | 'C' | 'O';
    name: string;
    textWords: string[];
    meshDescriptors: string[];
  }[];
}

export interface DatabaseSearch {
  id: string;
  database: 'PubMed / MEDLINE' | 'Cochrane Library (CENTRAL)' | 'Embase' | 'CINAHL' | 'Web of Science' | string;
  query: string;
  hits: number;
  dateExecuted: string;
  fieldsUsed: string[];
  notes?: string;
}

export interface SearchData {
  databases: DatabaseSearch[];
  totalRecordsIdentified: number;
  duplicatesRemoved: number;
  recordsAfterDeduplication: number;
  searchFilterTags: string[];
  auditNotes: string;
}

export type ScreeningStatus = 
  | 'unscreened' 
  | 'screened_included' 
  | 'screened_excluded' 
  | 'fulltext_eligible' 
  | 'fulltext_excluded';

export type ExclusionReason = 
  | 'Wrong population' 
  | 'Wrong intervention / exposure' 
  | 'Wrong comparator' 
  | 'Wrong outcome' 
  | 'Ineligible study design' 
  | 'Duplicate publication' 
  | 'Unobtainable full-text'
  | 'Other';

export interface StudyRecord {
  id: string;
  citationKey: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  pmid?: string;
  abstract: string;
  methodsSummary?: string;
  status: ScreeningStatus;
  titleAbstractDecision?: 'include' | 'exclude';
  fullTextDecision?: 'include' | 'exclude';
  exclusionReason?: ExclusionReason;
  exclusionNotes?: string;
  aiScreening?: {
    recommendation: 'INCLUDE' | 'EXCLUDE' | 'UNCLEAR';
    confidence: number;
    reason: string;
    keyQuote?: string;
  };
  humanVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  dualReviewerAgreement?: {
    reviewer1Decision: 'include' | 'exclude';
    reviewer2Decision: 'include' | 'exclude';
    consensusDecision: 'include' | 'exclude';
    cohenKappa?: number;
    notes?: string;
  };
}

export interface CaspItem {
  id: string;
  question: string;
  response: 'Yes' | 'No' | 'Can’t tell';
  comments: string;
}

export interface CriticalAppraisalData {
  toolType: 'CASP_RCT' | 'NEWCASTLE_OTTAWA';
  studiesAppraised: Record<string, {
    items: CaspItem[];
    overallRating: 'High Quality' | 'Moderate Quality' | 'Low Quality';
    strengths: string;
    limitations: string;
    aiEvaluation?: AppraisalAiEvaluation;
  }>;
}

export interface AppraisalAiEvaluation {
  strengths: string[];
  methodologicalFlaws: string[];
  potentialBiases: {
    selectionBias?: { rating: string; details: string };
    performanceBias?: { rating: string; details: string };
    detectionBias?: { rating: string; details: string };
    attritionBias?: { rating: string; details: string };
    reportingBias?: { rating: string; details: string };
  };
  validityRatings: {
    internalValidity: 'High' | 'Moderate' | 'Low';
    externalValidity: 'High' | 'Moderate' | 'Low';
    precision: 'High' | 'Moderate' | 'Low';
  };
  overallScore: number;
  qualityCategory: 'High Quality' | 'Moderate Quality' | 'Low Quality';
  appraisalSummary: string;
}

export interface SuggestedAcademicPaper {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  pmid?: string;
  studyType?: string;
  sampleSize?: number;
  relevanceScore?: number;
  keyFindings?: string;
  abstract?: string;
  databaseOrigin?: string;
}

export interface RecommendedDatabase {
  name: string;
  coverage: string;
  recommendedSyntax: string;
  priority: 'High' | 'Essential' | 'Supplementary';
}

export interface ExtractionTemplateField {
  id: string;
  label: string;
  description: string;
  type: 'number' | 'text' | 'percentage';
  category: 'demographics' | 'intervention' | 'outcomes' | 'safety' | 'custom';
}

export interface GdprSecurityRecord {
  piiDetected: boolean;
  anonymizationStatus: string;
  gdprArticle9Compliant: boolean;
  dataMinimizationScore: string;
  securityNotes: string;
  auditSignature: string;
  timestamp: string;
}

export type RobJudgment = 'Low risk' | 'Some concerns' | 'High risk';

export interface Rob2StudyAssessment {
  studyId: string;
  d1_randomization: RobJudgment;
  d1_notes: string;
  d2_deviations: RobJudgment;
  d2_notes: string;
  d3_missing_data: RobJudgment;
  d3_notes: string;
  d4_measurement: RobJudgment;
  d4_notes: string;
  d5_reporting: RobJudgment;
  d5_notes: string;
  overall: RobJudgment;
  summaryComment: string;
}

export interface StudyExtraction {
  studyId: string;
  country: string;
  studyDesign: string;
  sampleSizeTotal: number;
  sampleSizeIntervention: number;
  sampleSizeControl: number;
  meanAge: number;
  femalePct: number;
  followUpMonths: number;
  interventionDetails: string;
  controlDetails: string;
  customFields?: Record<string, string | number>;
  sourceQuotes?: Record<string, string>;
  confidenceMap?: Record<string, string>;
  gdprCompliance?: GdprSecurityRecord;
  outcomes: {
    outcomeId: string;
    name: string;
    type: 'dichotomous' | 'continuous';
    eventsIntervention?: number;
    totalIntervention?: number;
    eventsControl?: number;
    totalControl?: number;
    meanIntervention?: number;
    sdIntervention?: number;
    meanControl?: number;
    sdControl?: number;
    notes?: string;
  }[];
}

export interface MetaStudyResult {
  studyId: string;
  studyName: string;
  year: number;
  effectSize: number; // ln(RR) or MD
  ciLower: number;
  ciUpper: number;
  displayEffect: number; // RR or MD
  displayCiLower: number;
  displayCiUpper: number;
  weightPct: number;
  rob: RobJudgment;
}

export interface MetaAnalysisResult {
  outcomeName: string;
  effectMeasure: 'RR' | 'OR' | 'MD';
  model: 'fixed' | 'random';
  studies: MetaStudyResult[];
  pooledEffect: number;
  pooledCiLower: number;
  pooledCiUpper: number;
  zValue: number;
  pValue: number;
  cochranQ: number;
  df: number;
  qPValue: number;
  iSquared: number; // %
  tauSquared: number;
}

export type GradeLevel = 'High' | 'Moderate' | 'Low' | 'Very Low';
export type DowngradeChoice = 'Not serious' | 'Serious (-1)' | 'Very serious (-2)';
export type PublicationBiasChoice = 'Undetected' | 'Suspected (-1)' | 'Strongly suspected (-2)';

export interface GradeRow {
  id: string;
  outcomeName: string;
  importance: 'Critical' | 'Important' | 'Not critical';
  studyCount: number;
  participantsCount: number;
  studyDesign: string;
  riskOfBias: DowngradeChoice;
  riskOfBiasJustification: string;
  inconsistency: DowngradeChoice;
  inconsistencyJustification: string;
  indirectness: DowngradeChoice;
  indirectnessJustification: string;
  imprecision: DowngradeChoice;
  imprecisionJustification: string;
  publicationBias: PublicationBiasChoice;
  publicationBiasJustification: string;
  relativeEffect: string; // e.g. "RR 0.79 (0.69 to 0.90)"
  anticipatedRiskControl: number; // e.g. 150 per 1,000
  anticipatedRiskIntervention: number; // e.g. 119 per 1,000
  absoluteEffectSummary: string; // e.g. "31 fewer per 1,000 (from 15 to 46 fewer)"
  certainty: GradeLevel;
  plainLanguageSummary: string;
}

export interface SynthesisData {
  metaAnalyses: MetaAnalysisResult[];
  narrativeSynthesis: string;
}

export interface ReportData {
  abstract: string;
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  conclusion: string;
}

export type GradeRating = 'none' | 'serious' | 'very_serious' | 'suspected' | 'strongly_suspected';
export type GradeCertainty = 'High' | 'Moderate' | 'Low' | 'Very Low';

export interface GradeAssessment {
  outcomeName: string;
  studyCount: number;
  participantsCount: number;
  studyDesign: string;
  riskOfBias: GradeRating;
  riskOfBiasExplanation: string;
  inconsistency: GradeRating;
  inconsistencyExplanation: string;
  indirectness: GradeRating;
  indirectnessExplanation: string;
  indirectnessJustification?: string;
  imprecision: GradeRating;
  imprecisionExplanation: string;
  publicationBias: GradeRating;
  publicationBiasExplanation: string;
  relativeEffect: string;
  absoluteRiskControl: number;
  absoluteRiskIntervention: number;
  riskDifferencePer1000: number;
  overallCertainty: GradeCertainty;
  plainLanguageSummary: string;
}

export interface ProjectAuditEntry {
  id: string;
  timestamp: string;
  stage: StageId;
  action: string;
  actor: string;
  details?: string;
}

export interface EvidenceOSProject {
  id: string;
  name: string;
  createdAt: string;
  lastUpdated: string;
  question: ResearchQuestionData;
  pico: PicoData;
  search: SearchData;
  studies: StudyRecord[];
  appraisal: CriticalAppraisalData;
  robAssessments: Record<string, Rob2StudyAssessment>;
  rob?: Record<string, Rob2StudyAssessment>;
  extractions: Record<string, StudyExtraction>;
  synthesis: SynthesisData;
  grade: GradeAssessment;
  gradeRows: GradeRow[];
  report: ReportData;
  metadata: {
    authors: string[];
    institution: string;
  };
  auditLog: ProjectAuditEntry[];
}
