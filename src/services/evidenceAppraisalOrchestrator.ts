import {
  buildResearchAppraisalPayload,
  includeStudyAndCreateAppraisal,
  type WorkflowState,
} from './researchWorkflowService';
import {
  createAppraisalFromResearch,
  finalizeAppraisal,
  recordAppraisalResponse,
  validateAppraisal,
  type AppraisalWorkflowRecord,
} from './appraisalWorkflowBridge';
import type {
  AppraisalItemResponse,
  AppraisalSessionValidation,
} from './universalAppraisalService';

export interface EvidenceAppraisalContext {
  workflow: WorkflowState;
  appraisal?: AppraisalWorkflowRecord;
}

export class EvidenceAppraisalOrchestrator {
  public async start(
    workflow: WorkflowState,
    reviewerId: string,
  ): Promise<EvidenceAppraisalContext> {
    const payload = buildResearchAppraisalPayload(workflow);
    const updatedWorkflow = includeStudyAndCreateAppraisal(
      workflow,
      { reviewerId, instrumentId: payload.instrumentId },
    );
    const appraisal = await createAppraisalFromResearch(payload, reviewerId);
    return { workflow: updatedWorkflow, appraisal };
  }

  public async saveResponse(
    context: EvidenceAppraisalContext,
    response: AppraisalItemResponse,
  ): Promise<EvidenceAppraisalContext> {
    if (!context.appraisal) throw new Error('No appraisal session exists for this workflow.');

    const appraisal = await recordAppraisalResponse(
      context.appraisal.session.id,
      response,
    );

    return {
      ...context,
      workflow: {
        ...context.workflow,
        appraisalSessions: context.workflow.appraisalSessions.map(session =>
          session.id === appraisal.session.id ? appraisal.session : session,
        ),
      },
      appraisal,
    };
  }

  public validate(context: EvidenceAppraisalContext): AppraisalSessionValidation {
    if (!context.appraisal) throw new Error('No appraisal session exists for this workflow.');
    return validateAppraisal(context.appraisal.session.id);
  }

  public async finalize(
    context: EvidenceAppraisalContext,
  ): Promise<EvidenceAppraisalContext> {
    if (!context.appraisal) throw new Error('No appraisal session exists for this workflow.');

    const validation = this.validate(context);
    if (!validation.valid) {
      throw new Error(`Kan ikke ferdigstille appraisal: ${validation.issues.join(' ')}`);
    }

    const appraisal = await finalizeAppraisal(context.appraisal.session.id);

    return {
      ...context,
      workflow: {
        ...context.workflow,
        appraisalSessions: context.workflow.appraisalSessions.map(session =>
          session.id === appraisal.session.id ? appraisal.session : session,
        ),
      },
      appraisal,
    };
  }

  public toJson(context: EvidenceAppraisalContext) {
    return {
      studyId: context.workflow.studyId,
      workflow: context.workflow,
      appraisal: context.appraisal,
    };
  }
}

export const evidenceAppraisalOrchestrator = new EvidenceAppraisalOrchestrator();
