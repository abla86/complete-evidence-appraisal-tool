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
import { researchWorkflowStore } from './researchWorkflowStore';
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

function buildRecord(payload: ResearchAppraisalPayload, session: AppraisalSession): AppraisalWorkflowRecord {
  return {
    session,
    researchStudyId: payload.studyId,
    sourceDocumentId: payload.document.id,
    instrumentId: payload.instrumentId,
    evidenceIds: payload.evidence.map(item => item.id),
  };
}

function findActiveSession(payload: ResearchAppraisalPayload, reviewerId: string): AppraisalWorkflowRecord | undefined {
  return appraisalWorkflowStore.listByStudy(payload.studyId)
    .find(item => item.instrumentId === payload.instrumentId && item.session.reviewerId === reviewerId && !item.session.locked);
}

function syncToResearchWorkflow(session: AppraisalSession): void {
  const workflow = researchWorkflowStore.get(session.studyId);
  if (workflow) researchWorkflowStore.updateAppraisalSession(session.studyId, session);
}

export async function createAppraisalFromResearch(payload: ResearchAppraisalPayload, reviewerId: string): Promise<AppraisalWorkflowRecord> {
  assertPayload(payload, reviewerId);

  const existing = findActiveSession(payload, reviewerId);
  if (existing) return existing;

  const session = createBlankAppraisalSession(payload.studyId, payload.instrumentId, reviewerId);
  const saved = appraisalWorkflowStore.save(buildRecord(payload, session));
  syncToResearchWorkflow(session);
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

  const existing = findActiveSession(payload, reviewerId);
  if (existing) {
    const workflow = updateWorkflow(existing.session);
    syncToResearchWorkflow(existing.session);
    return { record: existing, workflow };
  }

  const session = createBlankAppraisalSession(payload.studyId, payload.instrumentId, reviewerId);
  const record = buildRecord(payload, session);
  const workflow = updateWorkflow(session);
  appraisalWorkflowStore.save(record);
  syncToResearchWorkflow(session);
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
  if (record.session.locked) throw new Error('Appraisal session is locked.');
  if (response.rationale === undefined) throw new Error('rationale is required.');
  const session = upsertAppraisalResponse(record.session, {
    ...response,
    rationale: String(response.rationale).trim(),
  });
  const saved = appraisalWorkflowStore.save({ ...record, session });
  syncToResearchWorkflow(session);
  return saved;
}

export function validateAppraisal(sessionId: string): AppraisalSessionValidation {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  return validateAppraisalSession(record.session);
}

export async function finalizeAppraisal(sessionId: string): Promise<AppraisalWorkflowRecord> {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  if (record.session.locked) return record;
  const validation = validateAppraisalSession(record.session);
  if (!validation.valid) throw new Error(`Kan ikke ferdigstille appraisal: ${validation.issues.join(' ')}`);
  const session = lockAppraisalSession(record.session);
  const saved = appraisalWorkflowStore.save({ ...record, session });
  syncToResearchWorkflow(session);
  await evidenceEventBus.emit('appraisal.session.finalized', {
    studyId: record.researchStudyId,
    sessionId: session.id,
    instrumentId: session.instrumentId,
    reviewerId: session.reviewerId,
  });
  return saved;
}
