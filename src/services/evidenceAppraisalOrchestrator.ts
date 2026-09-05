import {
  buildResearchAppraisalPayload,
  type WorkflowState,
} from './researchWorkflowService';
import {
  createAndAttachAppraisal,
  recordAppraisalResponse,
  finalizeAppraisal,
  validateAppraisal,
  type AppraisalWorkflowRecord,
} from './appraisalWorkflowBridge';
import { researchWorkflowStore } from './researchWorkflowStore';
import type {
  AppraisalItemResponse,
  AppraisalSessionValidation,
} from './universalAppraisalService';

export interface EvidenceAppraisalContext {
  workflow: WorkflowState;
  appraisal: AppraisalWorkflowRecord;
}

export class EvidenceAppraisalOrchestrator {
  public async start(
    workflow: WorkflowState,
    reviewerId: string,
  ): Promise<EvidenceAppraisalContext> {
    const normalizedReviewerId = reviewerId.trim();
    if (!normalizedReviewerId) throw new Error('reviewerId is required.');

    // The orchestrator is also a supported programmatic entry point. Ensure
    // the supplied workflow is visible to the canonical store before payload
    // validation and appraisal attachment.
    const canonicalWorkflow = researchWorkflowStore.get(workflow.studyId);
    if (!canonicalWorkflow) {
      researchWorkflowStore.save(workflow);
    }

    const payload = buildResearchAppraisalPayload(workflow);

    const attached = await createAndAttachAppraisal(
      payload,
      normalizedReviewerId,
      session => {
        const current = researchWorkflowStore.get(workflow.studyId) ?? workflow;
        return researchWorkflowStore.save({
          ...current,
          appraisalSessions: current.appraisalSessions.some(item => item.id === session.id)
            ? current.appraisalSessions.map(item => item.id === session.id ? session : item)
            : [...current.appraisalSessions, session],
        });
      },
    );

    return {
      workflow: attached.workflow,
      appraisal: attached.record,
    };
  }

  public async saveResponse(
    context: EvidenceAppraisalContext,
    response: AppraisalItemResponse,
  ): Promise<EvidenceAppraisalContext> {
    const appraisal = await recordAppraisalResponse(
      context.appraisal.session.id,
      response,
    );

    const workflow = {
      ...context.workflow,
      appraisalSessions: context.workflow.appraisalSessions.some(
        session => session.id === appraisal.session.id,
      )
        ? context.workflow.appraisalSessions.map(session =>
            session.id === appraisal.session.id ? appraisal.session : session,
          )
        : [...context.workflow.appraisalSessions, appraisal.session],
    };

    return { workflow, appraisal };
  }

  public validate(
    context: EvidenceAppraisalContext,
  ): AppraisalSessionValidation {
    return validateAppraisal(context.appraisal.session.id);
  }

  public async finalize(
    context: EvidenceAppraisalContext,
  ): Promise<EvidenceAppraisalContext> {
    const validation = this.validate(context);
    if (!validation.valid) {
      throw new Error(
        `Kan ikke ferdigstille appraisal: ${validation.issues.join(' ')}`,
      );
    }

    const appraisal = await finalizeAppraisal(
      context.appraisal.session.id,
    );

    const workflow: WorkflowState = {
      ...context.workflow,
      appraisalSessions: context.workflow.appraisalSessions.map(session =>
        session.id === appraisal.session.id ? appraisal.session : session,
      ),
    };

    return { workflow, appraisal };
  }

  public toJson(context: EvidenceAppraisalContext) {
    return {
      studyId: context.workflow.studyId,
      workflow: context.workflow,
      appraisal: context.appraisal,
    };
  }
}

export const evidenceAppraisalOrchestrator =
  new EvidenceAppraisalOrchestrator();
