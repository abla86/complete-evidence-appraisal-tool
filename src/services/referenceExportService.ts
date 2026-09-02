import type { ReferenceRecord } from './referenceHubService.ts';

function escape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/[{},]/g, ch => `\\${ch}`);
}

function risAuthors(authors?: string): string[] {
  return (authors ?? '').split(/\s*;\s*|\s+\&\s+/).map(v => v.trim()).filter(Boolean);
}

export function exportReferencesAsJson(records: ReferenceRecord[]): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2);
}

export function exportReferencesAsCsv(records: ReferenceRecord[]): string {
  const headers = ['id','type','title','authors','year','journal','volume','issue','pages','doi','pmid','pmcid','isbn','issn','url','status'];
  const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers, ...records.map(r => headers.map(h => quote((r as any)[h])))].map(row => row.join(',')).join('\n');
}

export function exportReferencesAsRis(records: ReferenceRecord[]): string {
  return records.map(record => {
    const type = record.kind === 'BOOK' ? 'BOOK' : record.kind === 'REPORT' ? 'RPRT' : record.kind === 'WEBPAGE' ? 'ELEC' : 'JOUR';
    const lines = [`TY  - ${type}`];
    if (record.title) lines.push(`TI  - ${record.title}`);
    for (const author of risAuthors(record.authors)) lines.push(`AU  - ${author}`);
    if (record.journal) lines.push(`JO  - ${record.journal}`);
    if (record.year) lines.push(`PY  - ${record.year}`);
    if (record.volume) lines.push(`VL  - ${record.volume}`);
    if (record.issue) lines.push(`IS  - ${record.issue}`);
    if (record.pages) lines.push(`SP  - ${record.pages}`);
    if (record.doi) lines.push(`DO  - ${record.doi}`);
    if (record.pmid) lines.push(`AN  - PMID:${record.pmid}`);
    if (record.pmcid) lines.push(`AN  - PMCID:${record.pmcid}`);
    if (record.isbn) lines.push(`SN  - ${record.isbn}`);
    if (record.issn) lines.push(`SN  - ${record.issn}`);
    if (record.url) lines.push(`UR  - ${record.url}`);
    if (record.abstract) lines.push(`AB  - ${record.abstract}`);
    lines.push('ER  -');
    return lines.join('\n');
  }).join('\n\n');
}

export function exportReferencesAsBibtex(records: ReferenceRecord[]): string {
  return records.map(record => {
    const key = record.citeKey || `${(record.authors || 'ref').split(/[,; ]/)[0]}${record.year || 'nd'}${record.id}`;
    const fields: string[] = [];
    if (record.title) fields.push(`  title = {${escape(record.title)}}`);
    if (record.authors) fields.push(`  author = {${escape(record.authors.split(';').join(' and '))}}`);
    if (record.year) fields.push(`  year = {${record.year}}`);
    if (record.journal) fields.push(`  journal = {${escape(record.journal)}}`);
    if (record.volume) fields.push(`  volume = {${escape(String(record.volume))}}`);
    if (record.issue) fields.push(`  number = {${escape(String(record.issue))}}`);
    if (record.pages) fields.push(`  pages = {${escape(record.pages)}}`);
    if (record.doi) fields.push(`  doi = {${escape(record.doi)}}`);
    if (record.url) fields.push(`  url = {${escape(record.url)}}`);
    return `@article{${key},\n${fields.join(',\n')}\n}`;
  }).join('\n\n');
}

export function exportReferencesAsCslJson(records: ReferenceRecord[]): string {
  const items = records.map(record => ({
    id: record.id,
    type: record.kind === 'JOURNAL_ARTICLE' ? 'article-journal' : record.kind.toLowerCase(),
    title: record.title,
    author: (record.authors ?? '').split(';').map(author => {
      const parts = author.trim().split(/,\s*/);
      return parts.length > 1 ? { family: parts[0], given: parts.slice(1).join(', ') } : { literal: author.trim() };
    }).filter(a => Object.values(a).some(Boolean)),
    issued: record.year ? { 'date-parts': [[Number(record.year)]] } : undefined,
    'container-title': record.journal,
    volume: record.volume,
    issue: record.issue,
    page: record.pages,
    DOI: record.doi,
    URL: record.url,
    PMID: record.pmid,
    PMCID: record.pmcid,
    ISBN: record.isbn,
    ISSN: record.issn,
    abstract: record.abstract,
  }));
  return JSON.stringify(items, null, 2);
}
