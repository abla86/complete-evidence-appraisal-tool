import { buildCitation, type CitationStyle } from './academicCitationService';
import type { ReferenceRecord } from './referenceHubService';
import type { AcademicClaim, EvidenceExtraction } from '../domain/academicEvidence';
import { resolveReferenceForSource } from './evidenceIdentityService';

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
    const linkedReferences = linkedEvidence
      .map(item => resolveReferenceForSource({
        recordId: item.sourceRecordId,
        identifiers: item.sourceIdentifiers,
        metadata: item.sourceMetadata,
        referenceDraft: item.referenceDraft,
      }, references) ?? references.find(reference =>
        item.referenceId?.trim() === reference.id ||
        item.sourceRecordId?.trim() === reference.id
      ) ?? null)
      .filter((reference): reference is ReferenceRecord => Boolean(reference))
      .filter((reference, index, all) => all.findIndex(r => r.id === reference.id) === index);
    const reasons: string[] = [];

    if (!linkedEvidence.length) reasons.push('Ingen evidens er lenket til pÃ¥standen.');
    if (linkedReferences.length === 0 && linkedEvidence.length) reasons.push('Minst Ã©n evidenskilde mangler referansepost i Reference Hub.');
    if (linkedReferences.some(reference => reference.verification !== 'VALIDATED')) reasons.push('ikke bibliografisk verifisert');
    if (linkedReferences.some(reference => reference.verification === 'RETRACTED' || reference.retraction?.detected)) reasons.push('Minst Ã©n lenket referanse er trukket tilbake eller har uttrykt bekymring.');
    if (linkedEvidence.some(item => item.evidenceType !== 'RESEARCHER_DATA' && !item.researcherVerified)) reasons.push('Minst Ã©n evidensuttrekking er ikke kontrollert av forsker.');
    if (linkedEvidence.some(item => item.evidenceType !== 'RESEARCHER_DATA' && !item.location?.page && !item.location?.section && !item.location?.table && !item.location?.figure)) reasons.push('Minst Ã©n evidensenhet mangler lokasjon.');
    if (claim.status !== 'SUPPORTED') reasons.push(`PÃ¥standen har status ${claim.status}.`);

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

