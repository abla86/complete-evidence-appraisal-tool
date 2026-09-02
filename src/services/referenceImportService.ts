import { createReferenceRecord, detectDuplicateCandidates, type ReferenceImportFormat, type ReferenceRecord } from './referenceHubService.ts';

function field(fields: Record<string, string>, key: string): string | undefined {
  const value = fields[key];
  return value?.trim() || undefined;
}

function parseRis(input: string): Partial<ReferenceRecord>[] {
  const blocks = input.split(/\n\s*\n/).filter(Boolean);
  return blocks.map(block => {
    const fields: Record<string, string> = {};
    const authors: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9]{2})\s*-\s?(.*)$/);
      if (!match) continue;
      const [, tag, value] = match;
      if (tag === 'AU' || tag === 'A1') authors.push(value.trim());
      else fields[tag] = value.trim();
    }
    const type = fields.TY === 'BOOK' ? 'book' : fields.TY === 'CHAP' ? 'chapter' : fields.TY === 'RPRT' ? 'report' : 'article-journal';
    return {
      type,
      title: field(fields, 'TI') || field(fields, 'T1') || '',
      authors,
      journal: field(fields, 'JO') || field(fields, 'T2'),
      year: Number(field(fields, 'PY')) || undefined,
      volume: field(fields, 'VL'),
      issue: field(fields, 'IS'),
      pages: field(fields, 'SP') && field(fields, 'EP') ? `${field(fields, 'SP')}-${field(fields, 'EP')}` : field(fields, 'SP'),
      doi: field(fields, 'DO'),
      issn: field(fields, 'SN'),
      url: field(fields, 'UR'),
      abstract: field(fields, 'AB'),
    };
  });
}

function parseBibtex(input: string): Partial<ReferenceRecord>[] {
  return [...input.matchAll(/@[^\{]+\{([^,]+),([\s\S]*?)\n\}/g)].map(match => {
    const body = match[2];
    const values: Record<string, string> = {};
    for (const item of body.matchAll(/([A-Za-z][\w-]*)\s*=\s*[\{\"]([\s\S]*?)[\}\"]\s*,?/g)) {
      values[item[1].toLowerCase()] = item[2].trim();
    }
    const authors = (values.author || '').split(/\s+and\s+/i).map(a => a.trim()).filter(Boolean);
    return {
      id: match[1].trim(),
      type: values.entrytype || 'article-journal',
      title: values.title || '',
      authors,
      journal: values.journal,
      year: Number(values.year) || undefined,
      volume: values.volume,
      issue: values.number,
      pages: values.pages,
      doi: values.doi,
      url: values.url,
      publisher: values.publisher,
    };
  });
}

function parseCslJson(input: string): Partial<ReferenceRecord>[] {
  const raw = JSON.parse(input);
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map(item => ({
    id: item.id,
    type: item.type || 'article-journal',
    title: item.title || '',
    authors: (item.author || []).map((a: any) => [a.family, a.given].filter(Boolean).join(', ')),
    year: item.issued?.['date-parts']?.[0]?.[0],
    journal: item['container-title'],
    volume: item.volume,
    issue: item.issue,
    pages: item.page,
    doi: item.DOI,
    url: item.URL,
    publisher: item.publisher,
    abstract: item.abstract,
  }));
}

export function importReferences(input: string, format: ReferenceImportFormat): { references: ReferenceRecord[]; duplicateCandidates: ReturnType<typeof detectDuplicateCandidates>; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];
  try {
    const parsed = format === 'RIS' ? parseRis(input) : format === 'BIBTEX' ? parseBibtex(input) : format === 'CSL_JSON' ? parseCslJson(input) : JSON.parse(input);
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    const references = entries.map((entry: any, index: number) => createReferenceRecord({ ...entry, id: entry.id || `import-${Date.now()}-${index}` }, format));
    references.forEach((r, i) => { if (!r.title) warnings.push(`Referanse ${i + 1} mangler tittel.`); });
    return { references, duplicateCandidates: detectDuplicateCandidates(references), warnings, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Importen kunne ikke tolkes.');
    return { references: [], duplicateCandidates: [], warnings, errors };
  }
}
