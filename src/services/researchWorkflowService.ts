import type { AppraisalSession } from './universalAppraisalService';
import { createBlankAppraisalSession, decideAppraisalLaunch } from './universalAppraisalService';
import { EvidenceFoundation, type EvidenceModule } from './evidenceSystemFoundation';

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
  events: ReturnType<EvidenceFoundation['state']['events']>;
}

export function includeStudyAndCreateAppraisal(
  state: WorkflowState,
  input: { reviewerId: string; instrumentId: string },
  foundation = new EvidenceFoundation(),
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
  foundation.state.set(
    `screening:${state.studyId}`,
    screening,
    input.reviewerId,
    'Studie inkludert etter screening og klargjort for appraisal',
    'screening',
  );
  foundation.state.set(
    `appraisal:${session.id}`,
    session,
    input.reviewerId,
    'Opprettet appraisal-sesjon fra inkludert studie',
    'appraisal',
  );

  return {
    ...state,
    screening,
    appraisalSessions: [...state.appraisalSessions, session],
    events: foundation.state.events(),
  };
}

export async function handoffWorkflow(
  foundation: EvidenceFoundation,
  fromModule: EvidenceModule,
  toModule: EvidenceModule,
  fromRole: string,
  toRole: string,
  studyId: string,
  reason: string,
): Promise<void> {
  await foundation.handoff({
    fromModule,
    toModule,
    fromRole,
    toRole,
    context: { studyId },
    reason,
    correlationId: foundation.state.snapshot().correlationId,
  });
}
