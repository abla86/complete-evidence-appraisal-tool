import { createReference, type SharedReferenceInput } from './sharedReferenceEngine';

export type CitationStyle = 'APA7' | 'VANCOUVER' | 'HARVARD' | 'CHICAGO_AUTHOR_DATE' | 'MLA9' | 'IEEE';

export interface CitationInput extends SharedReferenceInput {
  id: string;
}

export interface CitationResult {
  id: string;
  inline: string;
  bibliography: string;
  sourceStatus: 'VALIDATED' | 'VALIDATION_REQUIRED' | 'INVALID';
}

function firstAuthor(authors?: string): string {
  return (authors ?? '').split(/;|\band\b|,\s*(?=[A-Z][^,]+$)/i)[0]?.trim() || 'Ukjent';
}

function apa(input: CitationInput): { inline: string; bibliography: string } {
  const author = firstAuthor(input.authors);
  const year = input.year || 'u.å.';
  const title = input.title || '[Uten tittel]';
  const journal = input.journal || '';
  const volume = input.volume ? `, ${input.volume}` : '';
  const issue = input.issue ? `(${input.issue})` : '';
  const pages = input.pages ? `, ${input.pages}` : '';
  const doi = input.doi ? ` https://doi.org/${input.doi}` : '';
  return {
    inline: `(${author}, ${year})`,
    bibliography: `${input.authors || author} (${year}). ${title}. ${journal}${volume}${issue}${pages}.${doi}`.trim(),
  };
}

function vancouver(input: CitationInput): { inline: string; bibliography: string } {
  const author = firstAuthor(input.authors);
  const year = input.year || '';
  const title = input.title || '[Uten tittel]';
  const journal = input.journal || '';
  const pages = input.pages ? `:${input.pages}` : '';
  return {
    inline: '[SOURCE]',
    bibliography: `${author}. ${title}. ${journal}. ${year}${pages}.`.trim(),
  };
}

function harvard(input: CitationInput): { inline: string; bibliography: string } {
  const author = firstAuthor(input.authors);
  const year = input.year || 'u.å.';
  const title = input.title || '[Uten tittel]';
  return {
    inline: `(${author} ${year})`,
    bibliography: `${input.authors || author} (${year}) ${title}. ${input.journal || ''}.`.trim(),
  };
}

function chicago(input: CitationInput): { inline: string; bibliography: string } {
  const author = firstAuthor(input.authors);
  const year = input.year || 'n.d.';
  return {
    inline: `(${author} ${year})`,
    bibliography: `${input.authors || author}. ${year}. "${input.title || '[Uten tittel]}'". ${input.journal || ''}.`.trim(),
  };
}

export function buildCitation(input: CitationInput, style: CitationStyle): CitationResult {
  const validation = createReference(input);
  let formatted: { inline: string; bibliography: string };
  switch (style) {
    case 'VANCOUVER':
    case 'IEEE':
      formatted = vancouver(input);
      break;
    case 'HARVARD':
      formatted = harvard(input);
      break;
    case 'CHICAGO_AUTHOR_DATE':
      formatted = chicago(input);
      break;
    case 'MLA9':
      formatted = { inline: `(${firstAuthor(input.authors)})`, bibliography: `${input.authors || firstAuthor(input.authors)}. "${input.title || '[Uten tittel]}'". ${input.journal || ''}, ${input.year || 'n.d.'}.` };
      break;
    case 'APA7':
    default:
      formatted = apa(input);
  }
  return {
    id: input.id,
    ...formatted,
    sourceStatus: validation.status,
  };
}
