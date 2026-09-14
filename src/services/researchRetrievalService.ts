export type RetrievalProvider = 'PUBMED' | 'CROSSREF';

export interface RetrievalQuery { provider: RetrievalProvider; query: string; limit?: number; }
export interface RetrievedReferenceCandidate { provider: RetrievalProvider; externalId?: string; doi?: string; pmid?: string; pmcid?: string; title: string; authors: string[]; journal?: string; year?: number; abstract?: string; url?: string; raw: unknown; }

type JsonRecord = Record<string, unknown>;
function text(value: unknown): string | undefined { return typeof value === 'string' && value.trim() ? value.trim() : undefined; }
function record(value: unknown): JsonRecord { return value && typeof value === 'object' ? value as JsonRecord : {}; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function authorName(author: unknown): string { const item = record(author); const family = text(item.lastname) ?? text(item.family) ?? ''; const given = text(item.forename) ?? text(item.given) ?? ''; return [family, given].filter(Boolean).join(', '); }
async function fetchJson(url: string): Promise<unknown> { const response = await fetch(url, { headers: { Accept: 'application/json' } }); if (!response.ok) throw new Error(`Retrieval feilet med HTTP ${response.status}.`); return response.json(); }

export async function searchCrossref({ query, limit = 10 }: Omit<RetrievalQuery, 'provider'>): Promise<RetrievedReferenceCandidate[]> {
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', query);
  url.searchParams.set('rows', String(Math.min(Math.max(limit, 1), 50)));
  const data = record(await fetchJson(url.toString()));
  const message = record(data.message);
  return array(message.items).map(itemValue => {
    const item = record(itemValue);
    const titles = array(item.title);
    const containers = array(item['container-title']);
    const published = record(item.published);
    const publishedParts = array(published['date-parts']);
    const firstDatePart = array(publishedParts[0]);
    const publishedPrint = record(item.publishedPrint);
    const printParts = array(publishedPrint['date-parts']);
    const firstPrintPart = array(printParts[0]);
    const rawYear = firstDatePart[0] ?? firstPrintPart[0];
    return {
      provider: 'CROSSREF' as const,
      externalId: text(item.DOI),
      doi: text(item.DOI),
      title: text(titles[0]) ?? '',
      authors: array(item.author).map(authorName).filter(Boolean),
      journal: text(containers[0]),
      year: typeof rawYear === 'number' ? rawYear : undefined,
      abstract: text(item.abstract),
      url: text(item.URL),
      raw: itemValue,
    };
  });
}

export async function searchPubMed({ query, limit = 10 }: Omit<RetrievalQuery, 'provider'>): Promise<RetrievedReferenceCandidate[]> {
  const searchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  searchUrl.searchParams.set('db', 'pubmed'); searchUrl.searchParams.set('term', query); searchUrl.searchParams.set('retmode', 'json'); searchUrl.searchParams.set('retmax', String(Math.min(Math.max(limit, 1), 50)));
  const search = record(await fetchJson(searchUrl.toString()));
  const searchResult = record(search.esearchresult);
  const ids = array(searchResult.idlist).filter((id): id is string => typeof id === 'string');
  if (!ids.length) return [];
  const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
  summaryUrl.searchParams.set('db', 'pubmed'); summaryUrl.searchParams.set('id', ids.join(',')); summaryUrl.searchParams.set('retmode', 'json');
  const summary = record(await fetchJson(summaryUrl.toString()));
  const summaryResult = record(summary.result);
  return ids.map(id => {
    const item = record(summaryResult[id]);
    const authors = array(item.authors).map(authorName).filter(Boolean);
    const articleids = array(item.articleids).map(record);
    const doi = articleids.find(x => x.idtype === 'doi')?.value;
    const pmcid = articleids.find(x => x.idtype === 'pmc')?.value;
    return { provider: 'PUBMED' as const, externalId: id, pmid: id, pmcid: text(pmcid), doi: text(doi), title: text(item.title) ?? '', authors, journal: text(item.fulljournalname) ?? text(item.source), year: Number.parseInt(String(item.pubdate ?? '').slice(0, 4), 10) || undefined, url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, raw: item };
  });
}

export async function searchResearch(query: RetrievalQuery): Promise<RetrievedReferenceCandidate[]> { return query.provider === 'PUBMED' ? searchPubMed(query) : searchCrossref(query); }
