import { createReferenceRecord, detectDuplicateCandidates, type ReferenceImportFormat, type ReferenceRecord } from './referenceHubService.ts';

function field(fields: Record<string, string>, key: string): string | undefined {
  const value = fields[key];
  return value?.trim() || undefined;
}

function mapAuthors(value?: string): string {
  return (value || '')
    .split(/\s+and\s+/i)
    .map(v => v.trim())
    .filter(Boolean)
    .join('; ');
}

function normalizeAuthors(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .join('; ');
  }
  return String(value ?? '').trim();
}

function normalizeKind(type?: string): ReferenceRecord['kind'] {
  switch ((type || '').toLowerCase()) {
    case 'book': case '6': return 'BOOK';
    case 'report': case 'report-type': return 'REPORT';
    case 'webpage': case '12': return 'WEBPAGE';
    case 'thesis': case '32': return 'THESIS';
    case 'article-journal': case 'journal article': case '17': case 'journal': case 'jour': return 'JOURNAL_ARTICLE';
    case 'law': return 'LAW';
    case 'regulation': return 'REGULATION';
    case 'guideline': return 'GUIDELINE';
    default: return 'JOURNAL_ARTICLE';
  }
}

function parseRis(input: string): Array<Partial<ReferenceRecord> & { sourceType?: string }> {
  const normalized = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const blocks = normalized
    .split(/\n\s*(?=TY\s*-\s*)/i)
    .map(block => block.trim())
    .filter(block => /^TY\s*-\s*/im.test(block));

  return blocks.map(block => {
    const fields: Record<string, string> = {};
    const authors: string[] = [];

    for (const line of block.split('\n')) {
      const match = line.match(/^([A-Z0-9]{2})\s*-\s?(.*)$/);
      if (!match) continue;
      const [, tag, value] = match;
      if (tag === 'AU' || tag === 'A1') authors.push(value.trim());
      else if (tag !== 'ER') fields[tag] = value.trim();
    }

    return {
      title: field(fields, 'TI') || field(fields, 'T1') || '',
      authors: authors.join('; '),
      journal: field(fields, 'JO') || field(fields, 'T2'),
      year: Number(field(fields, 'PY')) || undefined,
      volume: field(fields, 'VL'),
      issue: field(fields, 'IS'),
      pages: field(fields, 'SP') && field(fields, 'EP')
        ? `${field(fields, 'SP')}-${field(fields, 'EP')}`
        : field(fields, 'SP'),
      doi: field(fields, 'DO'),
      issn: field(fields, 'SN'),
      url: field(fields, 'UR'),
      abstract: field(fields, 'AB'),
      sourceType: field(fields, 'TY'),
    };
  });
}

function parseBibtex(input: string): Array<Partial<ReferenceRecord> & { sourceType?: string }> {
  return [...input.matchAll(/@([^{]+)\{([^,]+),([\s\S]*?)\n\}/g)].map(match => {
    const entryType = match[1].trim().toLowerCase();
    const body = match[3];
    const values: Record<string, string> = {};
    for (const item of body.matchAll(/([A-Za-z][\w-]*)\s*=\s*[\{\"]([\s\S]*?)[\}\"]\s*,?/g)) {
      values[item[1].toLowerCase()] = item[2].trim();
    }
    return {
      id: match[2].trim(),
      title: values.title || '',
      authors: mapAuthors(values.author),
      journal: values.journal,
      year: Number(values.year) || undefined,
      volume: values.volume,
      issue: values.number,
      pages: values.pages,
      doi: values.doi,
      issn: values.issn,
      url: values.url,
      publisher: values.publisher,
      abstract: values.abstract,
      language: values.language,
      sourceType: entryType,
    };
  });
}

function parseCslJson(input: string): Array<Partial<ReferenceRecord> & { sourceType?: string }> {
  const raw = JSON.parse(input) as unknown;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map(value => {
    const item = value as Record<string, unknown>;
    return {
      id: typeof item.id === 'string' ? item.id : undefined,
      title: typeof item.title === 'string' ? item.title : '',
      authors: normalizeAuthors(Array.isArray(item.author)
        ? item.author.map(author => {
            const a = author as Record<string, unknown>;
            return [a.family, a.given].filter(Boolean).join(', ');
          })
        : []),
      year: Number((item.issued as { 'date-parts'?: number[][] } | undefined)?.['date-parts']?.[0]?.[0]) || undefined,
      journal: typeof item['container-title'] === 'string' ? item['container-title'] : undefined,
      volume: typeof item.volume === 'string' || typeof item.volume === 'number' ? item.volume : undefined,
      issue: typeof item.issue === 'string' || typeof item.issue === 'number' ? item.issue : undefined,
      pages: typeof item.page === 'string' ? item.page : undefined,
      doi: typeof item.DOI === 'string' ? item.DOI : undefined,
      pmid: typeof item.PMID === 'string' ? item.PMID : typeof item.pmid === 'string' ? item.pmid : undefined,
      pmcid: typeof item.PMCID === 'string' ? item.PMCID : typeof item.pmcid === 'string' ? item.pmcid : undefined,
      isbn: typeof item.ISBN === 'string' ? item.ISBN : typeof item.isbn === 'string' ? item.isbn : undefined,
      issn: typeof item.ISSN === 'string' ? item.ISSN : typeof item.issn === 'string' ? item.issn : undefined,
      url: typeof item.URL === 'string' ? item.URL : undefined,
      publisher: typeof item.publisher === 'string' ? item.publisher : undefined,
      abstract: typeof item.abstract === 'string' ? item.abstract : undefined,
      language: typeof item.language === 'string' ? item.language : undefined,
      sourceType: typeof item.type === 'string' ? item.type : undefined,
    };
  });
}

function parseJson(input: string): Array<Partial<ReferenceRecord> & { sourceType?: string }> {
  const raw = JSON.parse(input) as unknown;
  if (Array.isArray(raw)) return raw.map(value => value as Partial<ReferenceRecord> & { sourceType?: string });
  if (raw && typeof raw === 'object' && 'records' in raw && Array.isArray((raw as { records?: unknown }).records)) {
    return (raw as { records: Array<Partial<ReferenceRecord> & { sourceType?: string }> }).records;
  }
  return [raw as Partial<ReferenceRecord> & { sourceType?: string }];
}

function parseEndnoteXml(input: string): Array<Partial<ReferenceRecord> & { sourceType?: string }> {
  const recordBlocks = [...input.matchAll(/<record\b[^>]*>([\s\S]*?)<\/record>/gi)].map(match => match[1]);
  const esc = (value: string) => value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const text = (block: string, tag: string) => {
    const match = block.match(new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i'));
    return match ? esc(match[1].replace(/<[^>]+>/g, '').trim()) : undefined;
  };
  return recordBlocks.map(block => ({
    id: text(block, 'rec-number'),
    title: text(block, 'title'),
    authors: [...block.matchAll(/<author>([\s\S]*?)<\/author>/gi)]
      .map(m => esc(m[1].replace(/<[^>]+>/g, '').trim()))
      .filter(Boolean)
      .join('; '),
    journal: text(block, 'secondary-title'),
    year: Number(text(block, 'year')) || undefined,
    volume: text(block, 'volume'),
    issue: text(block, 'number'),
    pages: text(block, 'pages'),
    doi: text(block, 'electronic-resource-num'),
    issn: text(block, 'isbn'),
    url: text(block, 'url'),
    abstract: text(block, 'abstract'),
    sourceType: text(block, 'ref-type'),
  }));
}

function parseCsv(input: string): Array<Partial<ReferenceRecord> & { sourceType?: string }> {
  const rows = input.split(/\r?\n/).filter(Boolean);
  if (rows.length < 2) return [];
  const header = rows[0].split(',').map(v => v.trim().toLowerCase());
  return rows.slice(1).map(line => {
    const cells = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const get = (names: string[]) => {
      const index = header.findIndex(h => names.includes(h));
      return index >= 0 ? cells[index] || undefined : undefined;
    };
    return {
      title: get(['title', 'ti']),
      authors: get(['authors', 'author', 'au'])?.split(';').map(v => v.trim()).filter(Boolean).join('; '),
      journal: get(['journal', 'jo']),
      year: Number(get(['year', 'py'])) || undefined,
      volume: get(['volume', 'vl']),
      issue: get(['issue', 'is']),
      pages: get(['pages']),
      doi: get(['doi', 'do']),
      pmid: get(['pmid']),
      pmcid: get(['pmcid']),
      isbn: get(['isbn']),
      issn: get(['issn']),
      url: get(['url', 'ur']),
      abstract: get(['abstract', 'ab']),
    };
  });
}

export function importReferences(input: string, format: ReferenceImportFormat): { references: ReferenceRecord[]; duplicateCandidates: ReturnType<typeof detectDuplicateCandidates>; warnings: string[]; errors: string[] } {
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
          : format === 'ENDNOTE_XML'
            ? parseEndnoteXml(input)
            : format === 'CSV'
              ? parseCsv(input)
              : format === 'JSON'
                ? parseJson(input)
                : (() => { throw new Error(`Formatet ${format} krever metadataoppslag eller manuell registrering.`); })();

    if (parsed.length === 0) warnings.push('Ingen bibliografiske poster ble funnet i importen.');

    const references = parsed.map((entry, index) => {
      const { sourceType, ...shared } = entry;
      return createReferenceRecord({
        ...shared,
        id: entry.id || `import-${Date.now()}-${index}`,
        authors: normalizeAuthors(entry.authors),
        kind: normalizeKind(sourceType || entry.shortTitle),
        importedFrom: [format],
      });
    });

    references.forEach((reference, index) => {
      if (!reference.title) warnings.push(`Referanse ${index + 1} mangler tittel.`);
      if (!reference.authors || !reference.authors.trim()) warnings.push(`Referanse ${index + 1} mangler forfatter.`);
      if (reference.verification !== 'VALIDATED') warnings.push(`Referanse ${index + 1} er ikke bibliografisk verifisert.`);
    });

    return { references, duplicateCandidates: detectDuplicateCandidates(references), warnings, errors };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Importen kunne ikke tolkes.');
    return { references: [], duplicateCandidates: [], warnings, errors };
  }
}
