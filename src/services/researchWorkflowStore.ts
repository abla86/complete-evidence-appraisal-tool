import type { AppraisalSession } from './universalAppraisalService';
import type { WorkflowState } from './researchWorkflowService';

export interface ResearchWorkflowStore {
  get(studyId: string): WorkflowState | undefined;
  save(workflow: WorkflowState): WorkflowState;
  updateAppraisalSession(studyId: string, session: AppraisalSession): WorkflowState;
  delete(studyId: string): boolean;
  list(): WorkflowState[];
  clear(): void;
}

export class InMemoryResearchWorkflowStore implements ResearchWorkflowStore {
  private readonly workflows = new Map<string, WorkflowState>();

  public get(studyId: string): WorkflowState | undefined {
    return this.workflows.get(studyId);
  }

  public save(workflow: WorkflowState): WorkflowState {
    this.workflows.set(workflow.studyId, workflow);
    return workflow;
  }

  public updateAppraisalSession(studyId: string, session: AppraisalSession): WorkflowState {
    const workflow = this.workflows.get(studyId);
    if (!workflow) throw new Error(`Research workflow not found: ${studyId}`);
    const exists = workflow.appraisalSessions.some(item => item.id === session.id);
    const appraisalSessions = exists
      ? workflow.appraisalSessions.map(item => item.id === session.id ? session : item)
      : [...workflow.appraisalSessions, session];
    return this.save({ ...workflow, appraisalSessions });
  }

  public delete(studyId: string): boolean {
    return this.workflows.delete(studyId);
  }

  public list(): WorkflowState[] {
    return [...this.workflows.values()];
  }

  public clear(): void {
    this.workflows.clear();
  }
}

export const researchWorkflowStore = new InMemoryResearchWorkflowStore();
