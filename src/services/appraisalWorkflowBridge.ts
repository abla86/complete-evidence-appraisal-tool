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

export function createAppraisalFromResearch(
  payload: ResearchAppraisalPayload,
  reviewerId: string,
): AppraisalWorkflowRecord {
  const session = createBlankAppraisalSession(
    payload.studyId,
    payload.instrumentId,
    reviewerId,
  );

  const record: AppraisalWorkflowRecord = {
    session,
    researchStudyId: payload.studyId,
    sourceDocumentId: payload.document.id,
    instrumentId: payload.instrumentId,
    evidenceIds: payload.evidence.map(item => item.id),
  };

  return appraisalWorkflowStore.save(record);
}

export function recordAppraisalResponse(
  sessionId: string,
  response: AppraisalItemResponse,
): AppraisalWorkflowRecord {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);

  const session = upsertAppraisalResponse(record.session, response);
  return appraisalWorkflowStore.save({ ...record, session });
}

export function validateAppraisal(
  sessionId: string,
): AppraisalSessionValidation {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  return validateAppraisalSession(record.session);
}

export function finalizeAppraisal(
  sessionId: string,
): AppraisalWorkflowRecord {
  const record = appraisalWorkflowStore.get(sessionId);
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);

  const session = lockAppraisalSession(record.session);
  return appraisalWorkflowStore.save({ ...record, session });
}
