import type { AppraisalInstrument, DocumentClassificationResult } from '../types';
import type { ResearchEngineDocument } from '../services/researchEngineGateway';
import type { ResearchToAppraisalBundle } from '../services/researchEvidenceBridge';
import type { EvidenceFoundation, EvidenceModule } from '../services/evidenceSystemFoundation';

export type AppraisalAnswer = string | number | boolean | null;

export interface AppraisalEvidenceLink {
  quote?: string;
  page?: string;
  section?: string;
  table?: string;
  figure?: string;
  url?: string;
  sourceId?: string;
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

export interface ResearchWorkflowContext {
  document: ResearchEngineDocument;
  evidenceBundle: ResearchToAppraisalBundle;
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
  events: ReturnType<EvidenceFoundation['state']['events']>;
  research?: ResearchWorkflowContext;
}

export interface ResearchAppraisalPayload {
  studyId: string;
  instrumentId: string;
  evidence: ReturnType<(state: WorkflowState) => AppraisalEvidenceLink[]>;
  document: ResearchEngineDocument;
  classification?: DocumentClassificationResult;
}

export type ResearchWorkflowHandoff = {
  foundation: EvidenceFoundation;
  fromModule: EvidenceModule;
  toModule: EvidenceModule;
  fromRole: string;
  toRole: string;
  studyId: string;
  reason: string;
};
