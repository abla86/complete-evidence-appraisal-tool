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
  return (data?.message?.items ?? []).map((item: unknown) => ({
    provider: 'CROSSREF' as const,
    externalId: text(item?.DOI),
    doi: text(item?.DOI),
    title: text(item?.title?.[0]) ?? '',
    authors: (item?.author ?? []).map(authorName).filter(Boolean),
    journal: text(item?.['container-title']?.[0]),
    year: item?.published?.['date-parts']?.[0]?.[0] ?? item?.publishedPrint?.['date-parts']?.[0]?.[0],
    abstract: text(item?.abstract),
    url: text(item?.URL),
    raw: item,
  }));
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


