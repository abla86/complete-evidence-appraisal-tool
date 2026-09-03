import type { AcademicClaim, EvidenceExtraction, EvidenceKind } from '../domain/academicEvidence';
import { createId } from '../utils/id';
import { AuditTrailService } from './auditTrailService';

export interface PdfHighlightLink {
  id: string;
  highlightId: string;
  evidenceId: string;
  confidence: number;
  tag?: 'claim' | 'data' | 'methodology' | 'limitation';
  createdBy: string;
  createdAt: string;
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
    throw new Error('Highlight confidence må være mellom 0 og 1.');
  }
  if (!link.highlightId.trim() || !link.evidenceId.trim()) throw new Error('Highlight og evidence må identifiseres.');
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
  if (claim.contradictoryEvidenceIds.includes(evidenceId)) {
    throw new Error('Evidensen er registrert som motstridende for denne påstanden.');
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