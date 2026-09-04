import type { AppraisalSession, AppraisalItemResponse } from './universalAppraisalService';
import { loadAppraisalSessions } from './appraisalSessionStore';
import { calculateDisagreement, type ReviewComparison } from './dualReviewService';

export interface AppraisalSessionView {
  id: string;
  studyId: string;
  reviewerId: string;
  instrumentId: string;
  instrumentVersion: string;
  locked: boolean;
  responses: AppraisalItemResponse[];
  updatedAt: string;
}

export interface DualReviewSessionView {
  studyId: string;
  instrumentId: string;
  reviewerA: AppraisalSessionView;
  reviewerB: AppraisalSessionView;
  comparison: ReviewComparison;
}

function toView(session: AppraisalSession): AppraisalSessionView {
  return {
    id: session.id,
    studyId: session.studyId,
    reviewerId: session.reviewerId,
    instrumentId: session.instrumentId,
    instrumentVersion: session.instrumentVersion,
    locked: session.locked,
    responses: session.responses.map(response => ({
      ...response,
      evidence: response.evidence ? { ...response.evidence } : undefined,
    })),
    updatedAt: session.updatedAt,
  };
}

function toReview(session: AppraisalSession) {
  return {
    id: session.id,
    appraisalId: session.id,
    studyId: session.studyId,
    instrumentId: session.instrumentId,
    reviewerId: session.reviewerId,
    status: session.locked ? ('completed' as const) : ('inProgress' as const),
    responses: Object.fromEntries(session.responses.map(item => [String(item.itemId), item.answer])),
    comments: session.responses
      .filter(item => item.rationale.trim())
      .map(item => ({ itemId: String(item.itemId), comment: item.rationale })),
  };
}

export function getDualReviewSessionView(
  studyId: string,
  instrumentId: string,
  reviewerIds?: [string, string],
): DualReviewSessionView | null {
  const sessions = loadAppraisalSessions().filter(
    session => session.studyId === studyId && session.instrumentId === instrumentId,
  );

  const uniqueReviewers = new Set(sessions.map(session => session.reviewerId));
  if (uniqueReviewers.size < 2) return null;
  if (sessions.some(session => !session.locked)) return null;
  if (sessions.length < 2) return null;

  const selected = reviewerIds
    ? reviewerIds
      .map(id => sessions.find(session => session.reviewerId === id))
      .filter((session): session is AppraisalSession => Boolean(session))
    : sessions.slice(0, 2);

  if (selected.length < 2) return null;

  const comparison = calculateDisagreement([toReview(selected[0]), toReview(selected[1])]);
  return {
    studyId,
    instrumentId,
    reviewerA: toView(selected[0]),
    reviewerB: toView(selected[1]),
    comparison,
  };
}
