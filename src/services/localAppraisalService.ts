import { createBlankAppraisalSession, decideAppraisalLaunch, lockAppraisalSession, type AppraisalSession } from './universalAppraisalService';
import { getLatestAppraisalSession, upsertAppraisalSession } from './appraisalSessionStore';
import { researchWorkflowStore } from './researchWorkflowStore';
import { appendAuditEntry } from './auditTrailService';
import type { ResearchEvidenceRecord } from '../types/workflow.contracts';

/**
 * Local-first appraisal lifecycle. Runs entirely in the browser (online or offline);
 * no server round-trip is required to start, answer, change instrument or lock an appraisal.
 */

export function startLocalAppraisal(studyId: string, reviewerId: string, instrumentId: string): AppraisalSession {
  const existing = getLatestAppraisalSession(studyId, instrumentId, reviewerId);
  if (existing) return existing;
  const session = createBlankAppraisalSession(studyId, instrumentId, reviewerId);
  upsertAppraisalSession(session);
  return session;
}

export function saveLocalAppraisal(session: AppraisalSession): AppraisalSession {
  upsertAppraisalSession(session);
  return session;
}

export interface InstrumentChangeResult { session: AppraisalSession; warnings: string[]; }

/** Changing instrument starts a fresh session: answers to one instrument are never reused for another. */
export function changeLocalInstrument(session: AppraisalSession, studyDesign: string, instrumentId: string, allowAlternative: boolean): InstrumentChangeResult {
  if (session.locked) throw new Error('Vurderingen er låst og kan ikke endres.');
  const decision = decideAppraisalLaunch(studyDesign, instrumentId, allowAlternative);
  if (!decision.allowed || !decision.instrument) throw new Error(decision.reason);
  const next = startLocalAppraisal(session.studyId, session.reviewerId, decision.instrument.id);
  return { session: next, warnings: decision.warnings };
}

export async function finalizeLocalAppraisal(session: AppraisalSession): Promise<AppraisalSession> {
  const locked = lockAppraisalSession(session);
  upsertAppraisalSession(locked);
  await appendAuditEntry({
    actor: { id: locked.reviewerId, role: 'reviewer' },
    action: 'appraisal.session.locked',
    subject: { entityType: 'appraisal-session', id: locked.id },
    detail: { studyId: locked.studyId, instrumentId: locked.instrumentId, instrumentVersion: locked.instrumentVersion, responseCount: locked.responses.length },
  });
  return locked;
}

/** Only evidence a named researcher has verified (with timestamp) may be linked to appraisal answers. */
export function loadVerifiedEvidence(studyId: string): ResearchEvidenceRecord[] {
  const evidence = researchWorkflowStore.get(studyId)?.research?.evidenceBundle.evidence ?? [];
  return evidence.filter(item => item.source === 'HUMAN_VERIFIED' && item.verifiedByResearcher === true && Boolean(item.verifiedBy?.trim()) && Boolean(item.verifiedAt?.trim()));
}
