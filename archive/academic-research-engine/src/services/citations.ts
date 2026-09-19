import crypto from 'node:crypto';
import type {
  CitationMetadata,
  CitationRecord,
  VerificationStatus,
} from '../types/index.js';

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeDoi(doi: string): string {
  return doi.trim().replace(/^https?:\/\/doi\.org\//i, '');
}

function doiUrl(doi: string): string {
  return `https://doi.org/${normalizeDoi(doi)}`;
}

function normalizeAuthors(authors: string[]): string[] {
  return authors.map(author => author.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export function apa7(metadata: CitationMetadata): string {
  const authors = normalizeAuthors(metadata.authors);
  const authorText = authors.length
    ? authors.join(', ')
    : 'Unknown author';

  const year = metadata.year ? `(${metadata.year})` : '(n.d.)';
  const title = metadata.title.trim().replace(/[.]+$/, '');
  const journal = metadata.journal?.trim() ?? '';
  const volume = metadata.volume?.trim() ?? '';
  const issue = metadata.issue?.trim() ?? '';
  const pages = metadata.pages?.trim() ?? '';

  let output = `${authorText} ${year}. ${title}.`;

  if (journal) {
    output += ` ${journal}`;
    if (volume) output += `, ${volume}`;
    if (issue) output += `(${issue})`;
    if (pages) output += `, ${pages}`;
    output += '.';
  }

  if (metadata.doi) {
    output += ` ${doiUrl(metadata.doi)}`;
  } else if (metadata.url) {
    output += ` ${metadata.url.trim()}`;
  }

  return clean(output);
}

export function vancouver(metadata: CitationMetadata): string {
  const authors = normalizeAuthors(metadata.authors);
  const authorText = authors.slice(0, 6).join(', ') + (authors.length > 6 ? ', et al.' : '');
  const title = metadata.title.trim().replace(/[.]+$/, '');
  const journal = metadata.journal?.trim() ?? '';
  const year = metadata.year ?? '';
  const volume = metadata.volume?.trim() ?? '';
  const issue = metadata.issue?.trim() ?? '';
  const pages = metadata.pages?.trim() ?? '';

  let output = `${authorText}. ${title}.`;
  if (journal) output += ` ${journal}.`;
  if (year) output += ` ${year}`;
  if (volume) output += `;${volume}`;
  if (issue) output += `(${issue})`;
  if (pages) output += `:${pages}`;
  output += '.';

  if (metadata.doi) output += ` ${doiUrl(metadata.doi)}`;
  else if (metadata.url) output += ` ${metadata.url.trim()}`;

  return clean(output);
}

export function createCitationRecord(metadata: CitationMetadata): CitationRecord {
  const status: VerificationStatus =
    metadata.verified === true
      ? 'HUMAN_VERIFIED'
      : metadata.doi || metadata.pmid
        ? 'AI_CANDIDATE'
        : 'UNVERIFIED';

  return {
    ...metadata,
    authors: normalizeAuthors(metadata.authors),
    doi: metadata.doi ? normalizeDoi(metadata.doi) : undefined,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status,
  };
}
