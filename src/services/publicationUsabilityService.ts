import type { ExternalPublicationRecord } from './evidenceIntelligenceService';

export type PublicationUsability = 'ELIGIBLE' | 'REVIEW_REQUIRED' | 'BLOCKED';

export interface PublicationStatusDecision {
  usability: PublicationUsability;
  reasons: string[];
  checkedAt: string;
}

export function assessPublicationUsability(record: ExternalPublicationRecord | null): PublicationStatusDecision {
  const reasons: string[] = [];
  if (!record) return { usability:'REVIEW_REQUIRED', reasons:['Publikasjonsstatus kunne ikke verifiseres eksternt.'], checkedAt:new Date().toISOString() };
  if (record.isRetracted) reasons.push('Publikasjonen har retraction-signal og kan ikke brukes uten eksplisitt metodisk vurdering.');
  if (record.hasCorrection) reasons.push('Publikasjonen har correction/erratum-signal; forskeren mÃ¥ kontrollere hvilken versjon som skal brukes.');
  if (record.isPeerReviewed === 'CANNOT_VERIFY') reasons.push('Fagfellevurdering er ikke etablert av denne verifikasjonen.');
  const usability: PublicationUsability = record.isRetracted ? 'BLOCKED' : (record.hasCorrection || record.isPeerReviewed === 'CANNOT_VERIFY' ? 'REVIEW_REQUIRED' : 'ELIGIBLE');
  return { usability, reasons, checkedAt:new Date().toISOString() };
}

