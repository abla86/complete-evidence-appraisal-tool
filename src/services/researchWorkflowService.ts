import type { AppraisalSession } from './universalAppraisalService';
import { createBlankAppraisalSession, decideAppraisalLaunch } from './universalAppraisalService';
import { EvidenceFoundation, type EvidenceModule } from './evidenceSystemFoundation';
import { ResearchEngineGateway, type ResearchEngineDocument } from './researchEngineGateway';
import { ResearchEvidenceBridge, type ResearchToAppraisalBundle } from './researchEvidenceBridge';
import { evidenceEventBus } from './evidenceEventBus';
import type { DocumentClassificationResult } from '../types';

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
  evidence: ReturnType<typeof getVerifiedResearchEvidence>;
  document: ResearchEngineDocument;
  classification?: DocumentClassificationResult;
}

export function createResearchWorkflow(
  document: ResearchEngineDocument,
  studyId = document.id,
): WorkflowState {
  const foundation = new EvidenceFoundation();
  const evidenceBundle = ResearchEvidenceBridge.buildBundle(document, undefined, studyId);

  foundation.state.set(`research:${studyId}`, evidenceBundle, 'system', 'Research document attached', 'research');

  void evidenceEventBus.emit('research.document.attached', { studyId, documentId: document.id });

  return {
    studyId,
    studyDesign: document.metadata.studyDesignDetected || '',
    screening: [],
    appraisalSessions: [],
    events: foundation.state.events(),
    research: {
      document,
      evidenceBundle,
      classificationVerified: false,
      selectedInstrumentId: document.metadata.recommendedInstrumentId || undefined,
      evidenceVerifiedCount: 0,
      evidenceCandidateCount: evidenceBundle.evidence.length,
      evidenceRejectedCount: 0,
    },
  };
}

export function createResearchWorkflowFromText(
  text: string,
  fileName = 'document.txt',
  studyId?: string,
): WorkflowState {
  if (!text?.trim()) throw new Error('Dokumenttekst kan ikke være tom.');

  const analysis = ResearchEngineGateway.analyzeText(text, fileName);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const document: ResearchEngineDocument = {
    id: createDocumentId(`${fileName}:${text.length}`),
    fileName,
    fileType: 'txt',
    mimeType: 'text/plain',
    extractedText: text,
    wordCount: words.length,
    estimatedPages: Math.max(1, Math.ceil(words.length / 500)),
    metadata: {
      title: fileName.replace(/\.[^/.]+$/, ''),
      authors: '',
      year: new Date().getFullYear(),
      journal: '',
      doi: '',
      abstract: '',
      studyDesignDetected: '',
      recommendedInstrumentId: '',
    },
    sections: [],
    scanned: false,
    ocrNeeded: false,
    candidateEvidence: analysis.candidateEvidence,
  };

  return createResearchWorkflow(document, studyId ?? document.id);
}

export function updateResearchClassification(
  state: WorkflowState,
  classification: DocumentClassificationResult,
): WorkflowState {
  if (!state.research) throw new Error('Research document must be attached before classification is updated.');

  const evidenceBundle = ResearchEvidenceBridge.buildBundle(state.research.document, classification, state.studyId);
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
      evidenceVerifiedCount: evidenceBundle.evidence.filter(item => item.verifiedByResearcher).length,
      evidenceRejectedCount: evidenceBundle.evidence.filter(item => item.source === 'MANUAL' && !item.verifiedByResearcher).length,
    },
  };
}

export function verifyResearchClassification(
  state: WorkflowState,
  reviewerId: string,
  approved: boolean,
): WorkflowState {
  if (!state.research) throw new Error('Research document must be attached before classification can be verified.');
  if (!state.research.evidenceBundle.classification) throw new Error('No classification is available for verification.');
  if (!reviewerId.trim()) throw new Error('Reviewer ID is required.');

  const current = state.research.evidenceBundle.classification;
  const now = new Date().toISOString();
  const updatedClassification: DocumentClassificationResult = {
    ...current,
    confidenceStatus: approved ? 'HUMAN_VERIFIED' : 'MANUAL_VERIFICATION_REQUIRED',
    statusBadgeText: approved ? 'Human verified' : 'Manual verification required',
    humanDecision: {
      ...current.humanDecision,
      status: approved ? 'APPROVED' : 'REJECTED',
      verifiedAt: now,
      verifiedBy: reviewerId,
      rationale: approved ? 'Classification approved by researcher.' : 'Classification rejected by researcher.',
    },
  };

  void evidenceEventBus.emit('research.classification.verified', { studyId: state.studyId, reviewerId, approved });
  return updateResearchClassification(state, updatedClassification);
}

export function verifyResearchEvidence(
  state: WorkflowState,
  evidenceId: string,
  verified: boolean,
  reviewerId = 'researcher',
): WorkflowState {
  if (!state.research) throw new Error('Research document is not attached.');

  const evidenceExists = state.research.evidenceBundle.evidence.some(item => item.id === evidenceId);
  if (!evidenceExists) throw new Error(`Evidence finnes ikke: ${evidenceId}`);

  const evidenceBundle = ResearchEvidenceBridge.verifyEvidence(state.research.evidenceBundle, evidenceId, verified);
  const updated: WorkflowState = {
    ...state,
    research: {
      ...state.research,
      evidenceBundle,
      evidenceVerifiedCount: evidenceBundle.evidence.filter(item => item.verifiedByResearcher).length,
      evidenceRejectedCount: evidenceBundle.evidence.filter(item => item.source === 'MANUAL' && !item.verifiedByResearcher).length,
    },
  };

  void evidenceEventBus.emit('research.evidence.verified', {
    studyId: state.studyId,
    evidenceId,
    reviewerId,
    approved: verified,
  });

  return updated;
}

export function verifyAllCandidateEvidence(state: WorkflowState, reviewerId: string): WorkflowState {
  if (!state.research) throw new Error('Research document is not attached.');
  let next = state;
  for (const item of state.research.evidenceBundle.evidence) {
    if (!item.verifiedByResearcher) next = verifyResearchEvidence(next, item.id, true, reviewerId);
  }
  return next;
}

export function selectResearchInstrument(state: WorkflowState, instrumentId: string): WorkflowState {
  if (!state.research) throw new Error('Research document must be attached.');
  const normalized = instrumentId.trim();
  if (!normalized) throw new Error('Instrument ID mangler.');
  return { ...state, research: { ...state.research, selectedInstrumentId: normalized } };
}

export function assertReadyForAppraisal(state: WorkflowState): void {
  if (!state.research) throw new Error('Ingen research-workflow er knyttet til studien.');
  if (!state.research.classificationVerified) throw new Error('Human verification av dokumentklassifisering er påkrevd.');
  if (!state.research.selectedInstrumentId) throw new Error('Appraisal-instrument er ikke valgt.');

  const decision = decideAppraisalLaunch(state.studyDesign, state.research.selectedInstrumentId);
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);
}

export function includeStudyAndCreateAppraisal(
  state: WorkflowState,
  input: { reviewerId: string; instrumentId: string },
  foundation = new EvidenceFoundation(),
): WorkflowState {
  if (!input.reviewerId.trim()) throw new Error('Reviewer ID is required.');
  if (!input.instrumentId.trim()) throw new Error('Instrument ID is required.');

  assertReadyForAppraisal(state);
  if (state.research?.selectedInstrumentId !== input.instrumentId) {
    throw new Error(`Selected instrument ${input.instrumentId} does not match research workflow instrument ${state.research?.selectedInstrumentId}.`);
  }

  const now = new Date().toISOString();
  const decision = decideAppraisalLaunch(state.studyDesign, input.instrumentId);
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);

  const existingScreen = state.screening.find(item => item.reviewerId === input.reviewerId);
  const screening: ScreeningRecord[] = existingScreen
    ? state.screening.map(item => item === existingScreen ? { ...item, decision: 'INCLUDED' as const, updatedAt: now } : item)
    : [...state.screening, { studyId: state.studyId, reviewerId: input.reviewerId, decision: 'INCLUDED', updatedAt: now }];

  const session = createBlankAppraisalSession(state.studyId, input.instrumentId, input.reviewerId);

  foundation.state.set(`screening:${state.studyId}`, screening, input.reviewerId, 'Studie inkludert etter screening og klargjort for appraisal', 'screening');
  foundation.state.set(`appraisal:${session.id}`, session, input.reviewerId, 'Opprettet appraisal-sesjon fra research workflow', 'appraisal');

  void evidenceEventBus.emit('appraisal.session.created', {
    studyId: state.studyId,
    sessionId: session.id,
    instrumentId: input.instrumentId,
    reviewerId: input.reviewerId,
  });

  return { ...state, screening, appraisalSessions: [...state.appraisalSessions, session], events: foundation.state.events() };
}

export function buildResearchAppraisalPayload(state: WorkflowState): ResearchAppraisalPayload {
  assertReadyForAppraisal(state);
  if (!state.research) throw new Error('Research workflow is missing.');

  return {
    studyId: state.studyId,
    instrumentId: state.research.selectedInstrumentId!,
    evidence: getVerifiedResearchEvidence(state),
    document: state.research.document,
    classification: state.research.evidenceBundle.classification,
  };
}

export function getVerifiedResearchEvidence(state: WorkflowState) {
  if (!state.research) return [] as ResearchToAppraisalBundle['evidence'];
  return state.research.evidenceBundle.evidence.filter(item => item.verifiedByResearcher);
}

export function getResearchEvidenceSummary(state: WorkflowState) {
  const evidence = state.research?.evidenceBundle.evidence ?? [];
  return {
    total: evidence.length,
    verified: evidence.filter(item => item.verifiedByResearcher).length,
    candidates: evidence.filter(item => item.source === 'AI_CANDIDATE').length,
    rejected: evidence.filter(item => item.source === 'MANUAL' && !item.verifiedByResearcher).length,
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

function createDocumentId(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `doc-${(hash >>> 0).toString(16)}`;
}
