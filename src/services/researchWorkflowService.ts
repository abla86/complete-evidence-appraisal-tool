import type { AppraisalSession } from './universalAppraisalService';
import { decideAppraisalLaunch } from './universalAppraisalService';
import { EvidenceFoundation, type EvidenceModule } from './evidenceSystemFoundation';
import { ResearchEngineGateway, type ResearchEngineDocument } from './researchEngineGateway';
import { ResearchEvidenceBridge, type ResearchToAppraisalBundle } from './researchEvidenceBridge';
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

export function createResearchWorkflow(document: ResearchEngineDocument, studyId = document.id): WorkflowState {
  if (!studyId.trim()) throw new Error('studyId is required.');
  const foundation = new EvidenceFoundation();
  const evidenceBundle = ResearchEvidenceBridge.buildBundle(document, undefined, studyId);
  foundation.state.set(`research:${studyId}`, evidenceBundle, 'system', 'Research document attached', 'research');
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
      evidenceCandidateCount: evidenceBundle.evidence.filter(item => item.source === 'AI_CANDIDATE').length,
      evidenceVerifiedCount: evidenceBundle.evidence.filter(item => item.verifiedByResearcher && item.source === 'HUMAN_VERIFIED').length,
      evidenceRejectedCount: evidenceBundle.evidence.filter(item => item.source === 'REJECTED').length,
    },
  };
}

export async function createResearchWorkflowFromFile(
  file: File | { name: string; size: number; type?: string; content: ArrayBuffer | string },
  studyId?: string,
): Promise<WorkflowState> {
  const document = await ResearchEngineGateway.parseDocument(file);
  return createResearchWorkflow(document, studyId ?? document.id);
}

export function createResearchWorkflowFromText(text: string, fileName = 'document.txt', studyId?: string): WorkflowState {
  if (!text?.trim()) throw new Error('Dokumenttekst kan ikke være tom.');
  const analysis = ResearchEngineGateway.analyzeText(text, fileName);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const document: ResearchEngineDocument = {
    id: createDocumentId(`${fileName}:${text.length}:${text.slice(0, 1000)}`),
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

export function updateResearchClassification(state: WorkflowState, classification: DocumentClassificationResult): WorkflowState {
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
      selectedInstrumentId: classification.recommendedInstrumentId || state.research.selectedInstrumentId,
      evidenceCandidateCount: evidenceBundle.evidence.filter(item => item.source === 'AI_CANDIDATE').length,
      evidenceVerifiedCount: evidenceBundle.evidence.filter(item => item.verifiedByResearcher && item.source === 'HUMAN_VERIFIED').length,
      evidenceRejectedCount: evidenceBundle.evidence.filter(item => item.source === 'REJECTED').length,
    },
  };
}

export function verifyResearchClassification(state: WorkflowState, reviewerId: string, approved: boolean): WorkflowState {
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
  return updateResearchClassification(state, updatedClassification);
}

export function verifyResearchEvidence(state: WorkflowState, evidenceId: string, verified: boolean, reviewerId = 'researcher'): WorkflowState {
  if (!state.research) throw new Error('Research document is not attached.');
  if (!reviewerId.trim()) throw new Error('Reviewer ID is required.');
  const evidenceBundle = ResearchEvidenceBridge.verifyEvidence(state.research.evidenceBundle, evidenceId, verified);
  return {
    ...state,
    research: {
      ...state.research,
      evidenceBundle,
      evidenceVerifiedCount: evidenceBundle.evidence.filter(item => item.verifiedByResearcher && item.source === 'HUMAN_VERIFIED').length,
      evidenceCandidateCount: evidenceBundle.evidence.filter(item => item.source === 'AI_CANDIDATE').length,
      evidenceRejectedCount: evidenceBundle.evidence.filter(item => item.source === 'REJECTED').length,
    },
  };
}

export function verifyAllCandidateEvidence(state: WorkflowState, reviewerId: string): WorkflowState {
  if (!reviewerId.trim()) throw new Error('Reviewer ID is required.');
  if (!state.research) throw new Error('Research document is not attached.');
  let next = state;
  for (const item of state.research.evidenceBundle.evidence) {
    if (item.source === 'AI_CANDIDATE') next = verifyResearchEvidence(next, item.id, true, reviewerId);
  }
  return next;
}

export function selectResearchInstrument(state: WorkflowState, instrumentId: string): WorkflowState {
  if (!state.research) throw new Error('Research document must be attached.');
  const normalized = instrumentId.trim();
  if (!normalized) throw new Error('Instrument ID mangler.');
  const decision = decideAppraisalLaunch(state.studyDesign, normalized);
  if (!decision.instrument) throw new Error(decision.reason);
  return {
    ...state,
    research: {
      ...state.research,
      selectedInstrumentId: normalized,
      evidenceBundle: {
        ...state.research.evidenceBundle,
        gating: { ...state.research.evidenceBundle.gating, instrumentRecommendation: normalized },
      },
    },
  };
}

export function assertReadyForAppraisal(state: WorkflowState): void {
  if (!state.research) throw new Error('Ingen research-workflow er knyttet til studien.');
  if (!state.research.classificationVerified) throw new Error('Human verification av dokumentklassifisering er påkrevd.');
  if (!state.research.selectedInstrumentId) throw new Error('Appraisal-instrument er ikke valgt.');
  if (getVerifiedResearchEvidence(state).length === 0) throw new Error('Minst ett evidensfunn må være menneskelig verifisert før appraisal kan startes.');
  const decision = decideAppraisalLaunch(state.studyDesign, state.research.selectedInstrumentId);
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);
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
  return state.research.evidenceBundle.evidence.filter(item => item.verifiedByResearcher && item.source === 'HUMAN_VERIFIED');
}

export function getResearchEvidenceSummary(state: WorkflowState) {
  const evidence = state.research?.evidenceBundle.evidence ?? [];
  return {
    total: evidence.length,
    verified: evidence.filter(item => item.verifiedByResearcher && item.source === 'HUMAN_VERIFIED').length,
    candidates: evidence.filter(item => item.source === 'AI_CANDIDATE').length,
    rejected: evidence.filter(item => item.source === 'REJECTED').length,
  };
}

export async function handoffWorkflow(foundation: EvidenceFoundation, fromModule: EvidenceModule, toModule: EvidenceModule, fromRole: string, toRole: string, studyId: string, reason: string): Promise<void> {
  await foundation.handoff({ fromModule, toModule, fromRole, toRole, context: { studyId }, reason, correlationId: foundation.state.snapshot().correlationId });
}

function createDocumentId(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `doc-${(hash >>> 0).toString(16)}`;
}
