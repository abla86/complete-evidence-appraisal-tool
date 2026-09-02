import type { AcademicClaim, EvidenceExtraction } from '../domain/academicEvidence';
import type { ReferenceRecord } from './referenceHubService';
import { runCitationAudit, type CitationAuditReport } from './citationAuditService';

export interface CitationExportGateResult {
  allowed: boolean;
  audit: CitationAuditReport;
  blockingReasons: string[];
}

export function evaluateCitationExportGate(
  claims: AcademicClaim[],
  evidence: EvidenceExtraction[],
  references: ReferenceRecord[],
): CitationExportGateResult {
  const audit = runCitationAudit(claims, evidence, references);
  const blockingReasons = audit.results
    .filter(result => !result.ok)
    .flatMap(result => result.reasons.map(reason => `${result.claimId}: ${reason}`));

  return {
    allowed: audit.canExport,
    audit,
    blockingReasons: [...new Set(blockingReasons)],
  };
}
