import type { AppraisalSession } from './universalAppraisalService';

const STORAGE_KEY = 'evidence-appraisal-appraisal-sessions-v1';

function read(): AppraisalSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(sessions: AppraisalSession[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function loadAppraisalSessions(): AppraisalSession[] {
  return read();
}

export function upsertAppraisalSession(session: AppraisalSession): AppraisalSession[] {
  const sessions = read();
  const index = sessions.findIndex(item => item.id === session.id);
  if (index >= 0) sessions[index] = session;
  else sessions.unshift(session);
  write(sessions);
  return sessions;
}

export function getLatestAppraisalSession(studyId: string, instrumentId: string): AppraisalSession | null {
  return read().find(item => item.studyId === studyId && item.instrumentId === instrumentId) ?? null;
}
