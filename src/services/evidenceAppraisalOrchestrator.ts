import {
  buildResearchAppraisalPayload,
  includeStudyAndCreateAppraisal,
  type WorkflowState,
} from './researchWorkflowService';
import {
  recordAppraisalResponse,
  finalizeAppraisal,
  validateAppraisal,
  getAppraisalWorkflowRecord,
  type AppraisalWorkflowRecord,
} from './appraisalWorkflowBridge';
import type { AppraisalItemResponse, AppraisalSessionValidation } from './universalAppraisalService';

export interface EvidenceAppraisalContext {
  workflow: WorkflowState;
  appraisal: AppraisalWorkflowRecord;
}

export class EvidenceAppraisalOrchestrator {
  public async start(workflow: WorkflowState, reviewerId: string): Promise<EvidenceAppraisalContext> {
    const payload = buildResearchAppraisalPayload(workflow);
    const updatedWorkflow = includeStudyAndCreateAppraisal(workflow, {
      reviewerId,
      instrumentId: payload.instrumentId,
    });
    const createdSession = updatedWorkflow.appraisalSessions.at(-1);
    if (!createdSession) throw new Error('Appraisal-sesjon ble ikke opprettet.');
    const appraisal = getAppraisalWorkflowRecord(createdSession.id);
    if (!appraisal) throw new Error(`Appraisal-workflow record mangler for session ${createdSession.id}.`);
    return { workflow: updatedWorkflow, appraisal };
  }

  public async saveResponse(context: EvidenceAppraisalContext, response: AppraisalItemResponse): Promise<EvidenceAppraisalContext> {
    const appraisal = await recordAppraisalResponse(context.appraisal.session.id, response);
    const workflow: WorkflowState = {
      ...context.workflow,
      appraisalSessions: context.workflow.appraisalSessions.map(session =>
        session.id === appraisal.session.id ? appraisal.session : session,
      ),
    };
    return { workflow, appraisal };
  }

  public validate(context: EvidenceAppraisalContext): AppraisalSessionValidation {
    return validateAppraisal(context.appraisal.session.id);
  }

  public async finalize(context: EvidenceAppraisalContext): Promise<EvidenceAppraisalContext> {
    const validation = this.validate(context);
    if (!validation.valid) throw new Error(`Kan ikke ferdigstille appraisal: ${validation.issues.join(' ')}`);
    const appraisal = await finalizeAppraisal(context.appraisal.session.id);
    const workflow: WorkflowState = {
      ...context.workflow,
      appraisalSessions: context.workflow.appraisalSessions.map(session =>
        session.id === appraisal.session.id ? appraisal.session : session,
      ),
    };
    return { workflow, appraisal };
  }

  public toJson(context: EvidenceAppraisalContext) {
    return { studyId: context.workflow.studyId, workflow: context.workflow, appraisal: context.appraisal };
  }
}

export const evidenceAppraisalOrchestrator = new EvidenceAppraisalOrchestrator();
