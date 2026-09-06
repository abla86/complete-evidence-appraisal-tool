/**
 * Reference Integrity Gateway
 *
 * Deterministic local formatting/validation only. A syntactically valid
 * reference is never treated as independently verified.
 */

export type ReferenceKind =
  | 'JOURNAL_ARTICLE' | 'BOOK' | 'REPORT' | 'WEBPAGE' | 'LAW' | 'REGULATION'
  | 'NOU' | 'PROPOSITION' | 'TREATY' | 'GUIDELINE' | 'THESIS' | 'OTHER';

export type ReferenceValidationStatus = 'VALIDATED' | 'VALIDATION_REQUIRED' | 'INVALID';

export interface ReferenceInput {
  kind: ReferenceKind;
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
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ReferenceValidationResult {
  status: ReferenceValidationStatus;
  canUseAsVerifiedReference: boolean;
  reference: string;
  inTextParenthetical: string;
  inTextNarrative: string;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  sourceKind: ReferenceKind;
}

const DOI_RE = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i;
const YEAR_RE = /^(?:1[5-9]\d{2}|20\d{2}|21\d{2})$/;

function clean(value?: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function cleanDoi(value?: string): string {
  return clean(value)
    .replace(/^doi:\s*/i, '')
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/[.,;:)]+$/, '');
}

function cleanUrl(value?: string): string {
  return clean(value).replace(/[)>,.;]+$/, '');
}

function normalizeYear(value?: number | string): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function firstAuthorSurname(value?: string): string {
  const raw = clean(value);
  if (!raw) return '';
  const first = raw.split(/\s*;\s*|\s+&\s+|\s+og\s+/i)[0]?.trim() || '';
  if (first.includes(',')) return clean(first.split(',')[0]);
  const parts = first.split(/\s+/).filter(Boolean);
  return parts.at(-1) || '';
}

function formatAuthors(value?: string): string {
  return clean(value);
}

function titleWithPeriod(value?: string): string {
  const title = clean(value);
  return title ? (/\.$/.test(title) ? title : `${title}.`) : '';
}

function requireFields(input: ReferenceInput): string[] {
  const missing: string[] = [];
  const required = (field: keyof ReferenceInput, label: string) => {
    if (!clean(input[field])) missing.push(label);
  };

  switch (input.kind) {
    case 'JOURNAL_ARTICLE':
      required('authors', 'forfatter(e)');
      required('year', 'Ã¥r');
      required('title', 'tittel');
      required('journal', 'tidsskrift');
      if (!clean(input.doi) && !clean(input.url)) missing.push('DOI eller URL');
      break;
    case 'BOOK':
      required('authors', 'forfatter(e)');
      required('year', 'Ã¥r');
      required('title', 'tittel');
      required('publisher', 'utgiver');
      break;
    case 'LAW':
    case 'REGULATION':
      required('shortTitle', input.kind === 'LAW' ? 'lovens korttittel' : 'forskriftens korttittel');
      required('year', 'Ã¥r');
      required('officialTitle', input.kind === 'LAW' ? 'lovens fullstendige tittel' : 'forskriftens fullstendige tittel');
      required('dateCode', 'datokode');
      required('websiteName', 'nettsted');
      required('url', 'URL');
      break;
    case 'TREATY':
      required('shortTitle', 'korttittel eller organisasjon');
      required('year', 'Ã¥r');
      required('officialTitle', 'fullstendig tittel');
      required('url', 'URL');
      break;
    default:
      required('year', 'Ã¥r');
      required('title', 'tittel');
      if (!clean(input.authors || input.shortTitle)) missing.push('forfatter/ansvarlig institusjon');
      break;
  }
  return missing;
}

function buildReference(input: ReferenceInput): string {
  const authors = formatAuthors(input.authors);
  const year = normalizeYear(input.year);
  const title = titleWithPeriod(input.title);
  const doi = cleanDoi(input.doi);
  const url = cleanUrl(input.url);

  if (input.kind === 'LAW' || input.kind === 'REGULATION') {
    return `${clean(input.shortTitle)}. (${year}). ${clean(input.officialTitle)} (${clean(input.dateCode)}). ${clean(input.websiteName)}. ${url}`;
  }
  if (input.kind === 'TREATY') {
    return `${clean(input.shortTitle)}. (${year}). ${clean(input.officialTitle)}. ${url}`;
  }
  if (input.kind === 'JOURNAL_ARTICLE') {
    const container = [
      clean(input.journal),
      clean(input.volume) ? `, ${clean(input.volume)}` : '',
      clean(input.issue) ? `(${clean(input.issue)})` : '',
      clean(input.pages || input.articleNumber) ? `, ${clean(input.pages || input.articleNumber)}` : ''
    ].join('');
    const locator = doi ? `https://doi.org/${doi}` : url;
    return `${authors} (${year}). ${title} ${container}.${locator ? ` ${locator}` : ''}`;
  }
  if (input.kind === 'BOOK') {
    return `${authors} (${year}). ${title} ${clean(input.publisher)}.`.replace(/\s+\./g, '.');
  }
  const source = clean(input.publisher || input.websiteName);
  return `${authors} (${year}). ${title}${source ? ` ${source}.` : ''}${url ? ` ${url}` : ''}`;
}

export function validateReference(input: ReferenceInput): ReferenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields = requireFields(input);
  const year = normalizeYear(input.year);
  const doi = cleanDoi(input.doi);
  const url = cleanUrl(input.url);

  if (!year || !YEAR_RE.test(year)) errors.push('Ã…r mÃ¥ vÃ¦re et firesifret publikasjonsÃ¥r.');
  if (doi && !DOI_RE.test(doi)) errors.push('DOI-formatet er ugyldig.');
  if (url && !/^https?:\/\/[^\s]+$/i.test(url)) errors.push('URL-formatet er ugyldig.');
  if (missingFields.length) errors.push(`Mangler obligatoriske opplysninger: ${missingFields.join(', ')}.`);

  if ((input.kind === 'LAW' || input.kind === 'REGULATION') && url && !/lovdata\.no/i.test(url)) {
    warnings.push('Norsk lov/forskrift mÃ¥ kontrolleres mot korrekt autoritativ kilde.');
  }
  if (input.kind === 'JOURNAL_ARTICLE' && !doi && !url) {
    warnings.push('Ingen DOI/URL: digital sporbarhet er ikke etablert.');
  }

  const structurallyValid = errors.length === 0;
  const explicitlyVerified = Boolean(input.verifiedBy && input.verifiedAt);
  const status: ReferenceValidationStatus =
    !structurallyValid ? 'INVALID' : explicitlyVerified ? 'VALIDATED' : 'VALIDATION_REQUIRED';

  const author = input.kind === 'LAW' || input.kind === 'REGULATION'
    ? clean(input.shortTitle)
    : firstAuthorSurname(input.authors);
  const section = clean(input.section).replace(/^Â§\s*/i, '');
  const inTextParenthetical = author && year ? `(${author}, ${year}${section ? `, Â§ ${section}` : ''})` : '';
  const inTextNarrative = author && year ? `${author} (${year}${section ? `, Â§ ${section}` : ''})` : '';

  return {
    status,
    canUseAsVerifiedReference: status === 'VALIDATED',
    reference: structurallyValid ? buildReference(input) : '',
    inTextParenthetical,
    inTextNarrative,
    errors,
    warnings,
    missingFields,
    sourceKind: input.kind
  };
}


