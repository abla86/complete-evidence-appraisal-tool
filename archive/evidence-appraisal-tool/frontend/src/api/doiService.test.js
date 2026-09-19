import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchMetadataByDoi } from './doiService';

describe('fetchMetadataByDoi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes DOI and maps Crossref metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: {
          title: ['A systematic review'],
          author: [{ family: 'Doe', given: 'Jane' }],
          issued: { 'date-parts': [[2026]] },
          'container-title': ['Journal of Evidence'],
          publisher: 'Example Publisher',
          type: 'journal-article',
          URL: 'https://doi.org/10.test/abc',
        },
      }),
    }));

    const result = await fetchMetadataByDoi('https://doi.org/10.test/abc.');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.crossref.org/works/10.test%2Fabc',
      { headers: { Accept: 'application/json' } },
    );
    expect(result.title).toBe('A systematic review');
    expect(result.authors).toBe('Doe, Jane');
    expect(result.year).toBe('2026');
    expect(result.journal).toBe('Journal of Evidence');
  });
});
