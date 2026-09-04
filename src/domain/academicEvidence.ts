export type ClaimStatus = 'UNVERIFIED' | 'SUPPORTED' | 'CONTRADICTED' | 'NEEDS_REVIEW';
export type EvidenceKind = 'QUOTE' | 'TABLE' | 'FIGURE' | 'STATISTIC' | 'CONCEPT' | 'RESEARCHER_DATA';

export interface EvidenceExtraction {
  id: string;
  sourceRecordId: string;
  sourceIdentifiers?: { doi?: string; pmid?: string; pmcid?: string; isbn?: string; issn?: string };
  excerpt: string;
  location?: { page?: string; section?: string; table?: string; figure?: string };
  evidenceType: EvidenceKind;
  extractedBy: string;
  extractedAt: string;
  linkedClaims: string[];
  researcherVerified: boolean;
  verificationNote?: string;
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
  code: 'UNSUPPORTED_CLAIM' | 'UNVERIFIED_SOURCE' | 'MISSING_EVIDENCE_LOCATION' | 'UNVERIFIED_EVIDENCE' | 'CONTRADICTED_CLAIM' | 'AI_REVIEW_REQUIRED';
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
    if (claim.status === 'SUPPORTED' && claim.contradictoryEvidenceIds.length > 0) {
      issues.push({ code: 'CONTRADICTED_CLAIM', severity: 'ERROR', message: 'En SUPPORTED-påstand har registrert motstridende evidens og må vurderes før eksport.', claimId: claim.id });
    }
    if (claim.status === 'CONTRADICTED') {
      issues.push({ code: 'CONTRADICTED_CLAIM', severity: 'ERROR', message: 'Påstanden har motstridende evidens og kan ikke eksporteres som etablert faktum.', claimId: claim.id });
      continue;
    }

    const linked = evidence.filter(e => claim.supportingEvidenceIds.includes(e.id));
    const missingBackLinks = linked.filter(e => !e.linkedClaims.includes(claim.id));
    if (missingBackLinks.length) {
      issues.push({ code: 'UNSUPPORTED_CLAIM', severity: 'ERROR', message: 'Evidens peker ikke tilbake til denne påstanden; claim/evidence-koblingen er inkonsistent.', claimId: claim.id });
    }
    const contradictoryDangling = claim.contradictoryEvidenceIds.filter(id => !evidence.some(e => e.id === id));
    if (contradictoryDangling.length) {
      issues.push({ code: 'CONTRADICTED_CLAIM', severity: 'ERROR', message: `Påstanden peker til ukjent motstridende evidens: ${contradictoryDangling.join(', ')}`, claimId: claim.id });
    }
    const dangling = claim.supportingEvidenceIds.filter(id => !evidence.some(e => e.id === id));
    if (dangling.length) issues.push({ code: 'UNSUPPORTED_CLAIM', severity: 'ERROR', message: `Påstanden peker til ukjent evidens: ${dangling.join(', ')}`, claimId: claim.id });
    if (linked.length === 0) {
      issues.push({ code: 'UNSUPPORTED_CLAIM', severity: 'ERROR', message: 'Påstanden mangler lenket evidens.', claimId: claim.id });
      continue;
    }

    if (linked.some(e => !verifiedSourceIds.has(e.sourceRecordId))) {
      issues.push({ code: 'UNVERIFIED_SOURCE', severity: 'ERROR', message: 'Minst én evidenskilde er ikke bibliografisk verifisert.', claimId: claim.id });
    }

    if (linked.some(e => e.evidenceType !== 'RESEARCHER_DATA' && !e.researcherVerified)) {
      issues.push({ code: 'UNVERIFIED_EVIDENCE', severity: 'ERROR', message: 'Minst én evidensenhet er ikke kontrollert og godkjent av forsker.', claimId: claim.id });
    }

    if (linked.some(e => e.evidenceType !== 'RESEARCHER_DATA' && !e.location?.page && !e.location?.section && !e.location?.table && !e.location?.figure)) {
      issues.push({ code: 'MISSING_EVIDENCE_LOCATION', severity: 'WARNING', message: 'Evidensen mangler lokasjon (side, seksjon, tabell eller figur).', claimId: claim.id });
    }
  }

  const supportedClaims = claims.filter(c => c.status === 'SUPPORTED' && c.supportingEvidenceIds.length > 0).length;
  const unsupportedClaims = claims.filter(c => c.status !== 'SUPPORTED').length;
  return { canExport: !issues.some(issue => issue.severity === 'ERROR'), issues, supportedClaims, unsupportedClaims };
}
