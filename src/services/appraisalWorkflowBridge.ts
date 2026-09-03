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
import { appendAuditEntry } from './auditTrailService';

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
  delete(sessionId: string): boolean;
}

export class InMemoryAppraisalWorkflowStore implements AppraisalWorkflowStore {
  private readonly records = new Map<string, AppraisalWorkflowRecord>();
  public get(sessionId: string): AppraisalWorkflowRecord | undefined { return this.records.get(sessionId); }
  public save(record: AppraisalWorkflowRecord): AppraisalWorkflowRecord { this.records.set(record.session.id, record); return record; }
  public listByStudy(studyId: string): AppraisalWorkflowRecord[] { return [...this.records.values()].filter(item => item.researchStudyId === studyId); }
  public delete(sessionId: string): boolean { return this.records.delete(sessionId); }
}

export const appraisalWorkflowStore = new InMemoryAppraisalWorkflowStore();

function assertPayload(payload: ResearchAppraisalPayload, reviewerId: string): void {
  const normalizedReviewerId = reviewerId.trim();
  if (!normalizedReviewerId) throw new Error('reviewerId is required.');
  if (!payload.studyId.trim()) throw new Error('studyId is required.');
  if (!payload.instrumentId.trim()) throw new Error('instrumentId is required.');
  if (!payload.document?.id?.trim()) throw new Error('document.id is required.');
  if (!Array.isArray(payload.evidence) || payload.evidence.length === 0) throw new Error('Appraisal payload contains no human-verified evidence.');
  if (payload.evidence.some(item => item.source !== 'HUMAN_VERIFIED' || !item.verifiedByResearcher || !item.verifiedBy || !item.verifiedAt)) {
    throw new Error('Appraisal payload contains evidence without complete human verification provenance.');
  }
}

function buildRecord(payload: ResearchAppraisalPayload, session: AppraisalSession): AppraisalWorkflowRecord {
  return {
    session,
    researchStudyId: payload.studyId.trim(),
    sourceDocumentId: payload.document.id.trim(),
    instrumentId: session.instrumentId,
    evidenceIds: [...new Set(payload.evidence.map(item => item.id.trim()).filter(Boolean))],
  };
}

function findActiveSession(payload: ResearchAppraisalPayload, reviewerId: string): AppraisalWorkflowRecord | undefined {
  const studyId = payload.studyId.trim();
  const instrumentId = payload.instrumentId.trim();
  const normalizedReviewerId = reviewerId.trim();
  return appraisalWorkflowStore.listByStudy(studyId).find(item =>
    item.researchStudyId === studyId &&
    item.instrumentId === instrumentId &&
    item.session.studyId === studyId &&
    item.session.instrumentId === instrumentId &&
    item.session.reviewerId === normalizedReviewerId &&
    !item.session.locked,
  );
}

function syncToResearchWorkflow(session: AppraisalSession): WorkflowState {
  const workflow = researchWorkflowStore.get(session.studyId);
  if (!workflow) throw new Error(`Research workflow not found: ${session.studyId}`);
  return researchWorkflowStore.updateAppraisalSession(session.studyId, session);
}

function syncOrRegisterWorkflow(workflow: WorkflowState): WorkflowState {
  const existing = researchWorkflowStore.get(workflow.studyId);
  if (!existing) return researchWorkflowStore.save(workflow);
  return existing;
}

export async function createAppraisalFromResearch(payload: ResearchAppraisalPayload, reviewerId: string): Promise<AppraisalWorkflowRecord> {
  assertPayload(payload, reviewerId);
  const existing = findActiveSession(payload, reviewerId);
  if (existing) return existing;
  const session = createBlankAppraisalSession(payload.studyId.trim(), payload.instrumentId.trim(), reviewerId.trim());
  const record = buildRecord(payload, session);
  syncToResearchWorkflow(session);
  appraisalWorkflowStore.save(record);
  await appendAuditEntry({ actor: { id: reviewerId.trim(), role: 'reviewer' }, action: 'appraisal.session.created', subject: { entityType: 'appraisal-session', id: session.id }, detail: { studyId: payload.studyId.trim(), instrumentId: session.instrumentId, evidenceIds: record.evidenceIds } });
  await evidenceEventBus.emit('appraisal.session.created', { studyId: payload.studyId.trim(), sessionId: session.id, instrumentId: session.instrumentId, reviewerId: reviewerId.trim() });
  return record;
}

export async function createAndAttachAppraisal(
  payload: ResearchAppraisalPayload,
  reviewerId: string,
  updateWorkflow: (session: AppraisalSession) => WorkflowState,
): Promise<{ record: AppraisalWorkflowRecord; workflow: WorkflowState }> {
  assertPayload(payload, reviewerId);
  const existing = findActiveSession(payload, reviewerId);
  if (existing) {
    const workflow = updateWorkflow(existing.session);
    const syncedWorkflow = syncToResearchWorkflow(existing.session);
    return { record: existing, workflow: syncedWorkflow ?? workflow };
  }

  const session = createBlankAppraisalSession(payload.studyId.trim(), payload.instrumentId.trim(), reviewerId.trim());
  const record = buildRecord(payload, session);
  const workflow = updateWorkflow(session);
  syncOrRegisterWorkflow(workflow);
  const syncedWorkflow = syncToResearchWorkflow(session);
  appraisalWorkflowStore.save(record);

  await appendAuditEntry({ actor: { id: reviewerId.trim(), role: 'reviewer' }, action: 'appraisal.session.created', subject: { entityType: 'appraisal-session', id: session.id }, detail: { studyId: payload.studyId.trim(), instrumentId: session.instrumentId, evidenceIds: record.evidenceIds } });
  await evidenceEventBus.emit('appraisal.session.created', { studyId: payload.studyId.trim(), sessionId: session.id, instrumentId: session.instrumentId, reviewerId: reviewerId.trim() });
  return { record, workflow: syncedWorkflow };
}

export function getAppraisalWorkflowRecord(sessionId: string): AppraisalWorkflowRecord | undefined { return appraisalWorkflowStore.get(sessionId); }

export async function recordAppraisalResponse(sessionId: string, response: AppraisalItemResponse): Promise<AppraisalWorkflowRecord> {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  if (record.session.locked) throw new Error('Appraisal session is locked.');
  if (!response || response.rationale === undefined) throw new Error('rationale is required.');
  const session = upsertAppraisalResponse(record.session, { ...response, rationale: String(response.rationale).trim() });
  syncToResearchWorkflow(session);
  const saved = appraisalWorkflowStore.save({ ...record, session });
  await appendAuditEntry({ actor: { id: session.reviewerId, role: 'reviewer' }, action: 'appraisal.response.updated', subject: { entityType: 'appraisal-session', id: sessionId }, detail: { itemId: response.itemId, answer: response.answer } });
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
  syncToResearchWorkflow(session);
  const saved = appraisalWorkflowStore.save({ ...record, session });
  await appendAuditEntry({ actor: { id: session.reviewerId, role: 'reviewer' }, action: 'appraisal.session.locked', subject: { entityType: 'appraisal-session', id: sessionId }, detail: { studyId: session.studyId, instrumentId: session.instrumentId } });
  await evidenceEventBus.emit('appraisal.session.finalized', { studyId: record.researchStudyId, sessionId: session.id, instrumentId: session.instrumentId, reviewerId: session.reviewerId });
  return saved;
}