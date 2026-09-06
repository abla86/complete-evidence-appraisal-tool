export type ProjectRole = 'OWNER' | 'REVIEWER' | 'ADJUDICATOR' | 'RESEARCHER' | 'VIEWER';

export type ProjectPermission =
  | 'PROJECT_MANAGE' | 'SOURCE_EDIT' | 'SCREEN' | 'APPRAISE'
  | 'ADJUDICATE' | 'SYNTHESIZE' | 'EXPORT';

const ROLE_PERMISSIONS: Record<ProjectRole, readonly ProjectPermission[]> = {
  OWNER: ['PROJECT_MANAGE','SOURCE_EDIT','SCREEN','APPRAISE','ADJUDICATE','SYNTHESIZE','EXPORT'],
  RESEARCHER: ['SOURCE_EDIT','SCREEN','APPRAISE','SYNTHESIZE','EXPORT'],
  REVIEWER: ['SCREEN','APPRAISE'],
  ADJUDICATOR: ['ADJUDICATE'],
  VIEWER: [],
};

export interface ProjectAccess {
  userId: string;
  projectId: string;
  roles: ProjectRole[];
  active: boolean;
}

export function hasProjectPermission(access: ProjectAccess, permission: ProjectPermission): boolean {
  if (!access.active || !access.userId.trim() || !access.projectId.trim()) return false;
  return access.roles.some(role => ROLE_PERMISSIONS[role].includes(permission));
}

export function requireProjectPermission(access: ProjectAccess, permission: ProjectPermission): void {
  if (!hasProjectPermission(access, permission)) {
    throw new Error(`PROJECT_PERMISSION_DENIED:${permission}`);
  }
}

export function canExportProject(access: ProjectAccess): boolean {
  return hasProjectPermission(access, 'EXPORT');
}


