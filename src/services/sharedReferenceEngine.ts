/**
 * Single shared reference validation boundary.
 *
 * Identifier fields are intentionally optional here so callers can provide
 * PMID/PMCID/ISBN/ISSN without creating another reference engine. The richer
 * Reference Hub record owns lifecycle state, provenance and attachments.
 */

import { validateReference } from './referenceIntegrityService.ts';

export type SharedReferenceKind =
  | 'JOURNAL_ARTICLE'
  | 'BOOK'
  | 'REPORT'
  | 'WEBPAGE'
  | 'LAW'
  | 'REGULATION'
  | 'NOU'
  | 'PROPOSITION'
  | 'TREATY'
  | 'GUIDELINE'
  | 'THESIS'
  | 'OTHER';

export interface SharedReferenceInput {
  kind?: SharedReferenceKind;
  authors?: string;
  year?: number | string;
  title?: string;
  journal?: string;
  volume?: string | number;
  issue?: string | number;
  pages?: string;
  articleNumber?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  isbn?: string;
  issn?: string;
  url?: string;
  abstract?: string;
  language?: string;
  publisher?: string;
  shortTitle?: string;
  officialTitle?: string;
  dateCode?: string;
  section?: string;
  websiteName?: string;
  sourceRecordIds?: string[];
}

export function createReference(input: SharedReferenceInput) {
  const result = validateReference({ ...input, kind: input.kind ?? 'JOURNAL_ARTICLE' });
  return {
    ...result,
    verified: result.status === 'VALIDATED' && result.canUseAsVerifiedReference,
    draft: result.status !== 'INVALID' ? result.reference : '',
  };
}

export function createApa7JournalReference(input: Omit<SharedReferenceInput, 'kind'>) {
  return createReference({ ...input, kind: 'JOURNAL_ARTICLE' });
}

export function createNorwegianLawReference(input: Omit<SharedReferenceInput, 'kind'>) {
  return createReference({ ...input, kind: 'LAW' });
}

export function createNorwegianRegulationReference(input: Omit<SharedReferenceInput, 'kind'>) {
  return createReference({ ...input, kind: 'REGULATION' });
}


