export type ClaimStatus = 'UNVERIFIED' | 'SUPPORTED' | 'CONTRADICTED' | 'NEEDS_REVIEW';
export type EvidenceKind = 'QUOTE' | 'TABLE' | 'FIGURE' | 'STATISTIC' | 'CONCEPT' | 'RESEARCHER_DATA';

export interface EvidenceExtraction {
  id: string;
  sourceRecordId: string;
  excerpt: string;
  location?: { page?: string; section?: string; table?: string; figure?: string };
  evidenceType: EvidenceKind;
  extractedBy: string;
  extractedAt: string;
  linkedClaims: string[];
  researcherVerified: boolean;
}

export interface AcademicClaim {
  id: string;
  text: string;
  supportingEvidenceIds: string[];
  contradictoryEvidenceIds: string[];
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

export interface AcademicDocument {
  id: string;
  title: string;
  level: 'MASTER' | 'PHD' | 'ARTICLE' | 'PROTOCOL' | 'REPORT';
  researchQuestion?: string;
  body: string;
  claimIds: string[];
  updatedAt: string;
}

export interface AcademicIntegrityIssue {
  code:
    | 'UNSUPPORTED_CLAIM'
    | 'UNVERIFIED_SOURCE'
    | 'MISSING_EVIDENCE_LOCATION'
    | 'CONTRADICTED_CLAIM'
    | 'AI_REVIEW_REQUIRED';
  severity: 'ERROR' | 'WARNING';
  message: string;
  claimId?: string;
}

export interface AcademicIntegrityReport {
  canExport: boolean;
  issues: AcademicIntegrityIssue[];
  supportedClaims: number;
  unsupportedClaims: number;
}

export function evaluateAcademicIntegrity(
  claims: AcademicClaim[],
  evidence: EvidenceExtraction[],
  verifiedSourceIds: Set<string>,
): AcademicIntegrityReport {
  const issues: AcademicIntegrityIssue[] = [];

  for (const claim of claims) {
    if (claim.status === 'CONTRADICTED') {
      issues.push({
        code: 'CONTRADICTED_CLAIM',
        severity: 'ERROR',
        message: 'Påstanden har motstridende evidens og kan ikke eksporteres som etablert faktum.',
        claimId: claim.id,
      });
      continue;
    }

    const linked = evidence.filter(e => claim.supportingEvidenceIds.includes(e.id));
    if (linked.length === 0) {
      issues.push({
        code: 'UNSUPPORTED_CLAIM',
        severity: 'ERROR',
        message: 'Påstanden mangler lenket evidens.',
        claimId: claim.id,
      });
      continue;
    }

    const unverifiedSource = linked.some(e => !verifiedSourceIds.has(e.sourceRecordId));
    if (unverifiedSource) {
      issues.push({
        code: 'UNVERIFIED_SOURCE',
        severity: 'ERROR',
        message: 'Minst én evidenskilde er ikke bibliografisk verifisert.',
        claimId: claim.id,
      });
    }

    const missingLocation = linked.some(e => e.evidenceType !== 'RESEARCHER_DATA' && !e.location?.page && !e.location?.section && !e.location?.table && !e.location?.figure);
    if (missingLocation) {
      issues.push({
        code: 'MISSING_EVIDENCE_LOCATION',
        severity: 'WARNING',
        message: 'Evidensen mangler lokasjon (side, seksjon, tabell eller figur).',
        claimId: claim.id,
      });
    }
  }

  const supportedClaims = claims.filter(c => c.supportingEvidenceIds.length > 0 && c.status === 'SUPPORTED').length;
  const unsupportedClaims = claims.filter(c => !c.supportingEvidenceIds.length || c.status === 'UNVERIFIED').length;
  const blocking = issues.some(issue => issue.severity === 'ERROR');

  return {
    canExport: !blocking,
    issues,
    supportedClaims,
    unsupportedClaims,
  };
}
