import type { AppraisalSession } from './universalAppraisalService';
import { createBlankAppraisalSession, decideAppraisalLaunch } from './universalAppraisalService';
import { appendProjectAuditEvent, type ProjectAuditEvent } from './projectAuditService';

export type ScreeningDecision = 'PENDING' | 'INCLUDED' | 'EXCLUDED';

export interface ScreeningRecord {
  studyId: string;
  reviewerId: string;
  decision: ScreeningDecision;
  reason?: string;
  updatedAt: string;
}

export interface WorkflowState {
  studyId: string;
  studyDesign: string;
  screening: ScreeningRecord[];
  appraisalSessions: AppraisalSession[];
  events: ProjectAuditEvent[];
}

export function includeStudyAndCreateAppraisal(
  state: WorkflowState,
  input: { reviewerId: string; instrumentId: string },
): WorkflowState {
  const now = new Date().toISOString();
  const decision = decideAppraisalLaunch(state.studyDesign, input.instrumentId);
  if (!decision.allowed || !decision.instrument) {
    throw new Error(decision.reason);
  }

  const existingScreen = state.screening.find(item => item.reviewerId === input.reviewerId);
  const screening: ScreeningRecord[] = existingScreen
    ? state.screening.map(item => item === existingScreen ? { ...item, decision: 'INCLUDED', updatedAt: now } : item)
    : [...state.screening, { studyId: state.studyId, reviewerId: input.reviewerId, decision: 'INCLUDED', updatedAt: now }];

  const session = createBlankAppraisalSession(state.studyId, input.instrumentId, input.reviewerId);
  const event = appendProjectAuditEvent({
    actorId: input.reviewerId,
    action: 'SCREENING_INCLUDED_AND_APPRAISAL_CREATED',
    subjectType: 'study',
    subjectId: state.studyId,
    detail: { instrumentId: input.instrumentId, instrumentVersion: decision.instrument.version },
  });

  return { ...state, screening, appraisalSessions: [...state.appraisalSessions, session], events: [...state.events, event] };
}
