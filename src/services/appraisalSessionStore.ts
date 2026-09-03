import type { AppraisalSession } from './universalAppraisalService';
import type { StoredQualityAssessment } from './qualityAssessmentService';

const STORAGE_KEY = 'evidence-appraisal-appraisal-sessions-v1';
const QUALITY_KEY = 'evidence-appraisal-quality-assessments-v1';

function read(): AppraisalSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && typeof item.id === 'string') as AppraisalSession[];
  } catch {
    return [];
  }
}

function write(sessions: AppraisalSession[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function readQuality(): StoredQualityAssessment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(QUALITY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && typeof item.id === 'string') as StoredQualityAssessment[];
  } catch {
    return [];
  }
}

function writeQuality(items: StoredQualityAssessment[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(QUALITY_KEY, JSON.stringify(items));
}

export function loadAppraisalSessions(): AppraisalSession[] {
  return read();
}

export function upsertAppraisalSession(session: AppraisalSession): AppraisalSession[] {
  if (!session.id.trim()) throw new Error('Appraisal-session ID is required.');
  if (!session.studyId.trim()) throw new Error('studyId is required.');
  if (!session.instrumentId.trim()) throw new Error('instrumentId is required.');
  if (!session.reviewerId.trim()) throw new Error('reviewerId is required.');

  const sessions = read();
  const index = sessions.findIndex(item => item.id === session.id);
  const next = [...sessions];
  if (index >= 0) next[index] = session;
  else next.unshift(session);
  write(next);
  return next;
}

export function getLatestAppraisalSession(studyId: string, instrumentId: string, reviewerId?: string): AppraisalSession | null {
  const normalizedReviewer = reviewerId?.trim();
  return read()
    .filter(item => item.studyId === studyId && item.instrumentId === instrumentId && (!normalizedReviewer || item.reviewerId === normalizedReviewer))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null;
}

export function getAppraisalSessionById(sessionId: string): AppraisalSession | null {
  return read().find(item => item.id === sessionId) ?? null;
}

export function loadQualityAssessments(): StoredQualityAssessment[] {
  return readQuality();
}

export function getQualityAssessmentsForSession(sessionId: string): StoredQualityAssessment[] {
  return readQuality().filter(item => item.appraisalSessionId === sessionId);
}

export function upsertQualityAssessment(item: StoredQualityAssessment): StoredQualityAssessment[] {
  if (!item.id.trim()) throw new Error('Quality assessment ID is required.');
  if (!item.appraisalSessionId.trim()) throw new Error('Quality assessment appraisalSessionId is required.');
  if (!item.evidenceId.trim()) throw new Error('Quality assessment evidenceId is required.');
  if (!item.reviewerId.trim()) throw new Error('Quality assessment reviewerId is required.');

  const items = readQuality();
  const index = items.findIndex(existing => existing.id === item.id);
  const next = [...items];
  if (index >= 0) next[index] = item;
  else next.unshift(item);
  writeQuality(next);
  return next;
}
