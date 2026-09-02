import type { AppraisalSession } from '../services/universalAppraisalService';

const KEY = 'evidence-appraisal-sessions-v1';

export function loadAppraisalSessions(): AppraisalSession[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as AppraisalSession[] : [];
  } catch {
    return [];
  }
}

export function saveAppraisalSessions(sessions: AppraisalSession[]): void {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function upsertAppraisalSession(session: AppraisalSession): AppraisalSession[] {
  const current = loadAppraisalSessions();
  const index = current.findIndex(item => item.id === session.id);
  const next = [...current];
  if (index >= 0) next[index] = session;
  else next.push(session);
  saveAppraisalSessions(next);
  return next;
}

export function getAppraisalSessionsForStudy(studyId: string): AppraisalSession[] {
  return loadAppraisalSessions().filter(item => item.studyId === studyId);
}
