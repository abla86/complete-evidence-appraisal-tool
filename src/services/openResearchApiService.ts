export interface OpenResearchRecord {
  id: string;
  source: 'OpenAlex (Global & Norsk)' | 'Europe PMC' | 'Crossref' | 'PubMed / NCBI' | 'Semantic Scholar' | 'DOAJ (Open Access)' | 'Norske Forskningsarkiv (NVA/Cristin)' | 'Preprints (arXiv/medRxiv)' | 'Multi-Database Føderert';
  title: string; authors: string; journal: string; year: string;
  doi?: string; doiUrl?: string; pmid?: string; openAlexId?: string; abstract?: string;
  isOpenAccess?: boolean; openAccessPdfUrl?: string; landingPageUrl?: string;
  citationCount?: number; institutionAffiliation?: string; isNorwegianResearch?: boolean;
  studyTypeHint?: string; isImported?: boolean;
}
export interface SearchDatabaseOption { id: string; name: string; description: string; badge: string; isNorwegianFocused?: boolean; isOpenAccessGuaranteed?: boolean; }
export const OPEN_DATABASES: SearchDatabaseOption[] = [
  { id:'universal', name:'Føderert Multi-Søk', description:'Søk i flere åpne bibliografiske baser samtidig.', badge:'Universell' },
  { id:'openalex', name:'OpenAlex', description:'Åpen global bibliografisk database.', badge:'OpenAlex' },
  { id:'norwegian', name:'Norske forskningsarkiv', description:'Norsk forskning via åpne metadata.', badge:'Norsk', isNorwegianFocused:true },
  { id:'europepmc', name:'Europe PMC', description:'Åpen biomedisinsk litteratur.', badge:'Biomedisin' },
  { id:'crossref', name:'Crossref', description:'Åpent DOI-register.', badge:'DOI' },
  { id:'pubmed', name:'PubMed / NCBI', description:'Biomedisinsk bibliografisk database.', badge:'MEDLINE' },
  { id:'semanticscholar', name:'Semantic Scholar', description:'Akademisk søk og siteringsdata.', badge:'Siteringer' },
  { id:'doaj', name:'DOAJ', description:'Register over åpne tidsskrifter.', badge:'Open Access', isOpenAccessGuaranteed:true },
  { id:'preprints', name:'Preprints', description:'Åpne preprint-kilder.', badge:'Preprints' }
];

const clean = (value: unknown) => String(value ?? '').replace(/<[^>]*>/g, '').trim();
const boundedLimit = (limit: number, max = 25) => Math.min(Math.max(Number.isFinite(limit) ? Math.floor(limit) : 1, 1), max);

export class OpenResearchApiService {
  static async searchOpenAlex(query: string, norwegianOnly = false, limit = 15): Promise<OpenResearchRecord[]> {
    try {
      const filter = norwegianOnly ? `&filter=authorships.institutions.country_code:NO` : '';
      const url = `https://api.openalex.org/works?search=${encodeURIComponent(query.trim())}${filter}&per_page=${boundedLimit(limit)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenAlex HTTP ${res.status}`);
      const data = await res.json() as { results?: Array<Record<string, unknown>> };
      return (data.results || []).map(w => {
        const authorships = Array.isArray(w.authorships) ? w.authorships as Array<Record<string, unknown>> : [];
        const names = authorships.map(a => {
          const author = a.author as Record<string, unknown> | undefined;
          return clean(author?.display_name);
        }).filter(Boolean);
        const institutions = authorships.flatMap(a => Array.isArray(a.institutions) ? a.institutions as Array<Record<string, unknown>> : []).filter(i => i.country_code === 'NO').map(i => clean(i.display_name));
        const doi = clean(w.doi).replace(/^https?:\/\/doi\.org\//i, '') || undefined;
        return { id:`openalex-${clean(w.id).split('/').pop() || crypto.randomUUID()}`, source:norwegianOnly?'Norske Forskningsarkiv (NVA/Cristin)':'OpenAlex (Global & Norsk)', title:clean(w.title)||'Uten tittel', authors:names.join(', ')||'Ikke oppgitt', journal:clean((w.primary_location as Record<string,unknown>)?.source && ((w.primary_location as Record<string,unknown>).source as Record<string,unknown>)?.display_name)||'Vitenskapelig tidsskrift', year:w.publication_year?String(w.publication_year):'Ukjent', doi, doiUrl:doi?`https://doi.org/${doi}`:undefined, openAlexId:clean(w.id)||undefined, isOpenAccess:Boolean((w.open_access as Record<string,unknown>)?.is_oa), citationCount:Number(w.cited_by_count||0), institutionAffiliation:institutions.slice(0,2).join(' / ')||undefined, isNorwegianResearch:norwegianOnly||institutions.length>0, studyTypeHint:clean(w.type)||'journal-article' };
      });
    } catch { return []; }
  }

  static async searchEuropePmc(query: string, limit = 15): Promise<OpenResearchRecord[]> {
    try {
      const url=`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query.trim())}&format=json&pageSize=${boundedLimit(limit)}&resultType=core`;
      const res=await fetch(url); if(!res.ok) throw new Error(`Europe PMC HTTP ${res.status}`);
      const data=await res.json() as { resultList?: { result?: Array<Record<string,unknown>> } };
      return (data.resultList?.result||[]).map(i=>({id:`epmc-${clean(i.id)||crypto.randomUUID()}`,source:'Europe PMC',title:clean(i.title)||'Uten tittel',authors:clean(i.authorString)||'Ikke oppgitt',journal:clean(i.journalTitle)||'Vitenskapelig tidsskrift',year:i.pubYear?String(i.pubYear):'Ukjent',doi:clean(i.doi)||undefined,doiUrl:i.doi?`https://doi.org/${clean(i.doi)}`:undefined,pmid:clean(i.pmid)||undefined,abstract:clean(i.abstractText)||undefined,isOpenAccess:i.isOpenAccess==='Y',landingPageUrl:i.pmid?`https://pubmed.ncbi.nlm.nih.gov/${clean(i.pmid)}/`:undefined,citationCount:Number(i.citedByCount||0),studyTypeHint:clean(i.pubType)||undefined}));
    } catch { return []; }
  }

  static async searchCrossref(query: string, limit = 15): Promise<OpenResearchRecord[]> {
    try {
      const url=`https://api.crossref.org/works?query=${encodeURIComponent(query.trim())}&rows=${boundedLimit(limit)}&select=DOI,title,author,container-title,published,abstract,is-referenced-by-count,URL,type`;
      const res=await fetch(url); if(!res.ok) throw new Error(`Crossref HTTP ${res.status}`);
      const data=await res.json() as { message?: { items?: Array<Record<string,unknown>> } };
      return (data.message?.items||[]).map(i=>{const doi=clean(i.DOI)||undefined; const authors=Array.isArray(i.author)?(i.author as Array<Record<string,unknown>>).map(a=>[a.family,a.given].filter(Boolean).join(' ')).join(', '):'Ikke oppgitt'; return {id:`cr-${doi||crypto.randomUUID()}`,source:'Crossref',title:clean(Array.isArray(i.title)?i.title[0]:i.title)||'Uten tittel',authors:authors||'Ikke oppgitt',journal:clean(Array.isArray(i['container-title'])?i['container-title'][0]:i['container-title'])||'Vitenskapelig tidsskrift',year:String(((i.published as Record<string,unknown>)?.['date-parts'] as number[][]|undefined)?.[0]?.[0]||'Ukjent'),doi,doiUrl:doi?`https://doi.org/${doi}`:undefined,landingPageUrl:clean(i.URL)||undefined,citationCount:Number(i['is-referenced-by-count']||0),studyTypeHint:clean(i.type)||undefined};});
    } catch { return []; }
  }

  static async searchPubMed(query: string, limit = 12): Promise<OpenResearchRecord[]> {
    try {
      const n=boundedLimit(limit,50); const search=await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query.trim())}&retmode=json&retmax=${n}`);
      if(!search.ok) throw new Error('PubMed search failed'); const sd=await search.json() as {esearchresult?:{idlist?:string[]}}; const ids=sd.esearchresult?.idlist||[]; if(!ids.length)return [];
      const summary=await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`); if(!summary.ok)throw new Error('PubMed summary failed'); const d=await summary.json() as {result?:Record<string,Record<string,unknown>>}; const result=d.result||{};
      return ids.map(pmid=>{const x=result[pmid]||{}; const doi=Array.isArray(x.articleids)?(x.articleids as Array<Record<string,unknown>>).find(a=>a.idtype==='doi')?.value:undefined; return {id:`pmid-${pmid}`,source:'PubMed / NCBI',title:clean(x.title)||'Uten tittel',authors:Array.isArray(x.authors)?(x.authors as Array<Record<string,unknown>>).map(a=>clean(a.name)).join(', '):'Ikke oppgitt',journal:clean(x.source)||'PubMed',year:clean(String(x.pubdate||'')).split(' ')[0]||'Ukjent',doi:clean(doi)||undefined,doiUrl:doi?`https://doi.org/${clean(doi)}`:undefined,pmid,landingPageUrl:`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,studyTypeHint:Array.isArray(x.pubtype)?clean((x.pubtype as unknown[])[0]):'Medical Research'};});
    } catch { return []; }
  }

  static async searchSemanticScholar(query: string, limit = 12): Promise<OpenResearchRecord[]> {
    try { const url=`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query.trim())}&limit=${boundedLimit(limit)}&fields=title,authors,year,journal,externalIds,abstract,citationCount,isOpenAccess,venue,openAccessPdf`; const res=await fetch(url); if(!res.ok)throw new Error('Semantic Scholar failed'); const data=await res.json() as {data?:Array<Record<string,unknown>>}; return (data.data||[]).map(i=>{const ext=i.externalIds as Record<string,unknown>|undefined; const doi=clean(ext?.DOI)||undefined; const journal=i.journal as Record<string,unknown>|undefined; return {id:`s2-${clean(i.paperId)||crypto.randomUUID()}`,source:'Semantic Scholar',title:clean(i.title)||'Uten tittel',authors:Array.isArray(i.authors)?(i.authors as Array<Record<string,unknown>>).map(a=>clean(a.name)).join(', '):'Ikke oppgitt',journal:clean(journal?.name)||clean(i.venue)||'Vitenskapelig tidsskrift',year:i.year?String(i.year):'Ukjent',doi,doiUrl:doi?`https://doi.org/${doi}`:undefined,abstract:clean(i.abstract)||undefined,isOpenAccess:Boolean(i.isOpenAccess),openAccessPdfUrl:clean((i.openAccessPdf as Record<string,unknown>)?.url)||undefined,citationCount:Number(i.citationCount||0),landingPageUrl:doi?`https://doi.org/${doi}`:undefined,studyTypeHint:'Academic Paper'};}); } catch { return []; }
  }

  static async searchDOAJ(query: string, limit = 12): Promise<OpenResearchRecord[]> {
    try { const res=await fetch(`https://doaj.org/api/v2/search/articles/${encodeURIComponent(query.trim())}?pageSize=${boundedLimit(limit)}`); if(!res.ok)throw new Error('DOAJ failed'); const data=await res.json() as {results?:Array<Record<string,unknown>>}; return (data.results||[]).map(i=>{const bib=i.bibjson as Record<string,unknown>|undefined; const doi=Array.isArray(bib?.identifier)?(bib.identifier as Array<Record<string,unknown>>).find(x=>x.type==='doi')?.id:undefined; const journal=bib?.journal as Record<string,unknown>|undefined; return {id:`doaj-${clean(i.id)||crypto.randomUUID()}`,source:'DOAJ (Open Access)',title:clean(bib?.title)||'Uten tittel',authors:Array.isArray(bib?.author)?(bib.author as Array<Record<string,unknown>>).map(a=>clean(a.name)).join(', '):'Ikke oppgitt',journal:clean(journal?.title)||'Open Access Journal',year:clean(bib?.year)||'Ukjent',doi:clean(doi)||undefined,doiUrl:doi?`https://doi.org/${clean(doi)}`:undefined,isOpenAccess:true,landingPageUrl:doi?`https://doi.org/${clean(doi)}`:undefined,studyTypeHint:'Gold Open Access'};}); } catch { return []; }
  }

  static async searchUniversal(query: string): Promise<OpenResearchRecord[]> {
    const results=(await Promise.allSettled([this.searchOpenAlex(query,false,8),this.searchEuropePmc(query,8),this.searchCrossref(query,8),this.searchPubMed(query,6),this.searchSemanticScholar(query,6),this.searchOpenAlex(query,true,6),this.searchDOAJ(query,6)])).flatMap(r=>r.status==='fulfilled'?r.value:[]);
    const seen=new Set<string>(); const output:OpenResearchRecord[]=[];
    for(const record of results){const key=record.doi?.toLowerCase().trim()||record.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'').slice(0,80); if(!key||seen.has(key))continue; seen.add(key); output.push(record);}
    return output.sort((a,b)=>Number(Boolean(b.isNorwegianResearch))-Number(Boolean(a.isNorwegianResearch))||(b.citationCount||0)-(a.citationCount||0));
  }
}
