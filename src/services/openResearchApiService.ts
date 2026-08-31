/**
 * Open Scientific Research Database API Service
 * 
 * Provides unified, open-access access to both Norwegian and international
 * free, open scientific databases, repositories, and archives:
 * 
 * 1. OpenAlex (250M+ works, global & Norwegian research, universities, full open access)
 * 2. Europe PMC (35M+ open biomedical and life science publications, full-text links)
 * 3. Crossref (150M+ open DOIs across medicine, humanities, social sciences, natural sciences)
 * 4. PubMed / NCBI (36M+ biomedical and clinical records via Entrez API)
 * 5. Semantic Scholar (200M+ academic papers with citation counts and OA PDF links)
 * 6. DOAJ (Directory of Open Access Journals, 20k+ peer-reviewed OA journals)
 * 7. Norske Åpne Forskningsarkiver (UiO, UiB, NTNU, UiT, Cristin / NVA via OpenAlex NO filter)
 * 8. Preprints & Open Science (arXiv, bioRxiv, medRxiv via OpenAlex / Crossref / Europe PMC)
 * 9. Multi-Database Universal Search (Parallel multi-database federated query & deduplication)
 */

export interface OpenResearchRecord {
  id: string;
  source: 
    | 'OpenAlex (Global & Norsk)' 
    | 'Europe PMC' 
    | 'Crossref' 
    | 'PubMed / NCBI' 
    | 'Semantic Scholar' 
    | 'DOAJ (Open Access)' 
    | 'Norske Forskningsarkiv (NVA/Cristin)' 
    | 'Preprints (arXiv/medRxiv)'
    | 'Multi-Database Føderert';
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi?: string;
  doiUrl?: string;
  pmid?: string;
  openAlexId?: string;
  abstract?: string;
  isOpenAccess?: boolean;
  openAccessPdfUrl?: string;
  landingPageUrl?: string;
  citationCount?: number;
  institutionAffiliation?: string;
  isNorwegianResearch?: boolean;
  studyTypeHint?: string;
  isImported?: boolean;
}

export interface SearchDatabaseOption {
  id: string;
  name: string;
  description: string;
  badge: string;
  isNorwegianFocused?: boolean;
  isOpenAccessGuaranteed?: boolean;
}

export const OPEN_DATABASES: SearchDatabaseOption[] = [
  {
    id: 'universal',
    name: 'Føderert Multi-Søk (Alle åpne baser samtidig)',
    description: 'Søker simultant i OpenAlex, Europe PMC, Crossref, PubMed, Semantic Scholar og Norske arkiver.',
    badge: 'Universell'
  },
  {
    id: 'openalex',
    name: 'OpenAlex (Global & Åpen Vitenskap)',
    description: 'Verdens største åpne bibliografiske database med 250M+ vitenskapelige artikler, forfattere og institusjoner.',
    badge: '250M+ artikler'
  },
  {
    id: 'norwegian',
    name: 'Norske Åpne Forskningsarkiv (NVA / Cristin / Univ)',
    description: 'Filtrert søk for norskprodusert helse-, samfunns- og naturvitenskapelig forskning (UiO, NTNU, UiB, UiT m.fl.).',
    badge: 'Norsk Forskning',
    isNorwegianFocused: true
  },
  {
    id: 'europepmc',
    name: 'Europe PMC (Åpen biomedisin & helse)',
    description: 'Europeisk åpen kilde for 35M+ medisinske artikler, kliniske studier og systematiske oversikter.',
    badge: 'Fulltekst & OA'
  },
  {
    id: 'crossref',
    name: 'Crossref (Global DOI-register)',
    description: 'Det offisielle åpne DOI-registeret for vitenskapelige tidsskrifter over alle akademiske disipliner.',
    badge: '150M+ DOIs'
  },
  {
    id: 'pubmed',
    name: 'PubMed / NCBI (Medisinsk litteratur)',
    description: 'US National Library of Medicine med MEDLINE, kliniske studier og helseforskning.',
    badge: 'MEDLINE'
  },
  {
    id: 'semanticscholar',
    name: 'Semantic Scholar (Akademisk siteringsgraf)',
    description: 'Åpen akademisk søkemotor fra Allen AI med siteringstall og direkte lenker til åpne PDF-er.',
    badge: 'AI-beriket'
  },
  {
    id: 'doaj',
    name: 'DOAJ (Directory of Open Access Journals)',
    description: 'Kvalitetssikret register over gratis, åpne fagfellevurderte tidsskrifter globalt.',
    badge: '100% Gull OA',
    isOpenAccessGuaranteed: true
  },
  {
    id: 'preprints',
    name: 'Preprint-arkiver (medRxiv, bioRxiv, arXiv)',
    description: 'Åpne preprints og forhåndspublikasjoner for rask tilgang til nyeste forskningsresultater.',
    badge: 'Preprints'
  }
];

export class OpenResearchApiService {
  /**
   * Search OpenAlex API
   */
  public static async searchOpenAlex(query: string, norwegianOnly = false, limit = 15): Promise<OpenResearchRecord[]> {
    try {
      let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${limit}`;
      
      if (norwegianOnly) {
        url = `https://api.openalex.org/works?filter=authorships.institutions.country_code:NO,default.search:${encodeURIComponent(query)}&per_page=${limit}`;
      }

      const res = await fetch(url, { headers: { 'User-Agent': 'EvidenceAppraisalTool/2.0 (mailto:researcher@evidenceappraisal.org)' } });
      if (!res.ok) throw new Error(`OpenAlex svarte med status ${res.status}`);
      const data = await res.json();

      const results: OpenResearchRecord[] = (data.results || []).map((w: any) => {
        const authors = (w.authorships || [])
          .map((a: any) => a.author?.display_name)
          .filter(Boolean)
          .join(', ') || 'Ikke oppgitt';

        const norwegianInstitutions = (w.authorships || [])
          .flatMap((a: any) => a.institutions || [])
          .filter((inst: any) => inst.country_code === 'NO')
          .map((inst: any) => inst.display_name);

        const isNorwegian = norwegianInstitutions.length > 0 || norwegianOnly;
        const institutionAffiliation = norwegianInstitutions.length > 0
          ? norwegianInstitutions.slice(0, 2).join(' / ')
          : (w.authorships?.[0]?.institutions?.[0]?.display_name || '');

        let abstractText = '';
        if (w.abstract_inverted_index) {
          try {
            const index = w.abstract_inverted_index;
            const positions: [number, string][] = [];
            Object.entries(index).forEach(([word, posArr]) => {
              (posArr as number[]).forEach(p => positions.push([p, word]));
            });
            positions.sort((a, b) => a[0] - b[0]);
            abstractText = positions.map(p => p[1]).join(' ');
          } catch (e) {
            abstractText = 'Sammendrag tilgjengelig i kildeartikkel.';
          }
        }

        const doiRaw = w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//i, '') : undefined;

        return {
          id: `openalex-${w.id?.replace('https://openalex.org/', '') || Math.random().toString(36)}`,
          source: norwegianOnly ? 'Norske Forskningsarkiv (NVA/Cristin)' : 'OpenAlex (Global & Norsk)',
          title: (w.title || 'Uten tittel').replace(/<[^>]*>?/gm, '').trim(),
          authors,
          journal: w.primary_location?.source?.display_name || w.host_venue?.name || 'Fagfellevurdert tidsskrift',
          year: w.publication_year ? String(w.publication_year) : 'Ukjent',
          doi: doiRaw,
          doiUrl: doiRaw ? `https://doi.org/${doiRaw}` : undefined,
          openAlexId: w.id,
          abstract: abstractText || 'Sammendrag indeksert i OpenAlex repository.',
          isOpenAccess: !!w.open_access?.is_oa,
          openAccessPdfUrl: w.open_access?.oa_url || w.primary_location?.pdf_url,
          landingPageUrl: w.primary_location?.landing_page_url || (doiRaw ? `https://doi.org/${doiRaw}` : undefined),
          citationCount: w.cited_by_count,
          institutionAffiliation,
          isNorwegianResearch: isNorwegian,
          studyTypeHint: w.type || 'journal-article'
        };
      });

      return results;
    } catch (err) {
      console.warn('OpenAlex search error:', err);
      return [];
    }
  }

  /**
   * Search Europe PMC API
   */
  public static async searchEuropePmc(query: string, limit = 15): Promise<OpenResearchRecord[]> {
    try {
      const url = `https://api.europepmc.org/search?query=${encodeURIComponent(query)}&format=json&pageSize=${limit}&resultType=core`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Europe PMC svarte med status ${res.status}`);
      const data = await res.json();
      
      const list = data.resultList?.result || [];
      return list.map((item: any) => ({
        id: `epmc-${item.id || item.doi || Math.random().toString(36)}`,
        source: 'Europe PMC',
        title: (item.title || 'Uten tittel').replace(/<[^>]*>?/gm, '').trim(),
        authors: item.authorString || (item.authorList?.author?.map((a: any) => a.fullName).join(', ')) || 'Ikke oppgitt',
        journal: item.journalTitle || item.journalInfo?.journal?.title || 'Vitenskapelig tidsskrift',
        year: item.pubYear ? String(item.pubYear) : 'Ukjent',
        doi: item.doi,
        doiUrl: item.doi ? `https://doi.org/${item.doi}` : undefined,
        pmid: item.pmid,
        abstract: (item.abstractText || '').replace(/<[^>]*>?/gm, '') || 'Sammendrag ikke tilgjengelig via åpen indeks.',
        isOpenAccess: item.isOpenAccess === 'Y',
        landingPageUrl: item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/article/MED/${item.pmid}`,
        citationCount: item.citedByCount || 0,
        studyTypeHint: item.pubType || 'Peer-reviewed research'
      }));
    } catch (err) {
      console.warn('Europe PMC search error:', err);
      return [];
    }
  }

  /**
   * Search Crossref API
   */
  public static async searchCrossref(query: string, limit = 15): Promise<OpenResearchRecord[]> {
    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&select=DOI,title,author,container-title,published,abstract,is-referenced-by-count,URL`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Crossref svarte med status ${res.status}`);
      const data = await res.json();
      
      const list = data.message?.items || [];
      return list.map((item: any) => {
        const title = Array.isArray(item.title) ? item.title[0] : (item.title || 'Uten tittel');
        const authorStr = Array.isArray(item.author) 
          ? item.author.map((a: any) => `${a.family || ''} ${a.given || ''}`.trim()).join(', ')
          : 'Ikke oppgitt';
        const journal = Array.isArray(item['container-title']) ? item['container-title'][0] : 'Vitenskapelig publikasjon';
        const year = item.published?.['date-parts']?.[0]?.[0] ? String(item.published['date-parts'][0][0]) : 'Ukjent';
        
        return {
          id: `cr-${item.DOI || Math.random().toString(36)}`,
          source: 'Crossref',
          title: title.replace(/<[^>]*>?/gm, '').trim(),
          authors: authorStr,
          journal,
          year,
          doi: item.DOI,
          doiUrl: item.DOI ? `https://doi.org/${item.DOI}` : undefined,
          abstract: item.abstract ? item.abstract.replace(/<[^>]*>?/gm, '') : 'Sammendrag tilgjengelig i kildeartikkel.',
          landingPageUrl: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : undefined),
          citationCount: item['is-referenced-by-count'] || 0,
          studyTypeHint: item.type || 'journal-article'
        };
      });
    } catch (err) {
      console.warn('Crossref search error:', err);
      return [];
    }
  }

  /**
   * Search PubMed via Entrez eUtils
   */
  public static async searchPubMed(query: string, limit = 12): Promise<OpenResearchRecord[]> {
    try {
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=${limit}`;
      const sRes = await fetch(searchUrl);
      if (!sRes.ok) throw new Error(`PubMed søk feilet med status ${sRes.status}`);
      const sData = await sRes.json();
      const idList: string[] = sData.esearchresult?.idlist || [];

      if (idList.length === 0) return [];

      const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
      const sumRes = await fetch(sumUrl);
      const sumData = await sumRes.json();
      const resultObj = sumData.result || {};

      return idList.map(pmid => {
        const doc = resultObj[pmid] || {};
        const authorList = doc.authors?.map((a: any) => a.name).join(', ') || 'Ikke oppgitt';
        const pubDate = doc.pubdate ? doc.pubdate.split(' ')[0] : 'Ukjent';
        const doi = doc.articleids?.find((aid: any) => aid.idtype === 'doi')?.value;

        return {
          id: `pmid-${pmid}`,
          source: 'PubMed / NCBI',
          title: (doc.title || 'Uten tittel').replace(/<[^>]*>?/gm, '').trim(),
          authors: authorList,
          journal: doc.source || 'PubMed Journal',
          year: pubDate,
          doi,
          doiUrl: doi ? `https://doi.org/${doi}` : undefined,
          pmid,
          abstract: 'Indeksert i PubMed / National Center for Biotechnology Information (NCBI).',
          landingPageUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          studyTypeHint: doc.pubtype?.[0] || 'Medical Research'
        };
      });
    } catch (err) {
      console.warn('PubMed search error:', err);
      return [];
    }
  }

  /**
   * Search Semantic Scholar API
   */
  public static async searchSemanticScholar(query: string, limit = 12): Promise<OpenResearchRecord[]> {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,journal,externalIds,abstract,citationCount,isOpenAccess,venue,openAccessPdf`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Semantic Scholar svarte med status ${res.status}`);
      const data = await res.json();
      const list = data.data || [];

      return list.map((item: any) => {
        const authors = (item.authors || []).map((a: any) => a.name).join(', ') || 'Ikke oppgitt';
        const doi = item.externalIds?.DOI;

        return {
          id: `s2-${item.paperId || Math.random().toString(36)}`,
          source: 'Semantic Scholar',
          title: (item.title || 'Uten tittel').trim(),
          authors,
          journal: item.journal?.name || item.venue || 'Vitenskapelig tidsskrift',
          year: item.year ? String(item.year) : 'Ukjent',
          doi,
          doiUrl: doi ? `https://doi.org/${doi}` : undefined,
          abstract: item.abstract || 'Sammendrag indeksert i Semantic Scholar.',
          isOpenAccess: !!item.isOpenAccess,
          openAccessPdfUrl: item.openAccessPdf?.url,
          landingPageUrl: doi ? `https://doi.org/${doi}` : undefined,
          citationCount: item.citationCount || 0,
          studyTypeHint: 'Academic Paper'
        };
      });
    } catch (err) {
      console.warn('Semantic Scholar search error:', err);
      return [];
    }
  }

  /**
   * Search DOAJ (Directory of Open Access Journals)
   */
  public static async searchDOAJ(query: string, limit = 12): Promise<OpenResearchRecord[]> {
    try {
      const url = `https://doaj.org/api/v2/search/articles/${encodeURIComponent(query)}?pageSize=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`DOAJ svarte med status ${res.status}`);
      const data = await res.json();
      const list = data.results || [];

      return list.map((item: any) => {
        const bib = item.bibjson || {};
        const authors = (bib.author || []).map((a: any) => a.name).join(', ') || 'Ikke oppgitt';
        const doiId = (bib.identifier || []).find((id: any) => id.type === 'doi')?.id;

        return {
          id: `doaj-${item.id || Math.random().toString(36)}`,
          source: 'DOAJ (Open Access)',
          title: (bib.title || 'Uten tittel').trim(),
          authors,
          journal: bib.journal?.title || 'Open Access Journal',
          year: bib.year ? String(bib.year) : 'Ukjent',
          doi: doiId,
          doiUrl: doiId ? `https://doi.org/${doiId}` : undefined,
          abstract: bib.abstract || 'Artikkel i fagfellevurdert åpent tidsskrift registrert i DOAJ.',
          isOpenAccess: true,
          landingPageUrl: doiId ? `https://doi.org/${doiId}` : bib.link?.[0]?.url,
          studyTypeHint: 'Gold Open Access'
        };
      });
    } catch (err) {
      console.warn('DOAJ search error:', err);
      return [];
    }
  }

  /**
   * Universal Federated Search across all open databases simultaneously with deduplication
   */
  public static async searchUniversal(query: string): Promise<OpenResearchRecord[]> {
    const promises = [
      this.searchOpenAlex(query, false, 8),
      this.searchEuropePmc(query, 8),
      this.searchCrossref(query, 8),
      this.searchPubMed(query, 6),
      this.searchSemanticScholar(query, 6),
      this.searchOpenAlex(query, true, 6), // Norwegian research query
      this.searchDOAJ(query, 6)
    ];

    const allSettled = await Promise.allSettled(promises);
    const combined: OpenResearchRecord[] = [];

    allSettled.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        combined.push(...res.value);
      }
    });

    // Deduplicate by DOI or Normalized Title
    const seenDois = new Set<string>();
    const seenTitles = new Set<string>();
    const deduplicated: OpenResearchRecord[] = [];

    combined.forEach(rec => {
      const normDoi = rec.doi?.toLowerCase().trim();
      const normTitle = rec.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);

      if (normDoi && seenDois.has(normDoi)) return;
      if (normTitle && seenTitles.has(normTitle)) return;

      if (normDoi) seenDois.add(normDoi);
      if (normTitle) seenTitles.add(normTitle);

      deduplicated.push(rec);
    });

    // Sort by: Norwegian research first, then citation count / relevance
    deduplicated.sort((a, b) => {
      if (a.isNorwegianResearch && !b.isNorwegianResearch) return -1;
      if (!a.isNorwegianResearch && b.isNorwegianResearch) return 1;
      return (b.citationCount || 0) - (a.citationCount || 0);
    });

    return deduplicated;
  }
}
