import {
  createBlankAppraisalSession,
  lockAppraisalSession,
  upsertAppraisalResponse,
  validateAppraisalSession,
  type AppraisalItemResponse,
  type AppraisalSession,
  type AppraisalSessionValidation,
} from './universalAppraisalService';
import type { ResearchAppraisalPayload } from './researchWorkflowService';
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

export async function createAppraisalFromResearch(payload: ResearchAppraisalPayload, reviewerId: string): Promise<AppraisalWorkflowRecord> {
  if (!reviewerId.trim()) throw new Error('reviewerId is required.');
  if (!payload.studyId.trim()) throw new Error('studyId is required.');
  if (!payload.instrumentId.trim()) throw new Error('instrumentId is required.');

  const session = createBlankAppraisalSession(payload.studyId, payload.instrumentId, reviewerId);
  const record: AppraisalWorkflowRecord = {
    session,
    researchStudyId: payload.studyId,
    sourceDocumentId: payload.document.id,
    instrumentId: payload.instrumentId,
    evidenceIds: payload.evidence.map(item => item.id),
  };
  const saved = appraisalWorkflowStore.save(record);
  await evidenceEventBus.emit('appraisal.session.created', {
    studyId: payload.studyId,
    sessionId: session.id,
    instrumentId: payload.instrumentId,
    reviewerId,
  });
  return saved;
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
