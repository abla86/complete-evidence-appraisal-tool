export interface FetchedStudyMetadata {
  doi: string;
  title: string;
  authors: string;
  year?: number;
  journal?: string;
  abstract?: string;
  url?: string;
}

/**
 * Fetch academic paper metadata using the public CrossRef REST API
 */
export async function fetchMetadataByDoi(rawDoi: string): Promise<FetchedStudyMetadata> {
  const cleanDoi = rawDoi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  if (!cleanDoi) {
    throw new Error('Ugyldig DOI-format');
  }

  try {
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CrossRef svarte med status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const item = data.message;

    const title = Array.isArray(item.title) ? item.title[0] : (item.title || 'Uten tittel');
    
    let authors = 'Ukjente forfattere';
    if (Array.isArray(item.author) && item.author.length > 0) {
      authors = item.author
        .map((a: { given?: string; family?: string; name?: string }) => 
          a.family ? `${a.given ? a.given + ' ' : ''}${a.family}` : (a.name || '')
        )
        .filter(Boolean)
        .join(', ');
    }

    const year = item['published-print']?.['date-parts']?.[0]?.[0] || 
                 item['published-online']?.['date-parts']?.[0]?.[0] || 
                 item.created?.['date-parts']?.[0]?.[0];

    const journal = Array.isArray(item['container-title']) 
      ? item['container-title'][0] 
      : (item['container-title'] || item.publisher);

    // Crossref abstracts often have JATS XML tags like <jats:p>, strip them
    let abstract = item.abstract || '';
    if (abstract) {
      abstract = abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return {
      doi: cleanDoi,
      title,
      authors,
      year,
      journal,
      abstract,
      url: item.URL || `https://doi.org/${cleanDoi}`,
    };
  } catch (error) {
    // If external network fails or CORS blocks, return a fallback with the DOI
    const errMessage = error instanceof Error ? error.message : 'Nettverksfeil';
    throw new Error(`Kunne ikke hente metadata for DOI ${cleanDoi}: ${errMessage}`);
  }
}
