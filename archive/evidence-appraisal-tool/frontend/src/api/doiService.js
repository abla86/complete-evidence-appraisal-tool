const CROSSREF_BASE_URL = 'https://api.crossref.org/works/';

export async function fetchMetadataByDoi(doi) {
  const normalized = String(doi ?? '')
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .replace(/[)\]}>.,;]+$/, '');

  if (!normalized) throw new Error('DOI må oppgis.');

  const response = await fetch(`${CROSSREF_BASE_URL}${encodeURIComponent(normalized)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`DOI-oppslag feilet (${response.status}).`);
  }

  const payload = await response.json();
  const message = payload?.message;
  if (!message) throw new Error('Crossref returnerte ingen metadata for DOI-en.');

  const year = message.issued?.['date-parts']?.[0]?.[0]
    ?? message.created?.['date-parts']?.[0]?.[0]
    ?? null;

  return {
    doi: normalized,
    title: message.title?.[0] ?? '',
    authors: (message.author ?? [])
      .map((author) => [author.family, author.given].filter(Boolean).join(', '))
      .filter(Boolean)
      .join('; '),
    year: year ? String(year) : '',
    journal: message['container-title']?.[0] ?? '',
    publisher: message.publisher ?? '',
    type: message.type ?? '',
    url: message.URL ?? `https://doi.org/${normalized}`,
  };
}
