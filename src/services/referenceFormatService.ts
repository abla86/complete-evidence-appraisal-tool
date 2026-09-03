import type { ReferenceRecord } from './referenceHubService.ts';

export type ReferenceExportFormat = 'RIS' | 'BIBTEX' | 'CSL_JSON' | 'ENDNOTE_XML' | 'CSV' | 'JSON';

function esc(value: unknown): string {
  return String(value ?? '').replace(/[\\{}]/g, '\\$&');
}

function authors(record: ReferenceRecord): string[] {
  const raw = record.authors || '';
  return raw.split(/\s*;\s*|\s+\band\s+|\s+og\s+/i).map(a => a.trim()).filter(Boolean);
}

export function toRis(record: ReferenceRecord): string {
  const lines = [
    'TY  - JOUR',
    ...authors(record).map(a => `AU  - ${a}`),
    record.title ? `TI  - ${record.title}` : '',
    record.journal ? `JO  - ${record.journal}` : '',
    record.year ? `PY  - ${record.year}` : '',
    record.volume ? `VL  - ${record.volume}` : '',
    record.issue ? `IS  - ${record.issue}` : '',
    record.pages ? `SP  - ${String(record.pages).split('-')[0]}` : '',
    String(record.pages ?? '').includes('-') ? `EP  - ${String(record.pages).split('-').slice(-1)[0]}` : '',
    record.doi ? `DO  - ${record.doi}` : '',
    record.issn ? `SN  - ${record.issn}` : '',
    record.url ? `UR  - ${record.url}` : '',
    record.abstract ? `AB  - ${record.abstract}` : '',
    `ER  -`,
  ];
  return lines.filter(Boolean).join('\n');
}

export function toBibtex(record: ReferenceRecord): string {
  const key = record.citeKey || `${(authors(record)[0] || 'ref').replace(/\W+/g, '')}${record.year || ''}`;
  const author = authors(record).join(' and ');
  return [
    `@article{${key},`,
    `  author = {${esc(author)}},`,
    `  title = {${esc(record.title)}},`,
    record.journal ? `  journal = {${esc(record.journal)}},` : '',
    record.year ? `  year = {${record.year}},` : '',
    record.volume ? `  volume = {${esc(record.volume)}},` : '',
    record.issue ? `  number = {${esc(record.issue)}},` : '',
    record.pages ? `  pages = {${esc(record.pages)}},` : '',
    record.doi ? `  doi = {${esc(record.doi)}},` : '',
    record.url ? `  url = {${esc(record.url)}},` : '',
    `}`,
  ].filter(Boolean).join('\n');
}

export function toCslJson(record: ReferenceRecord): string {
  const parsed = {
    id: record.id,
    type: 'article-journal',
    title: record.title,
    author: authors(record).map(name => {
      const [family, ...given] = name.includes(',') ? name.split(',').map(v => v.trim()) : name.split(' ').reverse();
      return { family, given: given.reverse().join(' ') };
    }),
    issued: record.year ? { 'date-parts': [[Number(record.year)]] } : undefined,
    'container-title': record.journal,
    volume: record.volume ? String(record.volume) : undefined,
    issue: record.issue ? String(record.issue) : undefined,
    page: record.pages,
    DOI: record.doi,
    URL: record.url,
    publisher: record.publisher,
  };
  return JSON.stringify(parsed, null, 2);
}

export function toEndNoteXml(records: ReferenceRecord[]): string {
  const xml = records.map(record => {
    const authorXml = authors(record).map(a => `<author>${escapeXml(a)}</author>`).join('');
    return `<record><ref-type name="Journal Article">17</ref-type><contributors>${authorXml}</contributors><titles><title>${escapeXml(record.title)}</title>${record.journal ? `<secondary-title>${escapeXml(record.journal)}</secondary-title>` : ''}</titles>${record.year ? `<dates><year>${escapeXml(record.year)}</year></dates>` : ''}${record.volume ? `<volume>${escapeXml(record.volume)}</volume>` : ''}${record.issue ? `<number>${escapeXml(record.issue)}</number>` : ''}${record.pages ? `<pages>${escapeXml(record.pages)}</pages>` : ''}${record.doi ? `<electronic-resource-num>${escapeXml(record.doi)}</electronic-resource-num>` : ''}${record.url ? `<urls><related-urls><url>${escapeXml(record.url)}</url></related-urls></urls>` : ''}</record>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<xml><records>${xml}</records></xml>`;
}

export function toCsv(records: ReferenceRecord[]): string {
  const headers = ['id','kind','title','authors','year','journal','volume','issue','pages','doi','pmid','isbn','issn','url','verification'];
  const quote = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...records.map(r => headers.map(h => quote(h === 'authors' ? r.authors : (r as unknown as Record<string, unknown>)[h])).join(','))].join('\n');
}

function escapeXml(value: unknown): string {
  return String(value ?? '').replace(/[<>&'\"]/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]!));
}

export function exportReferences(records: ReferenceRecord[], format: ReferenceExportFormat): string {
  switch (format) {
    case 'RIS': return records.map(toRis).join('\n\n');
    case 'BIBTEX': return records.map(toBibtex).join('\n\n');
    case 'CSL_JSON': return JSON.stringify(records.map(r => JSON.parse(toCslJson(r))), null, 2);
    case 'ENDNOTE_XML': return toEndNoteXml(records);
    case 'CSV': return toCsv(records);
    case 'JSON': return JSON.stringify(records, null, 2);
  }
}
