export interface RetractionStatus {
  checkedAt: string;
  status: 'NOT_CHECKED' | 'NO_KNOWN_RETRACTION' | 'RETRACTION_SIGNAL' | 'CORRECTION_SIGNAL' | 'CHECK_FAILED';
  source: 'CROSSREF' | 'PUBMED' | 'MANUAL';
  details?: string;
}

export async function checkRetractionByDoi(doi: string): Promise<RetractionStatus> {
  const checkedAt = new Date().toISOString();
  const normalized = doi.trim().replace(/^doi:\s*/i, '').replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
  if (!normalized) return { checkedAt, status: 'CHECK_FAILED', source: 'CROSSREF', details: 'DOI mangler.' };
  try {
    const url = `https://api.crossref.org/works/${encodeURIComponent(normalized)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return { checkedAt, status: 'CHECK_FAILED', source: 'CROSSREF', details: `HTTP ${response.status}.` };
    const item = (await response.json())?.message ?? {};
    const relationText = JSON.stringify(item.relation ?? {}).toLowerCase();
    const title = String(item.title?.[0] ?? '').toLowerCase();
    if (relationText.includes('is-replaced-by') || title.includes('retracted')) {
      return { checkedAt, status: 'RETRACTION_SIGNAL', source: 'CROSSREF', details: 'Crossref-metadata inneholder et mulig tilbaketrekkingssignal.' };
    }
    if (relationText.includes('is-corrected-by') || relationText.includes('corrects')) {
      return { checkedAt, status: 'CORRECTION_SIGNAL', source: 'CROSSREF', details: 'Crossref-metadata inneholder en mulig korrigeringsrelasjon.' };
    }
    return { checkedAt, status: 'NO_KNOWN_RETRACTION', source: 'CROSSREF' };
  } catch (error) {
    return { checkedAt, status: 'CHECK_FAILED', source: 'CROSSREF', details: error instanceof Error ? error.message : 'Ukjent feil.' };
  }
}
