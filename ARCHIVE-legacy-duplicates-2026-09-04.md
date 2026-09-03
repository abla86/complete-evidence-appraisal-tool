# Legacy duplicate review archive — 2026-09-04

This file preserves source that was removed from the active application because it duplicated the active PDF evidence implementation and was not referenced by the application.

## Removed: src/services/pdfEvidenceService.ts

```ts
import type { EvidenceExtraction } from '../domain/academicEvidence';
import type { PdfAnnotation } from './pdfAttachmentService';

export interface PdfEvidenceLinkInput {
  annotation: PdfAnnotation;
  sourceRecordId: string;
  extractedBy: string;
  linkedClaimIds?: string[];
}

export function annotationToEvidence({ annotation, sourceRecordId, extractedBy, linkedClaimIds = [] }: PdfEvidenceLinkInput): EvidenceExtraction {
  const kind: EvidenceExtraction['evidenceType'] = annotation.type === 'HIGHLIGHT' ? 'QUOTE' : 'CONCEPT';
  return {
    id: `evidence-${annotation.id}`,
    sourceRecordId,
    excerpt: annotation.text,
    location: { page: String(annotation.page) },
    evidenceType: kind,
    extractedBy,
    extractedAt: annotation.createdAt,
    linkedClaims: [...new Set(linkedClaimIds)],
    researcherVerified: false,
  };
}

export function verifyPdfEvidence(evidence: EvidenceExtraction, verifiedBy: string): EvidenceExtraction {
  return {
    ...evidence,
    extractedBy: evidence.extractedBy || verifiedBy,
    researcherVerified: true,
  };
}
```

## Removed: src/services/fullEvidencePipelineService.ts

```ts
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
```

## Reason for removal

- `pdfEvidenceBridge.ts` is the active PDF-to-evidence bridge used by `PdfEvidenceReader.tsx`.
- No active import of `pdfEvidenceService.ts` was found in repository search.
- `evidencePipelineService.ts` is the active pipeline used by `App.tsx`, `PipelineDashboard.tsx`, tests, and project export.
- No active import of `fullEvidencePipelineService.ts` was found in repository search.
- The removed source is retained here solely for later review/recovery; it is not part of the runtime application.

Do not reintroduce these files as parallel implementations. If their useful logic is needed, integrate it into the active bridge/pipeline modules.
