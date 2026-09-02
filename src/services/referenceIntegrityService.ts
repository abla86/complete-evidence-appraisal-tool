/**
 * Reference Integrity Gateway
 *
 * Fail-closed reference handling for academic output.
 * It does not invent missing bibliographic data and does not claim
 * a reference is verified merely because its syntax is valid.
 *
 * Norwegian APA 7 rules for laws/regulations are aligned with:
 * - Søk & Skriv / Norsk APA-manual
 * - Kildekompasset
 * - UiT APA 7 example collection
 */

export type ReferenceKind =
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

export type ReferenceValidationStatus =
  | 'VALIDATED'
  | 'VALIDATION_REQUIRED'
  | 'INVALID';

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

function clean(value?: string): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

function cleanDoi(value?: string): string {
  return clean(value)
    .replace(/^doi:\s*/i, '')
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/[.,;]+$/, '');
}

function cleanUrl(value?: string): string {
  return clean(value).replace(/[)>,.;]+$/, '');
}

function normalizeYear(value?: number | string): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function splitAuthors(value?: string): string[] {
  const raw = clean(value);
  if (!raw) return [];
  // Accept the common "Surname, A., Surname, B." and "A. Surname; B. Surname"
  // input conventions without attempting unsafe inference from arbitrary prose.
  return raw
    .split(/\s*;\s*|\s+&\s+|\s+og\s+/i)
    .map(clean)
    .filter(Boolean);
}

function firstAuthorSurname(value?: string): string {
  const first = splitAuthors(value)[0] || '';
  if (first.includes(',')) return clean(first.split(',')[0]);
  const parts = first.split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || '';
}

function formatAuthors(value?: string): string {
  const raw = clean(value);
  if (!raw) return '';
  return raw;
}

function sentenceCaseTitle(value?: string): string {
  const title = clean(value);
  if (!title) return '';
  // Conservative: do not destroy capitalization in supplied titles.
  // APA sentence-case conversion is unsafe for acronyms/proper nouns without metadata.
  return /[.!?]$/.test(title) ? title : title + '.';
}

function requireFields(input: ReferenceInput): string[] {
  const missing: string[] = [];
  const require = (field: keyof ReferenceInput, label: string) => {
    if (!clean(String(input[field] ?? ''))) missing.push(label);
  };

  switch (input.kind) {
    case 'JOURNAL_ARTICLE':
      require('authors', 'forfatter(e)');
      require('year', 'år');
      require('title', 'tittel');
      require('journal', 'tidsskrift');
      if (!clean(String(input.doi || input.url || ''))) missing.push('DOI eller URL');
      break;
    case 'BOOK':
      require('authors', 'forfatter(e)');
      require('year', 'år');
      require('title', 'tittel');
      require('publisher', 'utgiver');
      break;
    case 'LAW':
      require('shortTitle', 'lovens korttittel');
      require('year', 'år');
      require('officialTitle', 'lovens fullstendige tittel');
      require('dateCode', 'datokode');
      require('websiteName', 'nettsted');
      require('url', 'URL');
      break;
    case 'REGULATION':
      require('shortTitle', 'forskriftens korttittel');
      require('year', 'år');
      require('officialTitle', 'forskriftens fullstendige tittel');
      require('dateCode', 'datokode');
      require('websiteName', 'nettsted');
      require('url', 'URL');
      break;
    case 'TREATY':
      require('shortTitle', 'korttittel eller organisasjon');
      require('year', 'år');
      require('officialTitle', 'fullstendig tittel');
      require('url', 'URL');
      break;
    default:
      require('year', 'år');
      require('title', 'tittel');
      if (!clean(input.authors || input.shortTitle || '')) missing.push('forfatter/ansvarlig institusjon');
      break;
  }
  return missing;
}

function validateYear(value?: number | string): string | undefined {
  const year = normalizeYear(value);
  return year && YEAR_RE.test(year) ? undefined : 'År må være et firesifret publikasjonsår.';
}

function buildReference(input: ReferenceInput): string {
  const authors = formatAuthors(input.authors);
  const year = normalizeYear(input.year);
  const title = sentenceCaseTitle(input.title);
  const doi = cleanDoi(input.doi);
  const url = cleanUrl(input.url);

  if (input.kind === 'LAW' || input.kind === 'REGULATION') {
    const shortTitle = clean(input.shortTitle);
    const officialTitle = clean(input.officialTitle);
    const site = clean(input.websiteName);
    return `${shortTitle}. (${year}). ${officialTitle} (${clean(input.dateCode)}). ${site}. ${url}`;
  }

  if (input.kind === 'TREATY') {
    return `${clean(input.shortTitle)}. (${year}). ${clean(input.officialTitle)}. ${url}`;
  }

  if (input.kind === 'JOURNAL_ARTICLE') {
    const container = [
      clean(input.journal),
      clean(input.volume) ? ` ${clean(input.volume)}` : '',
      clean(input.issue) ? `(${clean(input.issue)})` : '',
      clean(input.pages || input.articleNumber) ? `, ${clean(input.pages || input.articleNumber)}` : ''
    ].join('');
    const locator = doi ? `https://doi.org/${doi}` : url;
    return `${authors} (${year}). ${title} ${container}.${locator ? ` ${locator}` : ''}`;
  }

  if (input.kind === 'BOOK') {
    return `${authors} (${year}). ${title} ${clean(input.publisher) ? clean(input.publisher) + '.' : ''}`;
  }

  if (input.kind === 'WEBPAGE' || input.kind === 'REPORT' || input.kind === 'GUIDELINE' || input.kind === 'NOU' || input.kind === 'PROPOSITION' || input.kind === 'THESIS') {
    const source = clean(input.publisher || input.websiteName);
    return `${authors} (${year}). ${title}${source ? ` ${source}.` : ''}${url ? ` ${url}` : ''}`;
  }

  return `${authors} (${year}). ${title}${url ? ` ${url}` : ''}`;
}

export function validateReference(input: ReferenceInput): ReferenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields = requireFields(input);
  const yearError = validateYear(input.year);
  if (yearError) errors.push(yearError);

  const doi = cleanDoi(input.doi);
  if (doi && !DOI_RE.test(doi)) {
    errors.push('DOI-formatet er ugyldig.');
  }

  const url = cleanUrl(input.url);
  if (url && !/^https?:\/\/[^\s]+$/i.test(url)) {
    errors.push('URL-formatet er ugyldig.');
  }

  if (missingFields.length) {
    errors.push(`Mangler obligatoriske opplysninger: ${missingFields.join(', ')}.`);
  }

  if ((input.kind === 'LAW' || input.kind === 'REGULATION') && input.url && !/lovdata\.no/i.test(input.url)) {
    warnings.push('Norsk lov/forskrift bør kontrolleres mot den autoritative kilden der dokumentet faktisk er hentet.');
  }

  if (input.kind === 'JOURNAL_ARTICLE' && !doi && !url) {
    warnings.push('Ingen DOI/URL: referansen kan ikke spores digitalt fra denne registreringen.');
  }

  // Deliberately fail closed: syntax is not proof of bibliographic truth.
  const canUseAsVerifiedReference = errors.length === 0;
  const status: ReferenceValidationStatus =
    errors.length > 0 ? 'INVALID' : 'VALIDATION_REQUIRED';

  const author = firstAuthorSurname(input.authors || input.shortTitle);
  const year = normalizeYear(input.year);
  const inTextParenthetical = author && year ? `(${author}, ${year}${input.section ? `, ${input.section}` : ''})` : '';
  const inTextNarrative = author && year
    ? `${author} (${year}${input.section ? `, ${input.section}` : ''})`
    : '';

  return {
    status,
    canUseAsVerifiedReference,
    reference: errors.length === 0 ? buildReference(input) : '',
    inTextParenthetical,
    inTextNarrative,
    errors,
    warnings,
    missingFields,
    sourceKind: input.kind
  };
}
