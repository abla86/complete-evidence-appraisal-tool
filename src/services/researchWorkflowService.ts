import type { AppraisalSession } from './universalAppraisalService';
import { createBlankAppraisalSession, decideAppraisalLaunch } from './universalAppraisalService';
import { EvidenceFoundation, type EvidenceModule } from './evidenceSystemFoundation';
import { ResearchEngineGateway, type ResearchEngineDocument } from './researchEngineGateway';
import { ResearchEvidenceBridge, type ResearchToAppraisalBundle } from './researchEvidenceBridge';

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
  classificationVerified: boolean;
  selectedInstrumentId?: string;
  evidenceVerifiedCount: number;
  evidenceCandidateCount: number;
}

export interface WorkflowState {
  studyId: string;
  studyDesign: string;
  screening: ScreeningRecord[];
  appraisalSessions: AppraisalSession[];
  events: ReturnType<EvidenceFoundation['state']['events']>;
  research?: ResearchWorkflowContext;
}

export function attachResearchDocument(
  state: WorkflowState,
  input: { text: string; fileName?: string; studyId?: string },
): WorkflowState {
  const fileName = input.fileName ?? 'document.txt';
  const analysis = ResearchEngineGateway.analyzeText(input.text, fileName);
  const document: ResearchEngineDocument = {
    id: `doc-${Date.now()}`,
    fileName,
    fileType: 'txt',
    mimeType: 'text/plain',
    extractedText: input.text,
    wordCount: input.text.trim() ? input.text.trim().split(/\s+/).length : 0,
    estimatedPages: Math.max(1, Math.ceil(input.text.trim().split(/\s+/).filter(Boolean).length / 500)),
    metadata: {
      title: fileName.replace(/\.[^/.]+$/, ''),
      authors: '',
      year: new Date().getFullYear(),
      journal: '',
      doi: '',
      abstract: '',
      studyDesignDetected: state.studyDesign,
      recommendedInstrumentId: '',
    },
    sections: [],
    scanned: false,
    ocrNeeded: false,
    candidateEvidence: analysis.candidateEvidence,
  };

  const evidenceBundle = ResearchEvidenceBridge.buildBundle(document, undefined, input.studyId ?? state.studyId);
  return {
    ...state,
    research: {
      document,
      evidenceBundle,
      classificationVerified: false,
      evidenceVerifiedCount: 0,
      evidenceCandidateCount: evidenceBundle.evidence.length,
    },
  };
}

export function updateResearchClassification(
  state: WorkflowState,
  classification: NonNullable<ResearchWorkflowContext['evidenceBundle']['classification']>,
): WorkflowState {
  if (!state.research) {
    throw new Error('Research document must be attached before classification is updated.');
  }

  const evidenceBundle = ResearchEvidenceBridge.buildBundle(
    state.research.document,
    classification,
    state.studyId,
  );
  const verified = classification.confidenceStatus === 'HUMAN_VERIFIED'
    || classification.confidenceStatus === 'DEFINITIVE'
    || classification.humanDecision?.status === 'APPROVED';

  return {
    ...state,
    studyDesign: classification.studyDesign,
    research: {
      ...state.research,
      evidenceBundle,
      classificationVerified: verified,
      selectedInstrumentId: classification.recommendedInstrumentId,
      evidenceCandidateCount: evidenceBundle.evidence.length,
    },
  };
}

export function verifyResearchEvidence(
  state: WorkflowState,
  evidenceId: string,
  verified: boolean,
): WorkflowState {
  if (!state.research) throw new Error('Research document is not attached.');
  const evidenceBundle = ResearchEvidenceBridge.verifyEvidence(
    state.research.evidenceBundle,
    evidenceId,
    verified,
  );
  return {
    ...state,
    research: {
      ...state.research,
      evidenceBundle,
      evidenceVerifiedCount: evidenceBundle.evidence.filter(item => item.verifiedByResearcher).length,
    },
  };
}

export function includeStudyAndCreateAppraisal(
  state: WorkflowState,
  input: { reviewerId: string; instrumentId: string },
  foundation = new EvidenceFoundation(),
): WorkflowState {
  const now = new Date().toISOString();
  const decision = decideAppraisalLaunch(state.studyDesign, input.instrumentId);
  if (!decision.allowed || !decision.instrument) {
    throw new Error(decision.reason);
  }

  if (state.research) {
    if (!state.research.classificationVerified) {
      throw new Error('Human verification of the research classification is required before appraisal.');
    }
    if (!state.research.selectedInstrumentId) {
      throw new Error('No appraisal instrument has been selected from the research workflow.');
    }
    if (state.research.selectedInstrumentId !== input.instrumentId) {
      throw new Error(`Selected instrument ${input.instrumentId} does not match the research workflow instrument ${state.research.selectedInstrumentId}.`);
    }
  }

  const existingScreen = state.screening.find(item => item.reviewerId === input.reviewerId);
  const screening: ScreeningRecord[] = existingScreen
    ? state.screening.map(item => item === existingScreen ? { ...item, decision: 'INCLUDED', updatedAt: now } : item)
    : [...state.screening, { studyId: state.studyId, reviewerId: input.reviewerId, decision: 'INCLUDED', updatedAt: now }];

  const session = createBlankAppraisalSession(state.studyId, input.instrumentId, input.reviewerId);
  foundation.state.set(
    `screening:${state.studyId}`,
    screening,
    input.reviewerId,
    'Studie inkludert etter screening og klargjort for appraisal',
    'screening',
  );
  foundation.state.set(
    `appraisal:${session.id}`,
    session,
    input.reviewerId,
    'Opprettet appraisal-sesjon fra inkludert studie',
    'appraisal',
  );

  return {
    ...state,
    screening,
    appraisalSessions: [...state.appraisalSessions, session],
    events: foundation.state.events(),
  };
}

export async function handoffWorkflow(
  foundation: EvidenceFoundation,
  fromModule: EvidenceModule,
  toModule: EvidenceModule,
  fromRole: string,
  toRole: string,
  studyId: string,
  reason: string,
): Promise<void> {
  await foundation.handoff({
    fromModule,
    toModule,
    fromRole,
    toRole,
    context: { studyId },
    reason,
    correlationId: foundation.state.snapshot().correlationId,
  });
}
