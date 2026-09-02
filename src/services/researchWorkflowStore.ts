import type { ResearchWorkflow } from './researchWorkflowCore';

export interface ResearchWorkflowStore {
  get(studyId: string): ResearchWorkflow | undefined;
  save(workflow: ResearchWorkflow): ResearchWorkflow;
  delete(studyId: string): boolean;
  list(): ResearchWorkflow[];
  clear(): void;
}

export class InMemoryResearchWorkflowStore implements ResearchWorkflowStore {
  private readonly workflows = new Map<string, ResearchWorkflow>();

  public get(studyId: string): ResearchWorkflow | undefined {
    return this.workflows.get(studyId);
  }

  public save(workflow: ResearchWorkflow): ResearchWorkflow {
    const existing = this.workflows.get(workflow.studyId);
    const now = new Date().toISOString();
    const next: ResearchWorkflow = {
      ...workflow,
      updatedAt: now,
      createdAt: existing?.createdAt ?? workflow.createdAt,
    };
    this.workflows.set(next.studyId, next);
    return next;
  }

  public delete(studyId: string): boolean {
    return this.workflows.delete(studyId);
  }

  public list(): ResearchWorkflow[] {
    return [...this.workflows.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  public clear(): void {
    this.workflows.clear();
  }
}

export const researchWorkflowStore =
  new InMemoryResearchWorkflowStore();
