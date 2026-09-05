// Lightweight validation and parsing helpers shared by import/export flows.
import type { ArticleAppraisal } from '../types';
import { createReferenceRecord } from './referenceHubService';

export type SupportedImportFormat = 'RIS' | 'BIBTEX' | 'JSON' | 'CSV' | 'TSV' | 'PUBMED' | 'DOCUMENT';

export function parseDelimitedText(text: string, delimiter: ',' | '\t' = ','): Record<string,string>[] {
  if (!text.trim()) return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field.length === 0) quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { if (next !== '\n') { row.push(field); rows.push(row); row = []; field = ''; } }
    else field += ch;
  }
  if (quoted) throw new Error('Ugyldig CSV/TSV: uavsluttet anførselstegn.');
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  while (rows.length && rows[0].every(cell => !cell.trim())) rows.shift();
  if (!rows.length) return [];
  const headers = rows.shift()!.map((header, index) => header.trim() || `column_${index + 1}`);
  return rows.filter(r => r.some(cell => cell.trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

function first(row: Record<string,string>, ...names: string[]): string {
  for (const name of names) {
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (key) return row[key] ?? '';
  }
  return '';
}

export function importDelimitedArticles(text: string, delimiter: ',' | '\t'): ArticleAppraisal[] {
  return parseDelimitedText(text, delimiter).map((row, index) => {
    const yearRaw = first(row, 'year', 'publicationYear', 'publication year');
    const year = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : 0;
    return {
      ...createReferenceRecord({
        id: `import-${index + 1}`,
        kind: 'JOURNAL_ARTICLE',
        title: first(row, 'title', 'article title') || 'Uten tittel',
        authors: first(row, 'authors', 'author') || 'Ukjent forfatter',
        year,
        journal: first(row, 'journal', 'source', 'publication') || '',
        doi: first(row, 'doi') || undefined,
        url: first(row, 'url', 'link') || undefined,
        importedFrom: [delimiter === '\t' ? 'TSV' : 'CSV'],
        tags: [],
        collections: [],
      }) as unknown as ArticleAppraisal,
      lifecycleStatus: 'DRAFT',
    };
  });
}
