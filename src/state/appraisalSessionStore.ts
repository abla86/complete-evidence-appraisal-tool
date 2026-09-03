import type { AppraisalSession } from '../services/universalAppraisalService';
import {
  loadAppraisalSessions as loadCanonicalAppraisalSessions,
  upsertAppraisalSession as upsertCanonicalAppraisalSession,
  getLatestAppraisalSession,
  getAppraisalSessionById,
} from '../services/appraisalSessionStore';

export function loadAppraisalSessions(): AppraisalSession[] {
  return loadCanonicalAppraisalSessions();
}

export function saveAppraisalSessions(sessions: AppraisalSession[]): void {
  for (const session of sessions) upsertCanonicalAppraisalSession(session);
}

export function upsertAppraisalSession(session: AppraisalSession): AppraisalSession[] {
  return upsertCanonicalAppraisalSession(session);
}

export function getAppraisalSessionsForStudy(studyId: string): AppraisalSession[] {
  return loadCanonicalAppraisalSessions().filter(item => item.studyId === studyId);
}

export { getLatestAppraisalSession, getAppraisalSessionById };
