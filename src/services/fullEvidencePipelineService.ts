/**
 * Operational orchestration boundary for the Evidence Appraisal Tool.
 * No appraisal logic is invented here; this service connects the existing
 * domain modules into one traceable research record.
 */
import type { ReferenceRecord } from './referenceHubService';
import type { AcademicClaim, EvidenceExtraction } from '../domain/academicEvidence';
import { runCitationAudit } from './citationAuditService';
import { calculatePrismaCounts } from './prismaService';

export interface EvidencePipelineRecord {
  referenceId: string;
  sourceRecordId?: string;
  evidenceIds: string[];
  claimIds: string[];
  appraisalStudyId?: string;
  screeningState?: string;
  picoIds?: string[];
}

export interface EvidencePipelineReport {
  referenceCount: number;
  evidenceCount: number;
  claimCount: number;
  citationAuditAllowed: boolean;
  citationAuditBlockingReasons: string[];
  orphanEvidenceIds: string[];
  unsupportedClaimIds: string[];
  prisma: unknown;
}

export function buildEvidencePipelineReport(
  records: ReferenceRecord[],
  evidence: EvidenceExtraction[],
  claims: AcademicClaim[],
): EvidencePipelineReport {
  const audit = runCitationAudit(claims, evidence, records);
  const evidenceIds = new Set(evidence.map(item => item.id));
  const orphanEvidenceIds = evidence
    .filter(item => !item.linkedClaims.some(id => claims.some(claim => claim.id === id)))
    .map(item => item.id);
  const unsupportedClaimIds = claims
    .filter(claim => claim.status !== 'SUPPORTED')
    .map(claim => claim.id);

  let prisma: unknown = null;
  try {
    prisma = calculatePrismaCounts([]);
  } catch {
    prisma = null;
  }

  return {
    referenceCount: records.length,
    evidenceCount: evidenceIds.size,
    claimCount: claims.length,
    citationAuditAllowed: audit.canExport,
    citationAuditBlockingReasons: audit.results
      .filter(result => !result.ok)
      .flatMap(result => result.reasons),
    orphanEvidenceIds,
    unsupportedClaimIds,
    prisma,
  };
}
