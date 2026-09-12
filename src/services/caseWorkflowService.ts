export type CaseStatus = 'NEW' | 'OPEN' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface CaseStage {
  id: string;
  name: string;
  order: number;
  slaHours: number;
}

export interface WorkflowCase {
  id: string;
  title: string;
  type: string;
  status: CaseStatus;
  priority: CasePriority;
  stageId: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  description: string;
  tags: string[];
  audit: WorkflowAuditEntry[];
}

export interface WorkflowAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  from?: string;
  to?: string;
  note?: string;
}

export const DEFAULT_STAGES: CaseStage[] = [
  { id: 'intake', name: 'Intake', order: 1, slaHours: 24 },
  { id: 'triage', name: 'Triage', order: 2, slaHours: 24 },
  { id: 'assessment', name: 'Assessment', order: 3, slaHours: 72 },
  { id: 'review', name: 'Peer review', order: 4, slaHours: 72 },
  { id: 'decision', name: 'Decision', order: 5, slaHours: 24 },
  { id: 'closure', name: 'Closure', order: 6, slaHours: 24 },
];

const STORAGE_KEY = 'evidence-suite.case-workflow.v1';

export function loadCases(): WorkflowCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkflowCase[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCases(cases: WorkflowCase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export function createCase(input: Pick<WorkflowCase, 'title' | 'type' | 'priority' | 'description'>): WorkflowCase {
  const now = new Date();
  const stage = DEFAULT_STAGES[0];
  const due = new Date(now.getTime() + stage.slaHours * 60 * 60 * 1000);
  const id = `CASE-${now.getTime().toString(36).toUpperCase()}`;
  return {
    ...input,
    id,
    status: 'NEW',
    stageId: stage.id,
    assignee: 'Unassigned',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    dueAt: due.toISOString(),
    tags: [],
    audit: [{ id: crypto.randomUUID(), timestamp: now.toISOString(), actor: 'system', action: 'CASE_CREATED', to: stage.name }],
  };
}

export function transitionCase(item: WorkflowCase, stage: CaseStage, actor: string): WorkflowCase {
  const now = new Date();
  const due = new Date(now.getTime() + stage.slaHours * 60 * 60 * 1000);
  const nextStatus: CaseStatus = stage.id === 'closure' ? 'CLOSED' : stage.id === 'decision' ? 'RESOLVED' : 'OPEN';
  return {
    ...item,
    stageId: stage.id,
    status: nextStatus,
    updatedAt: now.toISOString(),
    dueAt: due.toISOString(),
    audit: [...item.audit, { id: crypto.randomUUID(), timestamp: now.toISOString(), actor, action: 'STAGE_CHANGED', from: item.stageId, to: stage.id }],
  };
}

export function assignCase(item: WorkflowCase, assignee: string, actor: string): WorkflowCase {
  const now = new Date().toISOString();
  return {
    ...item,
    assignee,
    updatedAt: now,
    audit: [...item.audit, { id: crypto.randomUUID(), timestamp: now, actor, action: 'ASSIGNMENT_CHANGED', from: item.assignee, to: assignee }],
  };
}

export function addCaseNote(item: WorkflowCase, note: string, actor: string): WorkflowCase {
  const now = new Date().toISOString();
  return {
    ...item,
    updatedAt: now,
    audit: [...item.audit, { id: crypto.randomUUID(), timestamp: now, actor, action: 'NOTE_ADDED', note }],
  };
}
