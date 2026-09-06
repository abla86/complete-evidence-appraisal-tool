import type { PdfAnnotation } from './pdfAttachmentService';
import type { EvidenceExtraction, EvidenceKind } from '../domain/academicEvidence';

export interface PdfEvidenceLink {
  id: string;
  annotationId: string;
  evidenceId: string;
  confidence: number;
  tag?: 'claim' | 'data' | 'methodology' | 'limitation';
  createdBy: string;
  createdAt: string;
}

export function annotationToEvidence(
  annotation: PdfAnnotation,
  sourceRecordId: string,
  createdBy: string,
  evidenceType: EvidenceKind = 'QUOTE',
): EvidenceExtraction {
  if (!annotation.text.trim()) throw new Error('Et PDF-highlight mÃ¥ inneholde tekst fÃ¸r det kan registreres som evidens.');

  return {
    id: `evidence_${annotation.id}`,
    sourceRecordId,
    excerpt: annotation.text.trim(),
    location: { page: String(annotation.page) },
    evidenceType,
    extractedBy: createdBy,
    extractedAt: new Date().toISOString(),
    linkedClaims: [],
    researcherVerified: false,
  };
}

export function linkAnnotationToEvidence(
  annotation: PdfAnnotation,
  evidence: EvidenceExtraction,
  createdBy: string,
  confidence = 1,
  tag?: PdfEvidenceLink['tag'],
): PdfEvidenceLink {
  if (evidence.id !== `evidence_${annotation.id}`) {
    throw new Error('PDF-annotation og evidens tilhÃ¸rer ikke samme kobling.');
  }
  if (confidence < 0 || confidence > 1) throw new Error('Konfidens mÃ¥ vÃ¦re mellom 0 og 1.');

  return {
    id: `pdf-link_${annotation.id}`,
    annotationId: annotation.id,
    evidenceId: evidence.id,
    confidence,
    tag,
    createdBy,
    createdAt: new Date().toISOString(),
  };
}

export function attachEvidenceToClaim(
  claim: { id: string; supportingEvidenceIds: string[]; updatedAt: string },
  evidence: EvidenceExtraction,
): typeof claim {
  const ids = claim.supportingEvidenceIds.includes(evidence.id)
    ? claim.supportingEvidenceIds
    : [...claim.supportingEvidenceIds, evidence.id];

  return {
    ...claim,
    supportingEvidenceIds: ids,
    updatedAt: new Date().toISOString(),
  };
}


