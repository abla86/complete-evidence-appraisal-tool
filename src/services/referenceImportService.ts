import { createReferenceRecord, detectDuplicateCandidates, type ReferenceImportFormat, type ReferenceRecord } from './referenceHubService.ts';

function field(fields: Record<string, string>, key: string): string | undefined {
  const value = fields[key];
  return value?.trim() || undefined;
}

function parseRis(input: string): Partial<ReferenceRecord>[] {
  const blocks = input.split(/\r?\n\s*\r?\n(?=TY\s*-)/i).filter(Boolean);
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
    return {
      type: fields.TY === 'BOOK' ? 'book' : fields.TY === 'CHAP' ? 'chapter' : fields.TY === 'RPRT' ? 'report' : 'article-journal',
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
  const raw = JSON.parse(input) as unknown;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((value) => {
    const item = value as Record<string, any>;
    return {
      id: item.id,
      type: item.type || 'article-journal',
      title: item.title || '',
      authors: Array.isArray(item.author)
        ? item.author.map((a: Record<string, string>) => [a.family, a.given].filter(Boolean).join(', '))
        : [],
      year: item.issued?.['date-parts']?.[0]?.[0],
      journal: item['container-title'],
      volume: item.volume,
      issue: item.issue,
      pages: item.page,
      doi: item.DOI,
      url: item.URL,
      publisher: item.publisher,
      abstract: item.abstract,
    };
  });
}

function parseJson(input: string): Partial<ReferenceRecord>[] {
  const raw = JSON.parse(input) as unknown;
  if (Array.isArray(raw)) return raw as Partial<ReferenceRecord>[];
  if (raw && typeof raw === 'object' && 'records' in raw && Array.isArray((raw as { records?: unknown }).records)) {
    return (raw as { records: Partial<ReferenceRecord>[] }).records;
  }
  return [raw as Partial<ReferenceRecord>];
}

export function importReferences(input: string, format: ReferenceImportFormat): {
  references: ReferenceRecord[];
  duplicateCandidates: ReturnType<typeof detectDuplicateCandidates>;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  try {
    if (!input.trim()) throw new Error('Importfilen er tom.');
    const parsed = format === 'RIS'
      ? parseRis(input)
      : format === 'BIBTEX'
        ? parseBibtex(input)
        : format === 'CSL_JSON'
          ? parseCslJson(input)
          : format === 'JSON'
            ? parseJson(input)
            : (() => { throw new Error(`Formatet ${format} støttes ikke av denne importereren ennå.`); })();

    const references = parsed.map((entry, index) => createReferenceRecord({
      ...entry,
      id: entry.id || `import-${Date.now()}-${index}`,
      kind: normalizeKind(entry.type),
      importedFrom: [format],
    }));

    references.forEach((reference, index) => {
      if (!reference.title) warnings.push(`Referanse ${index + 1} mangler tittel.`);
      if (!reference.authors || !reference.authors.trim()) warnings.push(`Referanse ${index + 1} mangler forfatter.`);
      if (reference.verification !== 'VALIDATED') warnings.push(`Referanse ${index + 1} er ikke bibliografisk verifisert.`);
    });

    return {
      references,
      duplicateCandidates: detectDuplicateCandidates(references),
      warnings,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Importen kunne ikke tolkes.');
    return { references: [], duplicateCandidates: [], warnings, errors };
  }
}

function normalizeKind(type?: string): ReferenceRecord['kind'] {
  switch ((type || '').toLowerCase()) {
    case 'book': return 'BOOK';
    case 'report': return 'REPORT';
    case 'webpage': return 'WEBPAGE';
    case 'thesis': return 'THESIS';
    case 'article-journal': return 'JOURNAL_ARTICLE';
    default: return 'OTHER';
  }
}
