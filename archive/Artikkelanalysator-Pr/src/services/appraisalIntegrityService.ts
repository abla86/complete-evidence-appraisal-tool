import { ChecklistItem, EvidenceHighlight } from '../types';
import { ParsedDocument, DocumentService } from './documentService';

export interface IntegrityCheckResult {
  isVerified: boolean;
  verifiedCount: number;
  totalCount: number;
  errors: string[];
  warnings: string[];
  highlights: EvidenceHighlight[];
}

export class AppraisalIntegrityService {
  /**
   * Strictly verifies every checklist evidence quote against the parsed document.
   * Rejects quotes containing '...' or not found in document text.
   */
  public static verifyAppraisalIntegrity(doc: ParsedDocument, checklists: ChecklistItem[]): IntegrityCheckResult {
    let verifiedCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
    const highlights: EvidenceHighlight[] = [];

    if (!doc.isValid) {
      return {
        isVerified: false,
        verifiedCount: 0,
        totalCount: checklists.length,
        errors: [`Kritisk feil: Dokumentet er ikke gyldig inntatt eller mangler lesbar tekst (${doc.validationError || 'Utsnitt mangler'}).`],
        warnings: [],
        highlights: []
      };
    }

    checklists.forEach((item, idx) => {
      const quote = item.evidenceQuote ? item.evidenceQuote.trim() : '';

      if (!quote || quote.length < 5) {
        warnings.push(`Punkt ${item.id} mangler evidenssitat.`);
        return;
      }

      // Check for illegal ellipsis
      const hasEllipsis = quote.includes('...') || quote.includes('…');
      if (hasEllipsis) {
        errors.push(`Punkt ${item.id}: Sitatet inneholder forbudt forkortelse (...) og er ikke et 100% ordrett utdrag.`);
        return;
      }

      // Locate in document
      const location = DocumentService.locateEvidence(doc, quote);
      if (!location.found) {
        errors.push(`Punkt ${item.id}: Sitatet ble IKKE gjenfunnet ordrett i dokumentets tekst („${quote.substring(0, 40)}...“).`);
      } else {
        verifiedCount++;
        highlights.push({
          id: `hl-${idx}-${item.id}`,
          questionId: item.id,
          category: item.category,
          quote: quote,
          color: item.highlightColor || 'bg-indigo-100 text-indigo-900 border-indigo-300'
        });
      }
    });

    const isVerified = errors.length === 0 && verifiedCount >= Math.min(3, checklists.length);

    return {
      isVerified,
      verifiedCount,
      totalCount: checklists.length,
      errors,
      warnings,
      highlights
    };
  }
}
