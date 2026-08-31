/**
 * Server and Client Side Role-Based Access Control (RBAC) Service
 * 
 * Enforces explicit role permissions:
 * - Admin: Full governance, audit exports, role assignments, system maintenance
 * - Research Lead: Project management, adjudications, consensus sign-offs, final locks
 * - Reviewer: Independent dual assessments, item rationale documentation, evidence quotation
 * - Adjudicator: Resolves reviewer discrepancies, enters consensus rationales
 */

export type UserRole = 'admin' | 'lead_reviewer' | 'reviewer' | 'adjudicator';

export interface UserSession {
  userId: string;
  name: string;
  role: UserRole;
  currentProjectId: string;
  authorizedProjectIds: string[];
}

export interface PermissionDefinition {
  canCreateProject: boolean;
  canEditProjectConfig: boolean;
  canImportDocuments: boolean;
  canClassifyStudy: boolean;
  canConductAppraisal: boolean;
  canConductDualReview: boolean;
  canAdjudicateDisagreements: boolean;
  canSignOffConsensus: boolean;
  canExportData: boolean;
  canPurgeData: boolean;
  canViewAuditTrail: boolean;
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, PermissionDefinition> = {
  admin: {
    canCreateProject: true,
    canEditProjectConfig: true,
    canImportDocuments: true,
    canClassifyStudy: true,
    canConductAppraisal: true,
    canConductDualReview: true,
    canAdjudicateDisagreements: true,
    canSignOffConsensus: true,
    canExportData: true,
    canPurgeData: true,
    canViewAuditTrail: true,
    canManageUsers: true
  },
  lead_reviewer: {
    canCreateProject: true,
    canEditProjectConfig: true,
    canImportDocuments: true,
    canClassifyStudy: true,
    canConductAppraisal: true,
    canConductDualReview: true,
    canAdjudicateDisagreements: true,
    canSignOffConsensus: true,
    canExportData: true,
    canPurgeData: false,
    canViewAuditTrail: true,
    canManageUsers: false
  },
  adjudicator: {
    canCreateProject: false,
    canEditProjectConfig: false,
    canImportDocuments: false,
    canClassifyStudy: true,
    canConductAppraisal: false,
    canConductDualReview: false,
    canAdjudicateDisagreements: true,
    canSignOffConsensus: true,
    canExportData: true,
    canPurgeData: false,
    canViewAuditTrail: true,
    canManageUsers: false
  },
  reviewer: {
    canCreateProject: false,
    canEditProjectConfig: false,
    canImportDocuments: true,
    canClassifyStudy: true,
    canConductAppraisal: true,
    canConductDualReview: true,
    canAdjudicateDisagreements: false,
    canSignOffConsensus: false,
    canExportData: true,
    canPurgeData: false,
    canViewAuditTrail: true,
    canManageUsers: false
  }
};

export class RbacService {
  public static getRoleDefinition(role: UserRole) {
    switch (role) {
      case 'admin':
        return {
          id: 'admin',
          name: 'Administrator',
          description: 'Full tilgang til prosjektkonfigurasjon, dataforvaltning, revisjon og brukerstyring.'
        };
      case 'lead_reviewer':
        return {
          id: 'lead_reviewer',
          name: 'Hovedgransker / Prosjektleder',
          description: 'Ansvarlig for protokoll, kvalitetskontroll, konsensus og godkjenning av syntese.'
        };
      case 'adjudicator':
        return {
          id: 'adjudicator',
          name: 'Tredjeperson / Mekler (Arbiter)',
          description: 'Autorisert til å avgjøre dissenser mellom Reviewer 1 og Reviewer 2 ved konsensusmøte.'
        };
      case 'reviewer':
      default:
        return {
          id: 'reviewer',
          name: 'Uavhengig gransker (Reviewer)',
          description: 'Gjennomfører blindet eller uavhengig kvalitetsvurdering og dokumenterer evidensgrunnlag.'
        };
    }
  }

  public static getAvailableRoles() {
    return (['lead_reviewer', 'reviewer', 'adjudicator', 'admin'] as UserRole[]).map(this.getRoleDefinition);
  }

  public static checkPermission(role: UserRole, permission: keyof PermissionDefinition): boolean {
    const perm = ROLE_PERMISSIONS[role];
    return perm ? !!perm[permission] : false;
  }

  public static authorizeProjectAccess(session: UserSession, targetProjectId: string): boolean {
    if (session.role === 'admin') return true;
    return session.authorizedProjectIds.includes(targetProjectId);
  }
}
