export interface ResearchSearchRecord {
  id: string;
  database: 'PUBMED' | 'EUROPE_PMC' | 'CROSSREF' | 'OPENALEX';
  query: string;
  searchedAt: string;
  totalResults: number;
  results: ResearchResult[];
}

export interface ResearchResult {
  source: string;
  externalId?: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  abstract?: string;
  url?: string;
  studyDesign?: string;
}

function cleanDoi(value?: string): string | undefined {
  const doi = value?.trim().replace(/^doi:\s*/i, '').replace(/^https?:\/\/doi\.org\//i, '').replace(/[.,;:)]+$/, '');
  return doi || undefined;
}

export async function searchPubMed(query: string, maxResults = 20): Promise<ResearchSearchRecord> {
  const q = query.trim();
  if (!q) throw new Error('PubMed-søk mangler.');
  const searchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
  searchUrl.searchParams.set('db', 'pubmed');
  searchUrl.searchParams.set('term', q);
  searchUrl.searchParams.set('retmode', 'json');
  searchUrl.searchParams.set('retmax', String(Math.min(Math.max(maxResults, 1), 100)));
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) throw new Error(`PubMed-søk feilet (${searchResponse.status}).`);
  const searchData = await searchResponse.json() as any;
  const ids: string[] = searchData.esearchresult?.idlist ?? [];
  const results = await fetchPubMedRecords(ids);
  return { id: crypto.randomUUID(), database: 'PUBMED', query: q, searchedAt: new Date().toISOString(), totalResults: Number(searchData.esearchresult?.count ?? results.length), results };
}

export async function fetchPubMedRecords(pmids: string[]): Promise<ResearchResult[]> {
  if (!pmids.length) return [];
  const url = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
  url.searchParams.set('db', 'pubmed');
  url.searchParams.set('id', pmids.join(','));
  url.searchParams.set('retmode', 'json');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PubMed metadata feilet (${response.status}).`);
  const data = await response.json() as any;
  return pmids.map(pmid => {
    const item = data.result?.[pmid];
    return {
      source: 'PUBMED',
      externalId: pmid,
      pmid,
      title: item?.title ?? '',
      authors: (item?.authors ?? []).map((a: any) => a?.name).filter(Boolean),
      journal: item?.fulljournalname || item?.source,
      year: Number(String(item?.pubdate ?? '').slice(0, 4)) || undefined,
      doi: cleanDoi((item?.articleids ?? []).find((x: any) => x?.idtype === 'doi')?.value),
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  });
}

export async function searchOpenAlex(query: string, maxResults = 20): Promise<ResearchSearchRecord> {
  const q = query.trim();
  if (!q) throw new Error('OpenAlex-søk mangler.');
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', q);
  url.searchParams.set('per-page', String(Math.min(Math.max(maxResults, 1), 100)));
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`OpenAlex-søk feilet (${response.status}).`);
  const data = await response.json() as any;
  const results: ResearchResult[] = (data.results ?? []).map((item: any) => ({
    source: 'OPENALEX',
    externalId: item.id,
    title: item.title ?? '',
    authors: (item.authorships ?? []).map((a: any) => a?.author?.display_name).filter(Boolean),
    journal: item.primary_location?.source?.display_name,
    year: item.publication_year,
    doi: cleanDoi(item.doi),
    url: item.primary_location?.landing_page_url || item.doi,
    abstract: item.abstract_inverted_index ? reconstructAbstract(item.abstract_inverted_index) : undefined,
  }));
  return { id: crypto.randomUUID(), database: 'OPENALEX', query: q, searchedAt: new Date().toISOString(), totalResults: Number(data.meta?.count ?? results.length), results };
}

function reconstructAbstract(index: Record<string, number[]>): string {
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) for (const position of positions) words[position] = word;
  return words.filter(Boolean).join(' ');
}

export async function verifyDoiMetadata(doi: string): Promise<ResearchResult | null> {
  const clean = cleanDoi(doi);
  if (!clean) return null;
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(clean)}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  const item = (await response.json() as any).message;
  if (!item) return null;
  return {
    source: 'CROSSREF',
    externalId: item.DOI,
    title: Array.isArray(item.title) ? item.title[0] : item.title ?? '',
    authors: Array.isArray(item.author) ? item.author.map((a: any) => [a?.given, a?.family].filter(Boolean).join(' ')) : [],
    journal: Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'],
    year: item.issued?.['date-parts']?.[0]?.[0],
    doi: item.DOI,
    url: `https://doi.org/${item.DOI}`,
  };
}
