import {
  createBlankAppraisalSession,
  lockAppraisalSession,
  upsertAppraisalResponse,
  validateAppraisalSession,
  type AppraisalItemResponse,
  type AppraisalSession,
  type AppraisalSessionValidation,
} from './universalAppraisalService';
import type { ResearchAppraisalPayload, WorkflowState } from './researchWorkflowService';
import { evidenceEventBus } from './evidenceEventBus';

export interface AppraisalWorkflowRecord {
  session: AppraisalSession;
  researchStudyId: string;
  sourceDocumentId: string;
  instrumentId: string;
  evidenceIds: string[];
}

export interface AppraisalWorkflowStore {
  get(sessionId: string): AppraisalWorkflowRecord | undefined;
  save(record: AppraisalWorkflowRecord): AppraisalWorkflowRecord;
  listByStudy(studyId: string): AppraisalWorkflowRecord[];
}

export class InMemoryAppraisalWorkflowStore implements AppraisalWorkflowStore {
  private readonly records = new Map<string, AppraisalWorkflowRecord>();

  public get(sessionId: string): AppraisalWorkflowRecord | undefined {
    return this.records.get(sessionId);
  }

  public save(record: AppraisalWorkflowRecord): AppraisalWorkflowRecord {
    this.records.set(record.session.id, record);
    return record;
  }

  public listByStudy(studyId: string): AppraisalWorkflowRecord[] {
    return [...this.records.values()].filter(item => item.researchStudyId === studyId);
  }
}

export const appraisalWorkflowStore = new InMemoryAppraisalWorkflowStore();

function assertPayload(payload: ResearchAppraisalPayload, reviewerId: string): void {
  if (!reviewerId.trim()) throw new Error('reviewerId is required.');
  if (!payload.studyId.trim()) throw new Error('studyId is required.');
  if (!payload.instrumentId.trim()) throw new Error('instrumentId is required.');
  if (!payload.document.id.trim()) throw new Error('document.id is required.');
  if (payload.evidence.length === 0) throw new Error('Appraisal payload contains no human-verified evidence.');
  if (payload.evidence.some(item => item.source !== 'HUMAN_VERIFIED' || !item.verifiedByResearcher)) {
    throw new Error('Appraisal payload contains unverified evidence.');
  }
}

function buildRecord(payload: ResearchAppraisalPayload, reviewerId: string, session: AppraisalSession): AppraisalWorkflowRecord {
  return {
    session,
    researchStudyId: payload.studyId,
    sourceDocumentId: payload.document.id,
    instrumentId: payload.instrumentId,
    evidenceIds: payload.evidence.map(item => item.id),
  };
}

export async function createAppraisalFromResearch(payload: ResearchAppraisalPayload, reviewerId: string): Promise<AppraisalWorkflowRecord> {
  assertPayload(payload, reviewerId);

  const existing = appraisalWorkflowStore.listByStudy(payload.studyId)
    .find(item => item.instrumentId === payload.instrumentId && item.session.reviewerId === reviewerId && !item.session.locked);
  if (existing) return existing;

  const session = createBlankAppraisalSession(payload.studyId, payload.instrumentId, reviewerId);
  const saved = appraisalWorkflowStore.save(buildRecord(payload, reviewerId, session));
  await evidenceEventBus.emit('appraisal.session.created', {
    studyId: payload.studyId,
    sessionId: session.id,
    instrumentId: payload.instrumentId,
    reviewerId,
  });
  return saved;
}

export function createAndAttachAppraisal(
  payload: ResearchAppraisalPayload,
  reviewerId: string,
  updateWorkflow: (session: AppraisalSession) => WorkflowState,
): { record: AppraisalWorkflowRecord; workflow: WorkflowState } {
  assertPayload(payload, reviewerId);

  const existing = appraisalWorkflowStore.listByStudy(payload.studyId)
    .find(item => item.instrumentId === payload.instrumentId && item.session.reviewerId === reviewerId && !item.session.locked);
  if (existing) {
    return { record: existing, workflow: updateWorkflow(existing.session) };
  }

  const session = createBlankAppraisalSession(payload.studyId, payload.instrumentId, reviewerId);
  const record = appraisalWorkflowStore.save(buildRecord(payload, reviewerId, session));
  const workflow = updateWorkflow(session);
  void evidenceEventBus.emit('appraisal.session.created', {
    studyId: payload.studyId,
    sessionId: session.id,
    instrumentId: payload.instrumentId,
    reviewerId,
  });
  return { record, workflow };
}

export function getAppraisalWorkflowRecord(sessionId: string): AppraisalWorkflowRecord | undefined {
  return appraisalWorkflowStore.get(sessionId);
}

export async function recordAppraisalResponse(sessionId: string, response: AppraisalItemResponse): Promise<AppraisalWorkflowRecord> {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  if (response.rationale === undefined) throw new Error('rationale is required.');
  const session = upsertAppraisalResponse(record.session, {
    ...response,
    rationale: String(response.rationale).trim(),
  });
  return appraisalWorkflowStore.save({ ...record, session });
}

export function validateAppraisal(sessionId: string): AppraisalSessionValidation {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  return validateAppraisalSession(record.session);
}

export async function finalizeAppraisal(sessionId: string): Promise<AppraisalWorkflowRecord> {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  const validation = validateAppraisalSession(record.session);
  if (!validation.valid) throw new Error(`Kan ikke ferdigstille appraisal: ${validation.issues.join(' ')}`);
  const session = lockAppraisalSession(record.session);
  const saved = appraisalWorkflowStore.save({ ...record, session });
  await evidenceEventBus.emit('appraisal.session.finalized', {
    studyId: record.researchStudyId,
    sessionId: session.id,
    instrumentId: session.instrumentId,
    reviewerId: session.reviewerId,
  });
  return saved;
}
