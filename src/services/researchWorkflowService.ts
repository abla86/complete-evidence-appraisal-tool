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
  analysis?: ReturnType<typeof ResearchEngineGateway.analyzeText>;
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

function evidenceCounts(evidence: ResearchToAppraisalBundle['evidence']) {
  return {
    evidenceCandidateCount: evidence.filter(item => item.source === 'AI_CANDIDATE').length,
    evidenceVerifiedCount: evidence.filter(item => item.verifiedByResearcher && item.source === 'HUMAN_VERIFIED' && Boolean(item.verifiedBy) && Boolean(item.verifiedAt)).length,
    evidenceRejectedCount: evidence.filter(item => item.source === 'REJECTED').length,
  };
}

function createDocumentId(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `doc-${(hash >>> 0).toString(16)}`;
}

export function createResearchWorkflow(document: ResearchEngineDocument, studyId = document.id, analysis?: ReturnType<typeof ResearchEngineGateway.analyzeText>): WorkflowState {
  const normalizedStudyId = studyId.trim();
  if (!normalizedStudyId) throw new Error('studyId is required.');
  const foundation = new EvidenceFoundation();
  const evidenceBundle = ResearchEvidenceBridge.buildBundle(document, undefined, normalizedStudyId);
  const counts = evidenceCounts(evidenceBundle.evidence);
  foundation.state.set(`research:${normalizedStudyId}`, evidenceBundle, 'system', 'Research document attached', 'research');
  return {
    studyId: normalizedStudyId,
    studyDesign: document.metadata.studyDesignDetected?.trim() ?? '',
    screening: [],
    appraisalSessions: [],
    events: foundation.state.events(),
    research: { document, evidenceBundle, analysis, classificationVerified: false, selectedInstrumentId: document.metadata.recommendedInstrumentId?.trim() || undefined, ...counts },
  };
}

export async function createResearchWorkflowFromFile(file: File | { name: string; size: number; type?: string; content: ArrayBuffer | string }, studyId?: string): Promise<WorkflowState> {
  const document = await ResearchEngineGateway.parseDocument(file);
  return createResearchWorkflow(document, studyId ?? document.id);
}

export function createResearchWorkflowFromText(text: string, fileName = 'document.txt', studyId?: string): WorkflowState {
  if (!text?.trim()) throw new Error('Dokumenttekst kan ikke være tom.');
  const normalizedFileName = fileName.trim() || 'document.txt';
  const analysis = ResearchEngineGateway.analyzeText(text, normalizedFileName);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const document: ResearchEngineDocument = {
    id: createDocumentId(`${normalizedFileName}:${text.length}:${text.slice(0, 1000)}`), fileName: normalizedFileName, fileType: 'txt', mimeType: 'text/plain', extractedText: text, wordCount: words.length, estimatedPages: Math.max(1, Math.ceil(words.length / 500)),
    metadata: { title: normalizedFileName.replace(/\.[^/.]+$/, ''), authors: '', year: undefined, journal: '', doi: '', abstract: '', studyDesignDetected: '', recommendedInstrumentId: '' },
    sections: [], scanned: false, ocrNeeded: false, candidateEvidence: analysis.candidateEvidence ?? [],
  };
  return createResearchWorkflow(document, studyId ?? document.id, analysis);
}

export function updateResearchClassification(state: WorkflowState, classification: DocumentClassificationResult): WorkflowState {
  if (!state.research) throw new Error('Research document must be attached before classification is updated.');
  const evidenceBundle = ResearchEvidenceBridge.buildBundle(state.research.document, classification, state.studyId);
  const counts = evidenceCounts(evidenceBundle.evidence);
  const verified = classification.confidenceStatus === 'HUMAN_VERIFIED' && classification.humanDecision?.status === 'APPROVED';
  return { ...state, studyDesign: classification.studyDesign?.trim() ?? '', research: { ...state.research, evidenceBundle, classificationVerified: verified, selectedInstrumentId: classification.recommendedInstrumentId?.trim() || state.research.selectedInstrumentId, ...counts } };
}

export function verifyResearchClassification(state: WorkflowState, reviewerId: string, approved: boolean): WorkflowState {
  const normalizedReviewerId = reviewerId.trim();
  if (!state.research) throw new Error('Research document must be attached before classification can be verified.');
  if (!state.research.evidenceBundle.classification) throw new Error('No classification is available for verification.');
  if (!normalizedReviewerId) throw new Error('Reviewer ID is required.');
  const current = state.research.evidenceBundle.classification;
  const now = new Date().toISOString();
  const updatedClassification: DocumentClassificationResult = { ...current, confidenceStatus: approved ? 'HUMAN_VERIFIED' : 'MANUAL_VERIFICATION_REQUIRED', statusBadgeText: approved ? 'Human verified' : 'Manual verification required', humanDecision: { ...current.humanDecision, status: approved ? 'APPROVED' : 'REJECTED', verifiedAt: now, verifiedBy: normalizedReviewerId, rationale: approved ? 'Classification approved by researcher.' : 'Classification rejected by researcher.' } };
  return updateResearchClassification(state, updatedClassification);
}

export function verifyResearchEvidence(state: WorkflowState, evidenceId: string, verified: boolean, reviewerId: string): WorkflowState {
  const normalizedReviewerId = reviewerId.trim();
  if (!state.research) throw new Error('Research document is not attached.');
  if (!normalizedReviewerId) throw new Error('Reviewer ID is required.');
  const current = state.research.evidenceBundle.evidence.find(item => item.id === evidenceId);
  if (!current) throw new Error(`Evidence finnes ikke: ${evidenceId}`);
  if (current.source === 'REJECTED' && verified) throw new Error('Avvist evidence må vurderes på nytt gjennom eksplisitt re-inntak før det kan verifiseres.');
  const evidenceBundle = ResearchEvidenceBridge.verifyEvidence(state.research.evidenceBundle, evidenceId, verified, normalizedReviewerId);
  return { ...state, research: { ...state.research, evidenceBundle, ...evidenceCounts(evidenceBundle.evidence) } };
}

export function verifyAllCandidateEvidence(state: WorkflowState, reviewerId: string): WorkflowState {
  if (!reviewerId.trim()) throw new Error('Reviewer ID is required.');
  if (!state.research) throw new Error('Research document is not attached.');
  let next = state;
  for (const item of state.research.evidenceBundle.evidence) if (item.source === 'AI_CANDIDATE') next = verifyResearchEvidence(next, item.id, true, reviewerId);
  return next;
}

export function selectResearchInstrument(state: WorkflowState, instrumentId: string): WorkflowState {
  if (!state.research) throw new Error('Research document must be attached.');
  const normalized = instrumentId.trim();
  if (!normalized) throw new Error('Instrument ID mangler.');
  const decision = decideAppraisalLaunch(state.studyDesign, normalized);
  if (!decision.instrument || !decision.allowed) throw new Error(decision.reason);
  return { ...state, research: { ...state.research, selectedInstrumentId: decision.instrument.id, evidenceBundle: { ...state.research.evidenceBundle, gating: { ...state.research.evidenceBundle.gating, instrumentRecommendation: decision.instrument.id } } } };
}

export function getVerifiedResearchEvidence(state: WorkflowState) {
  if (!state.research) return [] as ResearchToAppraisalBundle['evidence'];
  return state.research.evidenceBundle.evidence.filter(item => item.source === 'HUMAN_VERIFIED' && item.verifiedByResearcher && Boolean(item.verifiedBy) && Boolean(item.verifiedAt));
}

export function recordScreeningDecision(state: WorkflowState, reviewerId: string, decision: ScreeningDecision, reason?: string): WorkflowState {
  const normalizedReviewerId = reviewerId.trim();
  if (!normalizedReviewerId) throw new Error('Reviewer ID is required.');
  if (!['PENDING', 'INCLUDED', 'EXCLUDED'].includes(decision)) throw new Error('Ugyldig screeningbeslutning.');
  if ((decision === 'EXCLUDED' || decision === 'PENDING') && !reason?.trim()) throw new Error('Begrunnelse er påkrevd for PENDING/EXCLUDED.');
  const record: ScreeningRecord = {
    studyId: state.studyId,
    reviewerId: normalizedReviewerId,
    decision,
    reason: reason?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  return {
    ...state,
    screening: [
      ...state.screening.filter(item => item.reviewerId !== normalizedReviewerId),
      record,
    ],
  };
}

export function assertReadyForAppraisal(state: WorkflowState): void {
  if (!state.screening.some(item => item.studyId === state.studyId && item.decision === 'INCLUDED')) {
    throw new Error('Studien må være eksplisitt inkludert i screening før appraisal kan startes.');
  }
  if (!state.research) throw new Error('Ingen research-workflow er knyttet til studien.');
  if (!state.research.classificationVerified) throw new Error('Human verification av dokumentklassifisering er påkrevd.');
  if (!state.research.selectedInstrumentId) throw new Error('Appraisal-instrument er ikke valgt.');
  const verifiedEvidence = getVerifiedResearchEvidence(state);
  if (verifiedEvidence.length === 0) throw new Error('Minst ett evidensfunn må være menneskelig verifisert før appraisal kan startes.');
  const recommendation = state.research.evidenceBundle.gating.instrumentRecommendation?.trim();
  if (!recommendation || recommendation !== state.research.selectedInstrumentId) throw new Error('Valgt appraisal-instrument mangler konsistent workflow-gating.');
  const decision = decideAppraisalLaunch(state.studyDesign, state.research.selectedInstrumentId);
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);
}

export function buildResearchAppraisalPayload(state: WorkflowState): ResearchAppraisalPayload {
  assertReadyForAppraisal(state);
  const evidence = getVerifiedResearchEvidence(state);
  if (evidence.length === 0) throw new Error('Minst ett HUMAN_VERIFIED evidens kreves.');
  return { studyId: state.studyId, instrumentId: state.research!.selectedInstrumentId!, evidence, document: state.research!.document, classification: state.research!.evidenceBundle.classification };
}

export async function handoffWorkflow(foundation: EvidenceFoundation, fromModule: EvidenceModule, toModule: EvidenceModule, fromRole: string, toRole: string, studyId: string, reason: string): Promise<void> {
  await foundation.handoff({ fromModule, toModule, fromRole, toRole, context: { studyId }, reason, correlationId: foundation.state.snapshot().correlationId });
}

export function getResearchEvidenceSummary(state: WorkflowState) {
  const evidence = state.research?.evidenceBundle.evidence ?? [];
  return { total: evidence.length, verified: evidence.filter(item => item.source === 'HUMAN_VERIFIED' && item.verifiedByResearcher && Boolean(item.verifiedBy) && Boolean(item.verifiedAt)).length, candidates: evidence.filter(item => item.source === 'AI_CANDIDATE').length, rejected: evidence.filter(item => item.source === 'REJECTED').length };
}
