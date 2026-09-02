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
