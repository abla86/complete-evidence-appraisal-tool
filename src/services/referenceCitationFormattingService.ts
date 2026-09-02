/**
 * Single citation formatting boundary for the Evidence Appraisal Tool.
 * Keeps reference formatting deterministic and independent from verification.
 */
import type { ReferenceRecord } from './referenceHubService';

export type CitationOutputStyle = 'APA7' | 'VANCOUVER' | 'HARVARD' | 'CHICAGO_AUTHOR_DATE' | 'MLA9' | 'IEEE';

function authorsArray(record: ReferenceRecord): string[] {
  return (record.authors || '')
    .split(/\s*;\s*|\s+&\s+|\s+og\s+/i)
    .map(v => v.trim())
    .filter(Boolean);
}

function surname(raw: string): string {
  const value = raw.trim();
  if (value.includes(',')) return value.split(',')[0].trim();
  return value.split(/\s+/).filter(Boolean).at(-1) || value;
}

function firstAuthor(record: ReferenceRecord): string {
  return surname(authorsArray(record)[0] || '');
}

function year(record: ReferenceRecord): string {
  return record.year ? String(record.year) : 'n.d.';
}

function title(record: ReferenceRecord): string {
  return (record.title || 'Untitled').trim();
}

function journal(record: ReferenceRecord): string {
  const pieces = [record.journal || ''].filter(Boolean);
  if (record.volume) pieces.push(String(record.volume));
  if (record.issue) pieces.push(`(${record.issue})`);
  if (record.pages || record.articleNumber) pieces.push(String(record.pages || record.articleNumber));
  return pieces.join(', ');
}

export function formatReference(record: ReferenceRecord, style: CitationOutputStyle, index = 1): string {
  const authorList = authorsArray(record);
  const first = firstAuthor(record);
  const y = year(record);
  const t = title(record);
  const j = journal(record);
  const locator = record.doi ? `https://doi.org/${record.doi}` : record.url || '';

  switch (style) {
    case 'VANCOUVER':
      return `${index}. ${authorList.join(', ')}. ${t}. ${j}${locator ? `. ${locator}` : '.'}`.replace(/\.\s*\./g, '.');
    case 'HARVARD':
      return `${first || 'Unknown'}, ${y}, '${t}', ${j}${locator ? `, ${locator}` : ''}.`;
    case 'CHICAGO_AUTHOR_DATE':
      return `${first || 'Unknown'}. ${y}. "${t}." ${j}${locator ? `. ${locator}` : ''}.`;
    case 'MLA9':
      return `${authorList[0] || 'Unknown'}. "${t}." ${j}, ${y}${locator ? `, ${locator}` : ''}.`;
    case 'IEEE':
      return `[${index}] ${authorList.join(', ')}, "${t}," ${j}, ${y}${locator ? `. ${locator}` : '.'}`;
    case 'APA7':
    default:
      return `${authorList.length ? authorList.join(', ') + ' ' : ''}(${y}). ${t}. ${j}${locator ? `. ${locator}` : '.'}`.replace(/\.\s*\./g, '.');
  }
}

export function formatInText(record: ReferenceRecord, style: CitationOutputStyle, index = 1): string {
  const first = firstAuthor(record);
  const y = year(record);
  if (style === 'VANCOUVER' || style === 'IEEE') return `[${index}]`;
  return first ? `(${first}, ${y})` : `(${y})`;
}

export function buildBibliography(records: ReferenceRecord[], style: CitationOutputStyle): string[] {
  return records.map((record, index) => formatReference(record, style, index + 1));
}
