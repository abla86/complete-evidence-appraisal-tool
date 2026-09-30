import type { AcademicClaim, EvidenceExtraction, EvidenceKind } from '../domain/academicEvidence';
import { createId } from '../utils/id';
import { AuditTrailService } from './auditTrailService';

export interface PdfAnnotationCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfEvidenceAnnotation {
  id: string;
  sourceRecordId: string;
  page: number;
  quote: string;
  coordinates: PdfAnnotationCoordinates[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  researcherVerified: boolean;
  evidenceId?: string;
}

export interface PdfHighlightLink {
  id: string;
  highlightId: string;
  evidenceId: string;
  confidence: number;
  tag?: 'claim' | 'data' | 'methodology' | 'limitation';
  annotationId?: string;
  createdBy: string;
  createdAt: string;
}

const PDF_ANNOTATIONS_STORAGE_KEY = 'evidence-appraisal-pdf-annotations-v1';

export function createPdfEvidenceAnnotation(input: Omit<PdfEvidenceAnnotation, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): PdfEvidenceAnnotation {
  if (!input.sourceRecordId.trim()) throw new Error('sourceRecordId is required.');
  if (!Number.isInteger(input.page) || input.page < 1) throw new Error('PDF page must be a positive integer.');
  if (!input.quote.trim()) throw new Error('PDF annotation quote is required.');
  if (!input.createdBy.trim()) throw new Error('createdBy is required.');
  if (!input.coordinates.length) throw new Error('PDF annotation requires at least one coordinate rectangle.');
  for (const rect of input.coordinates) {
    if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
      throw new Error('PDF annotation coordinates are invalid.');
    }
  }
  const now = new Date().toISOString();
  return {
    ...input,
    id: input.id ?? createId('pdf_annotation'),
    quote: input.quote.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function loadPdfEvidenceAnnotations(): PdfEvidenceAnnotation[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PDF_ANNOTATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PdfEvidenceAnnotation => {
      if (!item || typeof item !== 'object') return false;
      const value = item as Partial<PdfEvidenceAnnotation>;
      return typeof value.id === 'string' && typeof value.sourceRecordId === 'string' && Number.isInteger(value.page) && value.page > 0 && typeof value.quote === 'string' && Array.isArray(value.coordinates) && typeof value.createdBy === 'string';
    });
  } catch {
    return [];
  }
}

export function savePdfEvidenceAnnotations(annotations: PdfEvidenceAnnotation[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PDF_ANNOTATIONS_STORAGE_KEY, JSON.stringify(annotations));
}

export function upsertPdfEvidenceAnnotation(annotation: PdfEvidenceAnnotation): PdfEvidenceAnnotation[] {
  const current = loadPdfEvidenceAnnotations();
  const index = current.findIndex(item => item.id === annotation.id);
  const next = [...current];
  next[index >= 0 ? index : next.length] = { ...annotation, updatedAt: new Date().toISOString() };
  savePdfEvidenceAnnotations(next);
  return next;
}

export interface EvidenceLinkContext {
  evidence: EvidenceExtraction[];
  claims: AcademicClaim[];
  pdfLinks: PdfHighlightLink[];
}

export function createEvidenceExtraction(input: {
  id?: string;
  sourceRecordId: string;
  excerpt: string;
  location?: EvidenceExtraction['location'];
  evidenceType?: EvidenceKind;
  extractedBy: string;
  sourceIdentifiers?: EvidenceExtraction['sourceIdentifiers'];
}): EvidenceExtraction {
  if (!input.sourceRecordId.trim()) throw new Error('sourceRecordId is required.');
  if (!input.excerpt.trim()) throw new Error('Evidence excerpt is required.');
  if (!input.extractedBy.trim()) throw new Error('extractedBy is required.');
  if (input.location && !Object.values(input.location).some(value => typeof value === 'string' && value.trim())) throw new Error('Evidence location must contain page, section, table or figure when provided.');
  const now = new Date().toISOString();
  return {
    id: input.id ?? createId('evidence'),
    sourceRecordId: input.sourceRecordId,
    sourceIdentifiers: input.sourceIdentifiers,
    excerpt: input.excerpt.trim(),
    location: input.location,
    evidenceType: input.evidenceType ?? 'QUOTE',
    extractedBy: input.extractedBy,
    extractedAt: now,
    linkedClaims: [],
    researcherVerified: false,
  };
}

export function linkHighlightToEvidence(
  link: Omit<PdfHighlightLink, 'id' | 'createdAt'>,
  evidence: EvidenceExtraction[],
  audit: AuditTrailService,
): PdfHighlightLink {
  if (!Number.isFinite(link.confidence) || link.confidence < 0 || link.confidence > 1) {
    throw new Error('Highlight confidence mÃ¥ vÃ¦re mellom 0 og 1.');
  }
  if (!link.highlightId.trim() || !link.evidenceId.trim()) throw new Error('Highlight og evidence mÃ¥ identifiseres.');
  if (!link.createdBy.trim()) throw new Error('createdBy is required.');
  if (!evidence.some(item => item.id === link.evidenceId)) throw new Error('Evidensen finnes ikke.');

  const created: PdfHighlightLink = {
    ...link,
    id: createId('hl_link'),
    createdAt: new Date().toISOString(),
  };

  void audit.append({
    actor: { id: link.createdBy, role: 'reviewer' },
    action: 'PDF_HIGHLIGHT_LINKED_TO_EVIDENCE',
    subject: { entityType: 'evidence', id: link.evidenceId },
    detail: { highlightId: link.highlightId, confidence: link.confidence, tag: link.tag ?? null },
  });

  return created;
}

export function attachEvidenceToClaim(
  claim: AcademicClaim,
  evidenceId: string,
  context: EvidenceLinkContext,
  audit: AuditTrailService,
): AcademicClaim {
  const evidence = context.evidence.find(item => item.id === evidenceId);
  if (!evidence) throw new Error('Evidensen finnes ikke.');
  if (claim.authorId.trim() === '') throw new Error('Claim authorId is required.');
  if ((evidence.researcherVerified === false || evidence.aiReviewRequired === true) && claim.status === 'SUPPORTED') throw new Error('Evidence requiring researcher review cannot support a claim marked SUPPORTED.');
  if (claim.contradictoryEvidenceIds.includes(evidenceId)) {
    throw new Error('Evidensen er registrert som motstridende for denne pÃ¥standen.');
  }

  const supportingEvidenceIds = claim.supportingEvidenceIds.includes(evidenceId)
    ? claim.supportingEvidenceIds
    : [...claim.supportingEvidenceIds, evidenceId];

  const next: AcademicClaim = {
    ...claim,
    supportingEvidenceIds,
    updatedAt: new Date().toISOString(),
  };

  if (!evidence.linkedClaims.includes(claim.id)) evidence.linkedClaims.push(claim.id);

  void audit.append({
    actor: { id: claim.authorId, role: 'reviewer' },
    action: 'EVIDENCE_ATTACHED_TO_CLAIM',
    subject: { entityType: 'claim', id: claim.id },
    detail: { evidenceId },
  });

  return next;
}

