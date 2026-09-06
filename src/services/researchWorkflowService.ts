import type { AppraisalSession, ResearchAppraisalPayload, ResearchWorkflowContext, ScreeningDecision, ScreeningRecord, WorkflowState } from '../types/workflow.contracts';
import { decideAppraisalLaunch } from './universalAppraisalService';
import { EvidenceFoundation, type EvidenceModule } from './evidenceSystemFoundation';
import { ResearchEngineGateway, type ResearchEngineDocument } from './researchEngineGateway';
import { ResearchEvidenceBridge, type ResearchToAppraisalBundle } from './researchEvidenceBridge';
import type { DocumentClassificationResult } from '../types';

export type {
  AppraisalSession,
  ResearchAppraisalPayload,
  ResearchWorkflowContext,
  ScreeningDecision,
  ScreeningRecord,
  WorkflowState,
} from '../types/workflow.contracts';

function evidenceCounts(evidence: ResearchToAppraisalBundle['evidence']) {
  return {
    evidenceCandidateCount: evidence.filter(item => item.source === 'AI_CANDIDATE').length,
    evidenceVerifiedCount: evidence.filter(
      item =>
        item.source === 'HUMAN_VERIFIED' &&
        item.verifiedByResearcher &&
        Boolean(item.verifiedBy) &&
        Boolean(item.verifiedAt),
    ).length,
    evidenceRejectedCount: evidence.filter(item => item.source === 'REJECTED').length,
  };
}

function createDocumentId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `doc-${(hash >>> 0).toString(16)}`;
}

function normalizeStudyId(studyId: string | undefined): string {
  const normalized = studyId?.trim() ?? '';
  if (!normalized) throw new Error('studyId is required.');
  return normalized;
}

function normalizeReviewerId(reviewerId: string): string {
  const normalized = reviewerId.trim();
  if (!normalized) throw new Error('Reviewer ID is required.');
  return normalized;
}

function hasIncludedScreeningDecision(state: WorkflowState): boolean {
  const included = state.screening.filter(
    record =>
      record.studyId === state.studyId &&
      record.decision === 'INCLUDED',
  );

  const excluded = state.screening.filter(
    record =>
      record.studyId === state.studyId &&
      record.decision === 'EXCLUDED',
  );

  if (excluded.length === 0) return included.length > 0;

  const latestByReviewer = new Map<string, ScreeningRecord>();
  for (const record of state.screening) {
    if (record.studyId !== state.studyId) continue;
    latestByReviewer.set(record.reviewerId, record);
  }

  const latestDecisions = [...latestByReviewer.values()];
  return latestDecisions.length > 0 && latestDecisions.every(record => record.decision !== 'EXCLUDED') && latestDecisions.some(record => record.decision === 'INCLUDED');
}

export function createResearchWorkflow(
  document: ResearchEngineDocument,
  studyId = document.id,
  analysis?: ReturnType<typeof ResearchEngineGateway.analyzeText>,
): WorkflowState {
  const normalizedStudyId = normalizeStudyId(studyId);
  const foundation = new EvidenceFoundation();
  const evidenceBundle = ResearchEvidenceBridge.buildBundle(
    document,
    undefined,
    normalizedStudyId,
  );
  const counts = evidenceCounts(evidenceBundle.evidence);

  foundation.state.set(
    `research:${normalizedStudyId}`,
    evidenceBundle,
    'system',
    'Research document attached',
    'research',
  );

  return {
    studyId: normalizedStudyId,
    studyDesign: document.metadata.studyDesignDetected?.trim() || 'UNKNOWN',
    screening: [],
    appraisalSessions: [],
    events: foundation.state.events(),
    research: {
      document,
      evidenceBundle,
      analysis,
      classificationVerified: false,
      selectedInstrumentId: undefined,
      ...counts,
    },
  };
}

export async function createResearchWorkflowFromFile(
  file: File | { name: string; size: number; type?: string; content: ArrayBuffer | string },
  studyId?: string,
) {
  const document = await ResearchEngineGateway.parseDocument(file);
  return createResearchWorkflow(document, studyId ?? document.id);
}

export function createResearchWorkflowFromText(
  text: string,
  fileName = 'document.txt',
  studyId?: string,
): WorkflowState {
  if (!text?.trim()) throw new Error('Dokumenttekst kan ikke vÃ¦re tom.');

  const normalizedFileName = fileName.trim() || 'document.txt';
  const analysis = ResearchEngineGateway.analyzeText(text, normalizedFileName);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const document: ResearchEngineDocument = {
    id: createDocumentId(`${normalizedFileName}:${text.length}:${text.slice(0, 1000)}`),
    fileName: normalizedFileName,
    fileType: 'txt',
    mimeType: 'text/plain',
    extractedText: text,
    wordCount: words.length,
    estimatedPages: Math.max(1, Math.ceil(words.length / 500)),
    metadata: {
      title: normalizedFileName.replace(/\.[^/.]+$/, ''),
      authors: '',
      year: undefined,
      journal: '',
      doi: '',
      abstract: '',
      studyDesignDetected: '',
      recommendedInstrumentId: '',
    },
    sections: [],
    scanned: false,
    ocrNeeded: false,
    candidateEvidence: analysis.candidateEvidence ?? [],
  };

  return createResearchWorkflow(document, studyId ?? document.id, analysis);
}

export function updateResearchClassification(
  state: WorkflowState,
  classification: DocumentClassificationResult,
): WorkflowState {
  if (!state.research) {
    throw new Error('Research document must be attached before classification is updated.');
  }

  const evidenceBundle = ResearchEvidenceBridge.buildBundle(
    state.research.document as ResearchEngineDocument,
    classification,
    state.studyId,
  );
  const counts = evidenceCounts(evidenceBundle.evidence);
  const verified =
    classification.confidenceStatus === 'HUMAN_VERIFIED' &&
    classification.humanDecision?.status === 'APPROVED';

  return {
    ...state,
    studyDesign: classification.studyDesign?.trim() || 'UNKNOWN',
    research: {
      ...state.research,
      evidenceBundle,
      classificationVerified: verified,
      selectedInstrumentId:
        classification.recommendedInstrumentId?.trim() &&
        classification.recommendedInstrumentId !== 'UNKNOWN'
          ? classification.recommendedInstrumentId.trim()
          : undefined,
      ...counts,
    },
  };
}

export function verifyResearchClassification(
  state: WorkflowState,
  reviewerId: string,
  approved: boolean,
): WorkflowState {
  const id = normalizeReviewerId(reviewerId);
  if (!state.research) {
    throw new Error('Research document must be attached before classification can be verified.');
  }
  if (!state.research.evidenceBundle.classification) {
    throw new Error('No classification is available for verification.');
  }

  const current = state.research.evidenceBundle.classification;
  const now = new Date().toISOString();

  return updateResearchClassification(state, {
    ...current,
    confidenceStatus: approved ? 'HUMAN_VERIFIED' : 'MANUAL_VERIFICATION_REQUIRED',
    statusBadgeText: approved ? 'Human verified' : 'Manual verification required',
    humanDecision: {
      ...current.humanDecision,
      status: approved ? 'APPROVED' : 'REJECTED',
      verifiedAt: now,
      verifiedBy: id,
      rationale: approved
        ? 'Classification approved by researcher.'
        : 'Classification rejected by researcher.',
    },
  });
}

export function verifyResearchEvidence(
  state: WorkflowState,
  evidenceId: string,
  verified: boolean,
  reviewerId: string,
): WorkflowState {
  const id = normalizeReviewerId(reviewerId);
  if (!state.research) throw new Error('Research document is not attached.');

  const current = state.research.evidenceBundle.evidence.find(
    item => item.id === evidenceId,
  );
  if (!current) throw new Error(`Evidence finnes ikke: ${evidenceId}`);
  if (current.source === 'REJECTED' && verified) {
    throw new Error(
      'Avvist evidence mÃ¥ vurderes pÃ¥ nytt gjennom eksplisitt re-inntak fÃ¸r det kan verifiseres.',
    );
  }

  const evidenceBundle = ResearchEvidenceBridge.verifyEvidence(
    state.research.evidenceBundle as ResearchToAppraisalBundle,
    evidenceId,
    verified,
    id,
  );

  return {
    ...state,
    research: {
      ...state.research,
      evidenceBundle,
      ...evidenceCounts(evidenceBundle.evidence),
    },
  };
}

export function selectResearchInstrument(
  state: WorkflowState,
  instrumentId: string,
): WorkflowState {
  if (!state.research) throw new Error('Research document must be attached.');

  const normalized = instrumentId.trim();
  if (!normalized) throw new Error('Instrument ID mangler.');

  const decision = decideAppraisalLaunch(state.studyDesign, normalized);
  if (!decision.instrument || !decision.allowed) throw new Error(decision.reason);

  return {
    ...state,
    research: {
      ...state.research,
      selectedInstrumentId: decision.instrument.id,
      evidenceBundle: {
        ...state.research.evidenceBundle,
        gating: {
          ...state.research.evidenceBundle.gating,
          instrumentRecommendation: decision.instrument.id,
        },
      },
    },
  };
}

export function getVerifiedResearchEvidence(state: WorkflowState) {
  return (
    state.research?.evidenceBundle.evidence.filter(
      item =>
        item.source === 'HUMAN_VERIFIED' &&
        item.verifiedByResearcher &&
        Boolean(item.verifiedBy) &&
        Boolean(item.verifiedAt),
    ) ?? []
  );
}

export function recordScreeningDecision(
  state: WorkflowState,
  reviewerId: string,
  decision: ScreeningDecision,
  reason?: string,
): WorkflowState {
  const id = normalizeReviewerId(reviewerId);
  const normalizedReason =
    reason?.trim() || `Screening decision recorded as ${decision}.`;
  const now = new Date().toISOString();

  return {
    ...state,
    screening: [
      ...state.screening.filter(
        item => !(item.studyId === state.studyId && item.reviewerId === id),
      ),
      {
        studyId: state.studyId,
        reviewerId: id,
        decision,
        reason: normalizedReason,
        updatedAt: now,
      },
    ],
  };
}

export function assertReadyForAppraisal(state: WorkflowState): void {
  if (!state.research) {
    throw new Error('Ingen research-workflow er knyttet til studien.');
  }

  if (!hasIncludedScreeningDecision(state)) {
    throw new Error('INCLUDED screening decision required before appraisal.');
  }

  if (!state.research.classificationVerified) {
    throw new Error(
      'Human verification av dokumentklassifisering (classification) er pÃ¥krevd.',
    );
  }

  const selectedInstrumentId = state.research.selectedInstrumentId?.trim();
  if (!selectedInstrumentId) {
    throw new Error('Appraisal-instrument er ikke valgt.');
  }

  const recommendation =
    state.research.evidenceBundle.gating.instrumentRecommendation?.trim();
  if (!recommendation || recommendation !== selectedInstrumentId) {
    throw new Error(
      'Valgt appraisal-instrument mangler konsistent workflow-gating.',
    );
  }

  const verifiedEvidence = getVerifiedResearchEvidence(state);
  if (verifiedEvidence.length === 0) {
    throw new Error(
      'Minst ett evidensfunn mÃ¥ vÃ¦re menneskelig verifisert fÃ¸r appraisal kan startes.',
    );
  }

  const decision = decideAppraisalLaunch(
    state.studyDesign,
    selectedInstrumentId,
  );
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);
}

export function buildResearchAppraisalPayload(
  state: WorkflowState,
): ResearchAppraisalPayload {
  assertReadyForAppraisal(state);

  return {
    studyId: state.studyId,
    instrumentId: state.research!.selectedInstrumentId!,
    evidence: getVerifiedResearchEvidence(state),
    document: state.research!.document,
    classification: state.research!.evidenceBundle.classification,
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

export function getResearchEvidenceSummary(state: WorkflowState) {
  const evidence = state.research?.evidenceBundle.evidence ?? [];
  return {
    total: evidence.length,
    verified: evidence.filter(
      item =>
        item.source === 'HUMAN_VERIFIED' &&
        item.verifiedByResearcher &&
        Boolean(item.verifiedBy) &&
        Boolean(item.verifiedAt),
    ).length,
    candidates: evidence.filter(item => item.source === 'AI_CANDIDATE').length,
    rejected: evidence.filter(item => item.source === 'REJECTED').length,
  };
}


