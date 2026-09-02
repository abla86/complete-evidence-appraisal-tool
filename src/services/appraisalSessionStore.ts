import type { AppraisalSession } from './universalAppraisalService';
import type { StoredQualityAssessment } from './qualityAssessmentService';

const STORAGE_KEY = 'evidence-appraisal-appraisal-sessions-v1';
const QUALITY_KEY = 'evidence-appraisal-quality-assessments-v1';

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

function readQuality(): StoredQualityAssessment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUALITY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQuality(items: StoredQualityAssessment[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(QUALITY_KEY, JSON.stringify(items));
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

export function loadQualityAssessments(): StoredQualityAssessment[] {
  return readQuality();
}

export function getQualityAssessmentsForSession(sessionId: string): StoredQualityAssessment[] {
  return readQuality().filter(item => item.appraisalSessionId === sessionId);
}

export function upsertQualityAssessment(item: StoredQualityAssessment): StoredQualityAssessment[] {
  const items = readQuality();
  const index = items.findIndex(existing => existing.id === item.id);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
  writeQuality(items);
  return items;
}
