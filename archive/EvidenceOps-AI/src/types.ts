export interface PicoDefinition {
  population: string;
  intervention: string;
  comparison: string;
  primaryOutcomes: string[];
  secondaryOutcomes: string[];
  studyDesigns: string[];
  justification: string;
}

export interface SearchStrategy {
  targetDatabases: string[];
  booleanQuery: string;
  meshTerms: string[];
  freeTextKeywords: string[];
  limitsAndFilters: string[];
  cochraneStrategy: string;
  syntaxRationale: string;
}

export interface AppraisalChecklistItem {
  criterionId: string;
  question: string;
  rating: 'JA' | 'NEI' | 'DELVIS' | 'UKLART' | 'IKKE_RELEVANT';
  evaluatorNote: string;
  isCriticalDomain: boolean;
}

export interface CriticalAppraisal {
  tool: 'AMSTAR_2' | 'CASP_RCT' | 'AGREE_II' | 'ROB_2';
  overallQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICALLY_LOW';
  confidenceRating: number; // 0 - 100%
  criticalDeficiencies: string[];
  nonCriticalDeficiencies: string[];
  checklist: AppraisalChecklistItem[];
  concludingSummary: string;
}

export interface RetrievedStudy {
  id: string;
  pmid: string;
  doi: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  studyType: 'Systematisk oversikt (Cochrane/AMSTAR)' | 'Randomisert kontrollert studie (RCT)' | 'Kvasieksperimentell studie' | 'Observasjonell kohort';
  abstract: string;
  isDuplicate?: boolean;
  screeningStatus: 'INCLUDED' | 'EXCLUDED' | 'PENDING';
  exclusionReason?: string;
  appraisal?: CriticalAppraisal;
  keyFindingSummary?: string;
  effectSizeEstimate?: string;
}

export type GradeCertainty = 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';

export interface GradeAssessment {
  outcome: string;
  importance: 'KRITISK' | 'VIKTIG' | 'MINDRE_VIKTIG';
  studyCount: number;
  participants: number;
  riskOfBias: 'Ingen alvorlig' | 'Alvorlig (-1)' | 'Svært alvorlig (-2)';
  inconsistency: 'Ingen alvorlig' | 'Alvorlig (-1)' | 'Svært alvorlig (-2)';
  indirectness: 'Ingen alvorlig' | 'Alvorlig (-1)' | 'Svært alvorlig (-2)';
  imprecision: 'Ingen alvorlig' | 'Alvorlig (-1)' | 'Svært alvorlig (-2)';
  publicationBias: 'Usannsynlig' | 'Sannsynlig (-1)';
  certainty: GradeCertainty;
  relativeEffect: string;
  absoluteEffect: string;
  clinicalInterpretation: string;
}

export interface HumanApprovalState {
  isPendingApproval: boolean;
  isApproved: boolean;
  isRejected: boolean;
  reviewedAt?: string;
  reviewerName: string;
  reviewerRole: string;
  clinicalNotes: string;
  adjustmentsMade: {
    adjustedGradeCertainty?: Record<string, GradeCertainty>;
    studyInclusionOverrides?: Record<string, boolean>;
    recommendationModified?: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentName: 'Orchestrator' | 'PICO Agent' | 'Search Strategy Agent' | 'Retrieval & Deduplication Agent' | 'Appraisal Agent' | 'GRADE Evidence Agent' | 'Human Reviewer' | 'Audit & Export Engine';
  action: string;
  stepNumber: number;
  status: 'SUCCESS' | 'AWAITING_APPROVAL' | 'APPROVED' | 'WARNING';
  executionTimeMs: number;
  hash: string;
  details: string;
  payloadSummary?: string;
}

export interface PrismaFlowchartData {
  recordsIdentified: number;
  duplicatesRemoved: number;
  recordsScreened: number;
  recordsExcludedScreening: number;
  fullTextAssessed: number;
  fullTextExcluded: number;
  studiesIncluded: number;
}

export interface ClinicalRecommendation {
  direction: 'FOR' | 'MOT' | 'BETINGET';
  strength: 'STERK' | 'SVAK';
  statement: string;
  targetPopulation: string;
  implementationConsiderations: string[];
  monitoringAndFollowUp: string;
  valuesAndPreferences: string;
}

export interface EvidencePipelineSession {
  sessionId: string;
  userPrompt: string;
  currentStep: number; // 0 to 7
  totalSteps: number;
  status: 'IDLE' | 'PROCESSING' | 'WAITING_FOR_HUMAN_APPROVAL' | 'APPROVED_AND_FINALIZED' | 'REJECTED';
  activeAgent: string;
  pico?: PicoDefinition;
  searchStrategy?: SearchStrategy;
  prisma?: PrismaFlowchartData;
  studies: RetrievedStudy[];
  gradeAssessments: GradeAssessment[];
  clinicalRecommendation?: ClinicalRecommendation;
  humanApproval: HumanApprovalState;
  auditTrail: AuditLogEntry[];
  finalReportMarkdown?: string;
}
