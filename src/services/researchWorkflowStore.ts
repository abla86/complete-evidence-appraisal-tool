import type { WorkflowState } from './researchWorkflowService';

export interface ResearchWorkflowStore {
  get(studyId: string): WorkflowState | undefined;
  save(workflow: WorkflowState): WorkflowState;
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
