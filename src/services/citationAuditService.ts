import { buildCitation, type CitationStyle } from './academicCitationService';
import type { ReferenceRecord } from './referenceHubService';
import type { AcademicClaim, EvidenceExtraction } from '../domain/academicEvidence';

export interface CitationAuditResult {
  claimId: string;
  claimText: string;
  linkedEvidence: EvidenceExtraction[];
  linkedReferences: ReferenceRecord[];
  citation: string | null;
  bibliography: string | null;
  ok: boolean;
  reasons: string[];
}

export interface CitationAuditReport {
  generatedAt: string;
  style: CitationStyle;
  results: CitationAuditResult[];
  blockingIssues: number;
  canExport: boolean;
}

export function runCitationAudit(
  claims: AcademicClaim[],
  evidence: EvidenceExtraction[],
  references: ReferenceRecord[],
  style: CitationStyle = 'APA7',
): CitationAuditReport {
  const results = claims.map(claim => {
    const linkedEvidence = evidence.filter(item => claim.supportingEvidenceIds.includes(item.id));
    const sourceIds = new Set(linkedEvidence.map(item => item.sourceRecordId));
    const linkedReferences = references.filter(reference => sourceIds.has(reference.id));
    const reasons: string[] = [];

    if (!linkedEvidence.length) reasons.push('Ingen evidens er lenket til påstanden.');
    if (linkedReferences.length !== sourceIds.size) reasons.push('Minst én evidenskilde mangler referansepost i Reference Hub.');
    if (linkedReferences.some(reference => reference.verification !== 'VALIDATED')) reasons.push('Minst én referanse er ikke bibliografisk verifisert.');
    if (linkedEvidence.some(item => item.evidenceType !== 'RESEARCHER_DATA' && !item.researcherVerified)) reasons.push('Minst én evidensuttrekking er ikke kontrollert av forsker.');
    if (linkedEvidence.some(item => item.evidenceType !== 'RESEARCHER_DATA' && !item.location?.page && !item.location?.section && !item.location?.table && !item.location?.figure)) reasons.push('Minst én evidensenhet mangler lokasjon.');
    if (claim.status !== 'SUPPORTED') reasons.push(`Påstanden har status ${claim.status}.`);

    const primary = linkedReferences[0];
    const citation = primary ? buildCitation({ id: primary.id, ...primary }, style) : null;
    const ok = reasons.length === 0 && Boolean(citation?.inline && citation?.bibliography);
    return {
      claimId: claim.id,
      claimText: claim.text,
      linkedEvidence,
      linkedReferences,
      citation: citation?.inline ?? null,
      bibliography: citation?.bibliography ?? null,
      ok,
      reasons,
    };
  });

  const blockingIssues = results.filter(result => !result.ok).length;
  return {
    generatedAt: new Date().toISOString(),
    style,
    results,
    blockingIssues,
    canExport: blockingIssues === 0,
  };
}
