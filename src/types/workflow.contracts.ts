import type { AppraisalInstrument, DocumentClassificationResult, EvidenceLocation } from '../types';

export type AppraisalAnswer = string | number | boolean | null;

export interface AppraisalEvidenceLink {
  /** Canonical ResearchEvidenceRecord id. Evidence text is never duplicated here. */
  sourceId?: string;
  quote?: string;
  page?: string;
  section?: string;
  table?: string;
  figure?: string;
  url?: string;
}

export interface AppraisalItemResponse {
  itemId: number | string;
  answer: AppraisalAnswer;
  rationale: string;
  evidence?: AppraisalEvidenceLink;
}

export interface AppraisalSession {
  id: string;
  studyId: string;
  instrumentId: string;
  instrumentVersion: string;
  reviewerId: string;
  responses: AppraisalItemResponse[];
  overallJudgement?: string;
  overallRationale?: string;
  createdAt: string;
  updatedAt: string;
  locked: boolean;
  status?: string;
}

export interface AppraisalSessionValidation {
  valid: boolean;
  missingItemIds: string[];
  missingRationales: string[];
  issues: string[];
}

export interface AppraisalLaunchDecision {
  instrument: AppraisalInstrument | null;
  allowed: boolean;
  warnings: string[];
  reason: string;
}

export type ScreeningDecision = 'PENDING' | 'INCLUDED' | 'EXCLUDED';

export interface ScreeningRecord {
  studyId: string;
  reviewerId: string;
  decision: ScreeningDecision;
  reason?: string;
  updatedAt: string;
}

export interface ResearchDocumentContract {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  extractedText: string;
  wordCount: number;
  estimatedPages: number;
  metadata: {
    title?: string;
    authors?: string;
    year?: number;
    journal?: string;
    doi?: string;
    abstract?: string;
    studyDesignDetected?: string;
    recommendedInstrumentId?: string;
    [key: string]: unknown;
  };
  sections: unknown[];
  scanned: boolean;
  ocrNeeded: boolean;
  candidateEvidence: unknown[];
}

export type ResearchEvidenceVerification = 'AI_CANDIDATE' | 'HUMAN_VERIFIED' | 'REJECTED' | 'MANUAL';

export interface ResearchEvidenceRecord {
  id: string;
  studyId: string;
  documentId: string;
  location: EvidenceLocation;
  quote: string;
  source: ResearchEvidenceVerification;
  verifiedByResearcher: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  questionId?: number;
  suggestedStatus?: string;
  relevanceScore: number;
  confidenceReason: string;
}

export interface ResearchToAppraisalBundleContract {
  contractVersion: string;
  document: ResearchDocumentContract;
  classification?: DocumentClassificationResult;
  evidence: ResearchEvidenceRecord[];
  readyForAppraisal: boolean;
  gating: {
    classificationRequired: true;
    humanVerificationRequired: true;
    instrumentRecommendation: string;
  };
}

export interface ResearchWorkflowContext {
  document: ResearchDocumentContract;
  evidenceBundle: ResearchToAppraisalBundleContract;
  analysis?: unknown;
  classificationVerified: boolean;
  selectedInstrumentId?: string;
  evidenceVerifiedCount: number;
  evidenceCandidateCount: number;
  evidenceRejectedCount: number;
}

export interface WorkflowState {
  studyId: string;
  studyDesign: string;
  screening: ScreeningRecord[];
  appraisalSessions: AppraisalSession[];
  events: unknown[];
  research?: ResearchWorkflowContext;
}

export interface ResearchAppraisalPayload {
  studyId: string;
  instrumentId: string;
  evidence: ResearchEvidenceRecord[];
  document: ResearchDocumentContract;
  classification?: DocumentClassificationResult;
}
