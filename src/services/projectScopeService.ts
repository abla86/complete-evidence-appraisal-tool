import { requireProjectPermission, type ProjectAccess, type ProjectPermission } from './projectAccessService';

export interface ProjectScopedAction {
  projectId: string;
  actor: ProjectAccess;
}

export function requireProjectScope(action: ProjectScopedAction, permission: ProjectPermission): void {
  if (action.actor.projectId !== action.projectId) {
    throw new Error('PROJECT_SCOPE_DENIED: actor is not a member of this project.');
  }
  requireProjectPermission(action.actor, permission);
}

export function assertSameProject(projectId: string, referencedProjectId: string): void {
  if (!projectId.trim() || !referencedProjectId.trim() || projectId !== referencedProjectId) {
    throw new Error('PROJECT_SCOPE_DENIED: cross-project reference detected.');
  }
}


