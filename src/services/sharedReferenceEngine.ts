/**
 * Shared reference engine adapter.
 *
 * Keeps citation generation and integrity semantics in one reusable boundary.
 * Formatting is not the same as source verification: VALIDATION_REQUIRED means
 * the reference is structurally usable but its bibliographic truth has not been
 * independently verified.
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
  kind: SharedReferenceKind;
  authors?: string;
  year?: number | string;
  title?: string;
  journal?: string;
  volume?: string | number;
  issue?: string | number;
  pages?: string;
  articleNumber?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  shortTitle?: string;
  officialTitle?: string;
  dateCode?: string;
  section?: string;
  websiteName?: string;
}

export function createReference(input: SharedReferenceInput) {
  const result = validateReference(input);
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
