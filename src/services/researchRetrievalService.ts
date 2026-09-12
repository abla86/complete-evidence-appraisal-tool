export type RetrievalProvider = 'PUBMED' | 'CROSSREF';

export interface RetrievalQuery {
  provider: RetrievalProvider;
  query: string;
  limit?: number;
}

export interface RetrievedReferenceCandidate {
  provider: RetrievalProvider;
  externalId?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  abstract?: string;
  url?: string;
  raw: unknown;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function authorName(author: unknown): string {
  const record = author && typeof author === 'object' ? author as Record<string, unknown> : {};
  const family = text(record.lastname) ?? text(record.family) ?? '';
  const given = text(record.forename) ?? text(record.given) ?? '';
  return [family, given].filter(Boolean).join(', ');
}

async function fetchJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Retrieval feilet med HTTP ${response.status}.`);
  return response.json();
}

export async function searchCrossref({ query, limit = 10 }: Omit<RetrievalQuery, 'provider'>): Promise<RetrievedReferenceCandidate[]> {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', query);
  url.searchParams.set('rows', String(Math.min(Math.max(limit, 1), 50)));
  const data = await fetchJson(url.toString()) as { message?: { items?: unknown[] } };
  return (data?.message?.items ?? []).map((item: unknown) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const titles = Array.isArray(record.title) ? record.title : [];
    const containerTitles = Array.isArray(record['container-title']) ? record['container-title'] : [];
    const authors = Array.isArray(record.author) ? record.author : [];
    const published = record.published && typeof record.published === 'object' ? record.published as Record<string, unknown> : {};
    const publishedPrint = record.publishedPrint && typeof record.publishedPrint === 'object' ? record.publishedPrint as Record<string, unknown> : {};
    const publishedParts = Array.isArray(published['date-parts']) ? published['date-parts'] as unknown[] : [];
    const publishedPrintParts = Array.isArray(publishedPrint['date-parts']) ? publishedPrint['date-parts'] as unknown[] : [];
    const yearFromParts = (parts: unknown[]) => {
      const first = parts[0];
      if (!Array.isArray(first)) return undefined;
      const year = first[0];
      return typeof year === 'number' ? year : undefined;
    };
    return {
    provider: 'CROSSREF' as const,
    externalId: text(record.DOI),
    doi: text(record.DOI),
    title: text(titles[0]) ?? '',
    authors: authors.map(authorName).filter(Boolean),
    journal: text(containerTitles[0]),
    year: yearFromParts(publishedParts) ?? yearFromParts(publishedPrintParts),
    abstract: text(record.abstract),
    url: text(record.URL),
    raw: item,
  };});
}

export async function searchPubMed({ query, limit = 10 }: Omit<RetrievalQuery, 'provider'>): Promise<RetrievedReferenceCandidate[]> {
  const searchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  searchUrl.searchParams.set('db', 'pubmed');
  searchUrl.searchParams.set('term', query);
  searchUrl.searchParams.set('retmode', 'json');
  searchUrl.searchParams.set('retmax', String(Math.min(Math.max(limit, 1), 50)));
  const search = await fetchJson(searchUrl.toString()) as { esearchresult?: { idlist?: string[] } };
  const ids: string[] = search?.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
  summaryUrl.searchParams.set('db', 'pubmed');
  summaryUrl.searchParams.set('id', ids.join(','));
  summaryUrl.searchParams.set('retmode', 'json');
  const summary = await fetchJson(summaryUrl.toString()) as { result?: Record<string, unknown> };

  return ids.map(id => {
    const item = (summary?.result?.[id] ?? {}) as Record<string, unknown>;
    const authors = (Array.isArray(item.authors) ? item.authors : []).map(authorName).filter(Boolean);
    const articleids = Array.isArray(item.articleids) ? item.articleids.map(value => value && typeof value === 'object' ? value as { idtype?: unknown; value?: unknown } : {}) : [];
    const doi = articleids.find(x => x.idtype === 'doi')?.value;
    const pmcid = articleids.find(x => x.idtype === 'pmc')?.value;
    return {
      provider: 'PUBMED' as const,
      externalId: id,
      pmid: id,
      pmcid: text(pmcid),
      doi: text(doi),
      title: text(item?.title) ?? '',
      authors,
      journal: text(item?.fulljournalname) ?? text(item?.source),
      year: Number.parseInt(String(item?.pubdate ?? '').slice(0, 4), 10) || undefined,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      raw: item,
    };
  });
}

export async function searchResearch(query: RetrievalQuery): Promise<RetrievedReferenceCandidate[]> {
  return query.provider === 'PUBMED' ? searchPubMed(query) : searchCrossref(query);
}

