import {
  createBlankAppraisalSession,
  getInstrumentOrNull,
  lockAppraisalSession,
  upsertAppraisalResponse,
  validateAppraisalSession,
  decideAppraisalLaunch,
  type AppraisalItemResponse,
  type AppraisalSession,
  type AppraisalSessionValidation,
} from './universalAppraisalService';
import type { ResearchAppraisalPayload, WorkflowState, ResearchEvidenceRecord } from '../types/workflow.contracts';
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
  public listByStudy(studyId: string): AppraisalWorkflowRecord[] { return [...this.records.values()].filter(record => record.researchStudyId === studyId); }
  public delete(sessionId: string): boolean { return this.records.delete(sessionId); }
  public listAll(): AppraisalWorkflowRecord[] { return [...this.records.values()]; }
}

export class LocalStorageAppraisalWorkflowStore extends InMemoryAppraisalWorkflowStore {
  private readonly storageKey = 'complete-evidence-appraisal-tool:appraisal-workflows:v1';

  constructor() {
    super();
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      const records = raw ? JSON.parse(raw) : [];
      if (Array.isArray(records)) {
        for (const record of records) {
          if (record?.session?.id && record?.researchStudyId) super.save(record as AppraisalWorkflowRecord);
        }
      }
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }

  override save(record: AppraisalWorkflowRecord): AppraisalWorkflowRecord { const saved = super.save(record); this.persist(); return saved; }
  override delete(sessionId: string): boolean { const deleted = super.delete(sessionId); if (deleted) this.persist(); return deleted; }
  private persist(): void { if (typeof localStorage !== 'undefined') localStorage.setItem(this.storageKey, JSON.stringify(this.listAll())); }
}

export const appraisalWorkflowStore: AppraisalWorkflowStore =
  typeof localStorage !== 'undefined' ? new LocalStorageAppraisalWorkflowStore() : new InMemoryAppraisalWorkflowStore();

function isHumanVerifiedEvidence(item: ResearchEvidenceRecord): boolean {
  return item.source === 'HUMAN_VERIFIED' && item.verifiedByResearcher === true && Boolean(item.verifiedBy?.trim()) && Boolean(item.verifiedAt?.trim());
}

function getCanonicalEvidence(workflow: WorkflowState): ResearchEvidenceRecord[] {
  return workflow.research?.evidenceBundle.evidence ?? [];
}

function hasIncludedScreeningDecision(workflow: WorkflowState): boolean {
  const latestByReviewer = new Map<string, WorkflowState['screening'][number]>();
  for (const record of workflow.screening) {
    if (record.studyId !== workflow.studyId) continue;
    latestByReviewer.set(record.reviewerId, record);
  }
  const latest = [...latestByReviewer.values()];
  return latest.length > 0 && latest.some(record => record.decision === 'INCLUDED') && latest.every(record => record.decision !== 'EXCLUDED');
}

function assertWorkflowReady(workflow: WorkflowState, instrumentId: string): void {
  if (!workflow.research) throw new Error('Research workflow is required before appraisal.');
  if (!hasIncludedScreeningDecision(workflow)) throw new Error('INCLUDED screening decision required before appraisal.');
  if (!workflow.research.classificationVerified) throw new Error('Human verification of document classification is required before appraisal.');

  const normalizedInstrumentId = instrumentId.trim();
  const selected = workflow.research.selectedInstrumentId?.trim();
  if (!selected || selected !== normalizedInstrumentId) throw new Error('Selected appraisal instrument is not consistent with workflow gating.');

  const recommendation = workflow.research.evidenceBundle.gating.instrumentRecommendation?.trim();
  if (!recommendation || recommendation !== normalizedInstrumentId) throw new Error('Appraisal instrument recommendation is missing or inconsistent.');

  const decision = decideAppraisalLaunch(workflow.studyDesign, normalizedInstrumentId);
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);
}

function assertPayload(payload: ResearchAppraisalPayload, reviewerId: string): void {
  const reviewer = reviewerId.trim();
  const study = payload.studyId.trim();
  const instrument = payload.instrumentId.trim();
  if (!reviewer) throw new Error('reviewerId is required.');
  if (!study) throw new Error('studyId is required.');
  if (!instrument) throw new Error('instrumentId is required.');
  if (!payload.document?.id?.trim()) throw new Error('document.id is required.');
  if (!Array.isArray(payload.evidence) || payload.evidence.length === 0) throw new Error('Appraisal payload contains no human-verified evidence.');

  const ids = payload.evidence.map(item => item.id.trim());
  if (ids.some(id => !id) || new Set(ids).size !== ids.length) throw new Error('Appraisal payload contains invalid or duplicate evidence ids.');
  if (payload.evidence.some(item => !isHumanVerifiedEvidence(item))) throw new Error('Appraisal payload contains evidence without complete human verification provenance.');
}

function assertCanonicalEvidence(workflow: WorkflowState, payload: ResearchAppraisalPayload): string[] {
  const canonicalById = new Map(getCanonicalEvidence(workflow).map(item => [item.id, item]));
  const payloadIds = payload.evidence.map(item => item.id.trim());
  const documentId = payload.document.id.trim();

  if (workflow.research?.document.id !== documentId) throw new Error('Appraisal payload document does not match the canonical research document.');

  for (const item of payload.evidence) {
    const source = canonicalById.get(item.id.trim());
    if (!source) throw new Error(`Evidence ${item.id} is not present in the canonical research workflow.`);
    if (source.studyId !== workflow.studyId || source.documentId !== documentId) throw new Error(`Evidence ${item.id} has invalid study or document provenance.`);
    if (!isHumanVerifiedEvidence(source)) throw new Error(`Evidence ${item.id} is no longer human verified in the canonical research workflow.`);
  }
  return payloadIds;
}

function assertRecordEvidence(record: AppraisalWorkflowRecord, workflow: WorkflowState): void {
  const canonicalById = new Map(getCanonicalEvidence(workflow).map(item => [item.id, item]));
  for (const evidenceId of record.evidenceIds) {
    const source = canonicalById.get(evidenceId);
    if (!source || !isHumanVerifiedEvidence(source)) throw new Error(`Appraisal session references evidence that is missing or no longer human verified: ${evidenceId}`);
  }
}

function buildRecord(payload: ResearchAppraisalPayload, session: AppraisalSession, evidenceIds: string[]): AppraisalWorkflowRecord {
  return { session, researchStudyId: payload.studyId.trim(), sourceDocumentId: payload.document.id.trim(), instrumentId: session.instrumentId, evidenceIds: [...evidenceIds] };
}

function findActiveSession(payload: ResearchAppraisalPayload, reviewerId: string) {
  const study = payload.studyId.trim();
  const instrument = payload.instrumentId.trim();
  const reviewer = reviewerId.trim();
  return appraisalWorkflowStore.listByStudy(study).find(record => record.instrumentId === instrument && record.session.instrumentId === instrument && record.session.reviewerId === reviewer && !record.session.locked);
}

function syncToResearchWorkflow(session: AppraisalSession): WorkflowState {
  const workflow = researchWorkflowStore.get(session.studyId);
  if (!workflow) throw new Error(`Research workflow not found: ${session.studyId}`);
  return researchWorkflowStore.updateAppraisalSession(session.studyId, session);
}

export async function createAppraisalFromResearch(payload: ResearchAppraisalPayload, reviewerId: string): Promise<AppraisalWorkflowRecord> {
  assertPayload(payload, reviewerId);
  const workflow = researchWorkflowStore.get(payload.studyId.trim());
  if (!workflow) throw new Error(`Research workflow not found: ${payload.studyId.trim()}`);
  assertWorkflowReady(workflow, payload.instrumentId.trim());
  const evidenceIds = assertCanonicalEvidence(workflow, payload);

  const existing = findActiveSession(payload, reviewerId);
  if (existing) { assertRecordEvidence(existing, workflow); return existing; }

  const session = createBlankAppraisalSession(payload.studyId.trim(), payload.instrumentId.trim(), reviewerId.trim());
  const record = buildRecord(payload, session, evidenceIds);
  syncToResearchWorkflow(session);
  appraisalWorkflowStore.save(record);

  await appendAuditEntry({ actor: { id: reviewerId.trim(), role: 'reviewer' }, action: 'appraisal.session.created', subject: { entityType: 'appraisal-session', id: session.id }, detail: { studyId: session.studyId, instrumentId: session.instrumentId, evidenceIds: record.evidenceIds } });
  await evidenceEventBus.emit('appraisal.session.created', { studyId: session.studyId, sessionId: session.id, instrumentId: session.instrumentId, reviewerId: session.reviewerId });
  return record;
}

export async function createAndAttachAppraisal(payload: ResearchAppraisalPayload, reviewerId: string, updateWorkflow: (session: AppraisalSession) => WorkflowState): Promise<{ record: AppraisalWorkflowRecord; workflow: WorkflowState }> {
  assertPayload(payload, reviewerId);
  const workflow = researchWorkflowStore.get(payload.studyId.trim());
  if (!workflow) throw new Error(`Research workflow not found: ${payload.studyId.trim()}`);
  assertWorkflowReady(workflow, payload.instrumentId.trim());
  const evidenceIds = assertCanonicalEvidence(workflow, payload);

  const existing = findActiveSession(payload, reviewerId);
  if (existing) { assertRecordEvidence(existing, workflow); return { record: existing, workflow: syncToResearchWorkflow(existing.session) }; }

  const session = createBlankAppraisalSession(payload.studyId.trim(), payload.instrumentId.trim(), reviewerId.trim());
  const record = buildRecord(payload, session, evidenceIds);
  const workflowAfterUpdate = updateWorkflow(session);
  const syncedWorkflow = researchWorkflowStore.save(workflowAfterUpdate);
  appraisalWorkflowStore.save(record);

  await appendAuditEntry({ actor: { id: reviewerId.trim(), role: 'reviewer' }, action: 'appraisal.session.created', subject: { entityType: 'appraisal-session', id: session.id }, detail: { studyId: session.studyId, instrumentId: session.instrumentId, evidenceIds: record.evidenceIds } });
  await evidenceEventBus.emit('appraisal.session.created', { studyId: session.studyId, sessionId: session.id, instrumentId: session.instrumentId, reviewerId: session.reviewerId });
  return { record, workflow: syncedWorkflow };
}

export function getAppraisalWorkflowRecord(sessionId: string) { return appraisalWorkflowStore.get(sessionId.trim()); }

export async function changeAppraisalInstrument(sessionId: string, instrumentId: string, reviewerId: string): Promise<AppraisalWorkflowRecord> {
  const record = appraisalWorkflowStore.get(sessionId.trim());
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  if (record.session.locked) throw new Error('Appraisal session is locked.');
  if (record.session.reviewerId !== reviewerId.trim()) throw new Error('Reviewer stemmer ikke med appraisal-sesjonen.');

  const workflow = researchWorkflowStore.get(record.session.studyId);
  if (!workflow) throw new Error(`Research workflow not found: ${record.session.studyId}`);
  assertRecordEvidence(record, workflow);

  const instrument = getInstrumentOrNull(instrumentId);
  if (!instrument) throw new Error(`Ukjent appraisal-instrument: ${instrumentId}`);
  const decision = decideAppraisalLaunch(workflow.studyDesign, instrument.id);
  if (!decision.allowed) throw new Error(decision.reason);

  const session = { ...record.session, instrumentId: instrument.id, instrumentVersion: instrument.version, responses: [], overallJudgement: undefined, overallRationale: undefined, updatedAt: new Date().toISOString() };
  const updatedRecord = { ...record, instrumentId: instrument.id, session };
  appraisalWorkflowStore.save(updatedRecord);
  syncToResearchWorkflow(session);

  await appendAuditEntry({ actor: { id: reviewerId.trim(), role: 'reviewer' }, action: 'appraisal.instrument.changed', subject: { entityType: 'appraisal-session', id: record.session.id }, detail: { previousInstrumentId: record.session.instrumentId, instrumentId: instrument.id, responsesReset: true } });
  await evidenceEventBus.emit('appraisal.instrument.changed', { studyId: session.studyId, sessionId: session.id, instrumentId: session.instrumentId, reviewerId: session.reviewerId });
  return updatedRecord;
}

export async function recordAppraisalResponse(sessionId: string, response: AppraisalItemResponse, reviewerId?: string): Promise<AppraisalWorkflowRecord> {
  const record = appraisalWorkflowStore.get(sessionId.trim());
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  if (record.session.locked) throw new Error('Appraisal session is locked.');
  if (reviewerId !== undefined && reviewerId.trim() !== record.session.reviewerId) throw new Error('Reviewer stemmer ikke med appraisal-sesjonen.');

  const workflow = researchWorkflowStore.get(record.session.studyId);
  if (!workflow) throw new Error(`Research workflow not found: ${record.session.studyId}`);
  assertRecordEvidence(record, workflow);

  const itemId = String(response?.itemId ?? '').trim();
  if (!itemId || response?.rationale === undefined) throw new Error('itemId and rationale are required.');
  const instrument = getInstrumentOrNull(record.session.instrumentId);
  if (!instrument || (instrument.questions ?? []).every(q => String(q.id) !== itemId)) throw new Error('itemId finnes ikke i valgt appraisal-instrument.');

  if (response.evidence?.sourceId) {
    const sourceId = response.evidence.sourceId.trim();
    if (!record.evidenceIds.includes(sourceId)) throw new Error(`Evidence reference ${sourceId} is not attached to this appraisal session.`);
    const source = getCanonicalEvidence(workflow).find(item => item.id === sourceId);
    if (!source || !isHumanVerifiedEvidence(source)) throw new Error(`Evidence reference ${sourceId} is missing or no longer human verified.`);
  } else if (response.evidence) {
    throw new Error('Appraisal evidence must reference a canonical sourceId.');
  }

  const session = upsertAppraisalResponse(record.session, {
    ...response,
    itemId,
    rationale: String(response.rationale).trim(),
    evidence: response.evidence ? { ...response.evidence, sourceId: response.evidence.sourceId?.trim() } : undefined,
  });
  syncToResearchWorkflow(session);
  const saved = appraisalWorkflowStore.save({ ...record, session });

  await appendAuditEntry({ actor: { id: session.reviewerId, role: 'reviewer' }, action: 'appraisal.response.updated', subject: { entityType: 'appraisal-session', id: sessionId }, detail: { itemId, answer: response.answer, evidenceSourceId: response.evidence?.sourceId } });
  return saved;
}

export function validateAppraisal(sessionId: string): AppraisalSessionValidation {
  const record = appraisalWorkflowStore.get(sessionId.trim());
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  return validateAppraisalSession(record.session);
}

export async function finalizeAppraisal(sessionId: string): Promise<AppraisalWorkflowRecord> {
  const record = appraisalWorkflowStore.get(sessionId.trim());
  if (!record) throw new Error(`Appraisal session not found: ${sessionId}`);
  if (record.session.locked) return record;

  const workflow = researchWorkflowStore.get(record.researchStudyId);
  if (!workflow) throw new Error(`Research workflow not found: ${record.researchStudyId}`);
  assertRecordEvidence(record, workflow);

  const validation = validateAppraisalSession(record.session);
  if (!validation.valid) throw new Error(`Kan ikke ferdigstille appraisal: ${validation.issues.join(' ')}`);

  const session = lockAppraisalSession(record.session);
  syncToResearchWorkflow(session);
  const saved = appraisalWorkflowStore.save({ ...record, session });

  await appendAuditEntry({ actor: { id: session.reviewerId, role: 'reviewer' }, action: 'appraisal.session.locked', subject: { entityType: 'appraisal-session', id: session.id }, detail: { studyId: session.studyId, instrumentId: session.instrumentId, responseCount: session.responses.length, evidenceIds: record.evidenceIds } });
  await evidenceEventBus.emit('appraisal.session.locked', { studyId: session.studyId, sessionId: session.id, instrumentId: session.instrumentId, reviewerId: session.reviewerId });
  await evidenceEventBus.emit('appraisal.session.finalized', { studyId: session.studyId, sessionId: session.id, instrumentId: session.instrumentId, reviewerId: session.reviewerId });
  return saved;
}
