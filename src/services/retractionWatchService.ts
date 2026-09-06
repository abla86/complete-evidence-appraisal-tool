export type RetractionSignal = 'RETRACTION' | 'CORRECTION' | 'EXPRESSION_OF_CONCERN' | 'NONE' | 'UNVERIFIED';

interface CrossrefUpdate { type?: string; label?: string; }
interface CrossrefMessage { ['update-to']?: CrossrefUpdate[]; }
interface CrossrefWorkResponse { message?: CrossrefMessage; }

export interface RetractionCheckResult {
  doi: string;
  signal: RetractionSignal;
  source: 'CROSSREF' | 'EUROPE_PMC' | 'PUBMED' | 'NONE';
  checkedAt: string;
  details?: string;
}

export async function checkDoiStatus(doi: string): Promise<RetractionCheckResult> {
  const clean = doi.trim().replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:\s*/i, '').replace(/[.,;:)]+$/, '');
  if (!clean) return { doi, signal: 'UNVERIFIED', source: 'NONE', checkedAt: new Date().toISOString(), details: 'DOI mangler.' };

  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(clean)}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) return { doi: clean, signal: 'UNVERIFIED', source: 'CROSSREF', checkedAt: new Date().toISOString(), details: `Crossref HTTP ${response.status}.` };

  const item = (await response.json() as CrossrefWorkResponse).message;
  const updates = Array.isArray(item?.['update-to']) ? item['update-to'] : [];
  const retraction = updates.find((u) => String(u?.type || '').toLowerCase().includes('retraction'));
  const correction = updates.find((u) => {
    const type = String(u?.type || '').toLowerCase();
    return type.includes('correction') || type.includes('erratum') || type.includes('corrigendum');
  });

  if (retraction) return { doi: clean, signal: 'RETRACTION', source: 'CROSSREF', checkedAt: new Date().toISOString(), details: String(retraction.label || retraction.type || 'Retraction update found.') };
  if (correction) return { doi: clean, signal: 'CORRECTION', source: 'CROSSREF', checkedAt: new Date().toISOString(), details: String(correction.label || correction.type || 'Correction update found.') };
  return { doi: clean, signal: 'NONE', source: 'CROSSREF', checkedAt: new Date().toISOString() };
}


