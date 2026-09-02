import type { DocumentClassificationResult, EvidenceLocation } from '../types';
import { ResearchEvidenceBridge, type ResearchToAppraisalBundle } from './researchEvidenceBridge';
import type { ResearchEngineDocument } from './researchEngineGateway';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface WorkflowEvidence {
  id: string;
  documentId: string;
  location: EvidenceLocation;
  quote: string;
  questionId?: number;
  suggestedStatus?: string;
  relevanceScore: number;
  confidenceReason: string;
  verification: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ResearchWorkflow {
  id: string;
  studyId: string;
  createdAt: string;
  updatedAt: string;
  document: ResearchEngineDocument;
  classification?: DocumentClassificationResult;
  classificationVerification: VerificationStatus;
  selectedInstrumentId?: string;
  evidence: WorkflowEvidence[];
}

export function createResearchWorkflow(
  document: ResearchEngineDocument,
  studyId = document.id,
): ResearchWorkflow {
  const bundle = ResearchEvidenceBridge.buildBundle(document, undefined, studyId);
  const now = new Date().toISOString();

  return {
    id: `research-workflow-${studyId}`,
    studyId,
    createdAt: now,
    updatedAt: now,
    document,
    classificationVerification: 'PENDING',
    selectedInstrumentId: document.metadata.recommendedInstrumentId || undefined,
    evidence: bundle.evidence.map((item) => ({
      id: item.id,
      documentId: item.documentId,
      location: {
        page: item.location.page === undefined ? undefined : String(item.location.page),
        section: item.location.section,
        table: item.location.table,
        figure: item.location.figure,
      },
      quote: item.quote,
      relevanceScore: 0,
      confidenceReason: 'Imported as candidate evidence; researcher verification required.',
      verification: 'PENDING',
    })),
  };
}

export function applyClassification(
  workflow: ResearchWorkflow,
  classification: DocumentClassificationResult,
): ResearchWorkflow {
  const now = new Date().toISOString();
  const verified = classification.confidenceStatus === 'HUMAN_VERIFIED'
    ? 'VERIFIED'
    : 'PENDING';

  return {
    ...workflow,
    updatedAt: now,
    classification,
    classificationVerification: verified,
    selectedInstrumentId: classification.recommendedInstrumentId || undefined,
  };
}

export function verifyClassification(
  workflow: ResearchWorkflow,
  reviewerId: string,
  approved: boolean,
): ResearchWorkflow {
  const now = new Date().toISOString();
  const classification = workflow.classification;

  if (!classification) {
    throw new Error('Dokumentet må klassifiseres før klassifisering kan verifiseres.');
  }

  return {
    ...workflow,
    updatedAt: now,
    classificationVerification: approved ? 'VERIFIED' : 'REJECTED',
    classification: {
      ...classification,
      humanDecision: {
        ...(classification.humanDecision ?? {}),
        status: approved ? 'APPROVED' : 'REJECTED',
        verifiedAt: now,
        verifiedBy: reviewerId,
        rationale: approved
          ? 'Klassifisering godkjent av forsker.'
          : 'Klassifisering avvist av forsker; ny vurdering kreves.',
      },
    },
  };
}

export function verifyEvidence(
  workflow: ResearchWorkflow,
  evidenceId: string,
  reviewerId: string,
  approved: boolean,
): ResearchWorkflow {
  const now = new Date().toISOString();
  const evidence = workflow.evidence.map((item) => {
    if (item.id !== evidenceId) return item;
    return {
      ...item,
      verification: approved ? 'VERIFIED' : 'REJECTED',
      verifiedBy: reviewerId,
      verifiedAt: now,
    };
  });

  if (evidence.every((item) => item.id !== evidenceId)) {
    throw new Error(`Evidence finnes ikke: ${evidenceId}`);
  }

  return {
    ...workflow,
    updatedAt: now,
    evidence,
  };
}

export function assertAppraisalReady(workflow: ResearchWorkflow): void {
  if (!workflow.classification) {
    throw new Error('Mangler dokumentklassifisering.');
  }

  if (workflow.classificationVerification !== 'VERIFIED') {
    throw new Error('Dokumentklassifisering må verifiseres av forsker før appraisal.');
  }

  if (!workflow.selectedInstrumentId) {
    throw new Error('Mangler valgt appraisal-instrument.');
  }

  if (workflow.evidence.some((item) => item.verification === 'PENDING')) {
    throw new Error('All kandidat-evidence som skal brukes i appraisal må verifiseres eller avvises.');
  }
}

export function buildVerifiedEvidencePayload(workflow: ResearchWorkflow) {
  assertAppraisalReady(workflow);

  return workflow.evidence
    .filter((item) => item.verification === 'VERIFIED')
    .map((item) => ({
      id: item.id,
      documentId: item.documentId,
      questionId: item.questionId,
      quote: item.quote,
      location: item.location,
      suggestedStatus: item.suggestedStatus,
      relevanceScore: item.relevanceScore,
      confidenceReason: item.confidenceReason,
      verifiedBy: item.verifiedBy,
      verifiedAt: item.verifiedAt,
    }));
}

export function toResearchBundle(workflow: ResearchWorkflow): ResearchToAppraisalBundle {
  return ResearchEvidenceBridge.buildBundle(
    workflow.document,
    workflow.classification,
    workflow.studyId,
  );
}
