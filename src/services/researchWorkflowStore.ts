import type { AppraisalSession } from './universalAppraisalService';
import type { WorkflowState } from './researchWorkflowService';

export interface ResearchWorkflowStore {
  get(studyId: string, projectId?: string): WorkflowState | undefined;
  save(workflow: WorkflowState): WorkflowState;
  updateAppraisalSession(studyId: string, session: AppraisalSession): WorkflowState;
  delete(studyId: string): boolean;
  list(): WorkflowState[];
  clear(): void;
}

export class InMemoryResearchWorkflowStore implements ResearchWorkflowStore {
  private readonly workflows = new Map<string, WorkflowState>();

  public get(studyId: string, projectId?: string): WorkflowState | undefined {
    const workflow = this.workflows.get(studyId);
    if (!workflow) return undefined;
    if (projectId && studyId !== workflow.studyId) return undefined;
    return workflow;
  }

  public save(workflow: WorkflowState): WorkflowState {
    if (!workflow.studyId.trim()) throw new Error('studyId is required.');
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

export class LocalStorageResearchWorkflowStore extends InMemoryResearchWorkflowStore {
  private readonly storageKey = 'complete-evidence-appraisal-tool:research-workflows:v1';

  constructor() {
    super();
    this.restore();
  }

  override save(workflow: WorkflowState): WorkflowState {
    const saved = super.save(workflow);
    this.persist();
    return saved;
  }

  override delete(studyId: string): boolean {
    const deleted = super.delete(studyId);
    if (deleted) this.persist();
    return deleted;
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  private persist(): void {
    if (typeof localStorage === 'undefined' || !LOCAL_RESEARCH_PERSISTENCE_ENABLED) return;
    localStorage.setItem(this.storageKey, JSON.stringify(this.list()));
  }

  private restore(): void {
    if (typeof localStorage === 'undefined' || !LOCAL_RESEARCH_PERSISTENCE_ENABLED) return;
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;
    try {
      const workflows = JSON.parse(raw) as WorkflowState[];
      if (!Array.isArray(workflows)) return;
      for (const workflow of workflows) {
        if (workflow && typeof workflow.studyId === 'string' && workflow.studyId.trim()) super.save(workflow);
      }
    } catch {
      localStorage.removeItem(this.storageKey);
    }
  }
}

const LOCAL_RESEARCH_PERSISTENCE_ENABLED =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_ENABLE_LOCAL_RESEARCH_PERSISTENCE === 'true';

export const researchWorkflowStore: ResearchWorkflowStore =
  LOCAL_RESEARCH_PERSISTENCE_ENABLED && typeof localStorage !== 'undefined'
    ? new LocalStorageResearchWorkflowStore()
    : new InMemoryResearchWorkflowStore();


