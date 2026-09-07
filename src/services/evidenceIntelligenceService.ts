interface CrossrefUpdate { type?: string; label?: string; }
interface CrossrefAuthor { given?: string; family?: string; }
interface CrossrefMessage {
  DOI?: string;
  title?: string[];
  author?: CrossrefAuthor[];
  ['container-title']?: string[];
  issued?: { ['date-parts']?: number[][] };
  publisher?: string;
  ['update-to']?: CrossrefUpdate[];
}
interface CrossrefWorkResponse { message?: CrossrefMessage; }
interface EuropePmcResult {
  id?: string; source?: string; doi?: string; pmid?: string; title?: string;
  authorString?: string; journalTitle?: string; pubYear?: string | number;
  isOpenAccess?: string; isRetracted?: string;
}
interface EuropePmcResponse {
  hitCount?: number;
  resultList?: { result?: EuropePmcResult[] };
}

export interface ExternalPublicationRecord {
  doi?: string; title: string; authors: string[]; journal: string; year?: number;
  publisher?: string;
  isPeerReviewed: 'VERIFIED' | 'LIKELY' | 'CANNOT_VERIFY' | 'NOT_PEER_REVIEWED';
  isRetracted: boolean; retractionDetails?: string; hasCorrection: boolean;
  verificationSource: 'CROSSREF' | 'EUROPE_PMC' | 'PUBMED' | 'MANUAL_OFFLINE';
}
export interface SearchQueryRecord {
  id: string; database: string; dateSearched: string; searchString: string;
  filters: Record<string, unknown>; totalResults: number; selectedCount: number; records: unknown[];
}

export class EvidenceIntelligenceService {
  static async verifyPublicationByDoi(doi: string): Promise<ExternalPublicationRecord | null> {
    const cleanDoi = doi.trim().replace(/^https?:\/\/doi\.org\//i, '');
    if (!cleanDoi) return null;
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const data = await response.json() as CrossrefWorkResponse;
    const item = data.message;
    if (!item) return null;
    const updates = Array.isArray(item['update-to']) ? item['update-to'] : [];
    const retraction = updates.find(u => String(u.type || '').toLowerCase().includes('retraction'));
    const correction = updates.find(u => /erratum|correction/i.test(String(u.type || '')));
    return {
      doi: item.DOI,
      title: item.title?.[0] || '',
      authors: (item.author || []).map(a => [a.given, a.family].filter(Boolean).join(' ')),
      journal: item['container-title']?.[0] || '',
      year: item.issued?.['date-parts']?.[0]?.[0],
      publisher: item.publisher,
      isPeerReviewed: 'CANNOT_VERIFY',
      isRetracted: Boolean(retraction),
      retractionDetails: retraction ? String(retraction.label || retraction.type || 'Retraction record found') : undefined,
      hasCorrection: Boolean(correction),
      verificationSource: 'CROSSREF'
    };
  }

  static async searchEuropePmc(query: string, pageSize = 25, page = 1) {
    const normalized = query.trim();
    if (!normalized) throw new Error('Søketekst mangler.');
    const url = new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search');
    url.searchParams.set('query', normalized);
    url.searchParams.set('format', 'json');
    url.searchParams.set('pageSize', String(Math.min(Math.max(pageSize, 1), 100)));
    url.searchParams.set('page', String(Math.max(page, 1)));
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Europe PMC svarte med HTTP ${response.status}.`);
    const data = await response.json() as EuropePmcResponse;
    const results = (data.resultList?.result || []).map(r => ({
      id: r.id, source: r.source, doi: r.doi, pmid: r.pmid, title: r.title,
      authors: r.authorString, journal: r.journalTitle, year: r.pubYear,
      isOpenAccess: r.isOpenAccess === 'Y', isRetracted: r.isRetracted === 'Y'
    }));
    return { total: Number(data.hitCount || 0), results, query: normalized, source: 'EUROPE_PMC' };
  }

  static createSearchRecord(database: string, searchString: string, filters: Record<string, unknown>, totalResults: number, selectedCount: number, records: unknown[]): SearchQueryRecord {
    return { id: `search-${crypto.randomUUID()}`, database, dateSearched: new Date().toISOString(), searchString, filters, totalResults, selectedCount, records };
  }
}
