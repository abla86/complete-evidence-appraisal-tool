/**
 * Portable adapter contract for the standalone Reference Engine.
 *
 * This file intentionally has no network access and no browser dependencies.
 * A future standalone reference-engine package can replace the implementation
 * behind this interface without changing Privacy Inspector consumers.
 */

import { buildJournalArticleReference, classifyMetadata } from './apa7.js';

export function createJournalReference(input = {}) {
  const metadata = {
    authors: Array.isArray(input.authors)
      ? input.authors
      : String(input.authors || '').split(';').map(s => s.trim()).filter(Boolean),
    year: input.year,
    title: input.title,
    journal: input.journal,
    volume: input.volume,
    issue: input.issue,
    pages: input.pages,
    articleNumber: input.articleNumber,
    doi: input.doi,
    url: input.url
  };

  const state = classifyMetadata(metadata);
  const reference = state === 'COMPLETE'
    ? buildJournalArticleReference(metadata)
    : '';

  return {
    state,
    reference,
    verificationState: 'NOT_VERIFIED'
  };
}
