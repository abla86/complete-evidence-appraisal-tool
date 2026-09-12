/**
 * Academic citation and reference utilities.
 *
 * Keeps citation formatting deterministic and browser-safe. DOI metadata lookup is
 * best-effort and never blocks local citation generation.
 */

export interface AuthorName {
  family: string;
  given?: string;
  middle?: string;
  suffix?: string;
  isOrganization?: boolean;
}

export type CitationStyleId =
  | 'apa7'
  | 'vancouver'
  | 'harvard'
  | 'chicago-author-date'
  | 'chicago-notes'
  | 'mla9'
  | 'ieee'
  | 'bibtex'
  | 'ris';

export interface CitationStyleInfo {
  id: CitationStyleId;
  name: string;
  shortName: string;
  discipline: string;
  description: string;
}

export const SUPPORTED_CITATION_STYLES: CitationStyleInfo[] = [
  { id: 'apa7', name: 'APA 7th Edition', shortName: 'APA 7', discipline: 'Helsefag og samfunnsvitenskap', description: 'Forfatter-år-format etter APA 7.' },
  { id: 'vancouver', name: 'Vancouver / ICMJE (NLM)', shortName: 'Vancouver', discipline: 'Medisin og biomedisin', description: 'Numerisk referansestil.' },
  { id: 'harvard', name: 'Harvard Style', shortName: 'Harvard', discipline: 'Tverrfaglig', description: 'Forfatter-år-format.' },
  { id: 'chicago-author-date', name: 'Chicago 17th / 18th (Author-Date)', shortName: 'Chicago (A-D)', discipline: 'Samfunnsvitenskap', description: 'Forfatter-år-format.' },
  { id: 'chicago-notes', name: 'Chicago 17th / 18th (Notes & Bibliography)', shortName: 'Chicago (Notes)', discipline: 'Humaniora', description: 'Notebasert referansestil.' },
  { id: 'mla9', name: 'MLA 9th Edition', shortName: 'MLA 9', discipline: 'Humaniora', description: 'Works Cited-format.' },
  { id: 'ieee', name: 'IEEE Reference Style', shortName: 'IEEE', discipline: 'Teknologi', description: 'Numerisk IEEE-format.' },
  { id: 'bibtex', name: 'BibTeX (.bib)', shortName: 'BibTeX', discipline: 'LaTeX og Overleaf', description: 'Maskinlesbart BibTeX-format.' },
  { id: 'ris', name: 'RIS Export Format', shortName: 'RIS', discipline: 'Referansehåndtering', description: 'RIS-utvekslingsformat.' },
];

export interface Apa7MetadataInput {
  title?: string;
  authors?: string | AuthorName[];
  year?: number | string;
  journal?: string;
  volume?: string | number;
  issue?: string | number;
  pages?: string;
  articleNumber?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  abstract?: string;
}

export interface MultiStyleCitationResult {
  style: CitationStyleId;
  styleName: string;
  plainText: string;
  htmlFormatted: string;
  markdownFormatted: string;
  inTextParenthetical: string;
  inTextNarrative: string;
  inTextWithPage: (page: string | number) => string;
}

export interface Apa7FormattedResult {
  plainText: string;
  htmlFormatted: string;
  markdownFormatted: string;
  shortCitation: string;
  parentheticalCitation: string;
  narrativeCitation: string;
  parentheticalWithPage: (page: string | number) => string;
  narrativeWithPage: (page: string | number) => string;
  bibtex: string;
  ris: string;
  normalizedDoi?: string;
  doiUrl?: string;
  styles: Record<CitationStyleId, MultiStyleCitationResult>;
  parsedMetadata: {
    title: string;
    authors: AuthorName[];
    year: string;
    journal: string;
    volume: string;
    issue: string;
    pages: string;
    articleNumber: string;
    doi: string;
    doiUrl: string;
  };
}

export interface DoiLookupResult {
  success: boolean;
  source: 'DOI Content Negotiation' | 'Crossref REST API' | 'Europe PMC' | 'DataCite' | 'Local Parser';
  formatted: Apa7FormattedResult;
  rawCslJson?: unknown;
  errorMessage?: string;
}

export interface BatchBibliographyResult {
  style: CitationStyleId;
  count: number;
  plainText: string;
  htmlFormatted: string;
  markdownFormatted: string;
  bibtexBlock: string;
  risBlock: string;
  items: Array<{ id: string; citation: MultiStyleCitationResult; parsed: unknown }>;
}

const esc = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

export class Apa7CitationService {
  public static cleanDoi(input?: string): string {
    if (!input) return '';
    return input.trim()
      .replace(/^doi:\s*/i, '')
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
      .replace(/\/+$/, '');
  }

  public static isValidDoi(input?: string): boolean {
    return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(this.cleanDoi(input));
  }

  public static parseAuthorString(value?: string): AuthorName[] {
    if (!value?.trim()) return [{ family: 'Ukjent forfatter' }];
    const parts = value.split(/\s*;\s*|\s+and\s+|\s*&\s*/i).map(v => v.trim()).filter(Boolean);
    return parts.map(part => {
      if (part.includes(',')) {
        const [family, ...given] = part.split(',');
        return { family: family.trim(), given: given.join(',').trim() || undefined };
      }
      const tokens = part.split(/\s+/).filter(Boolean);
      return tokens.length === 1
        ? { family: tokens[0] }
        : { family: tokens[tokens.length - 1], given: tokens.slice(0, -1).join(' ') };
    });
  }

  public static formatInitials(given?: string, withDots = true, withSpaces = true): string {
    if (!given?.trim()) return '';
    return given.trim().split(/[\s.]+/).filter(Boolean).map(token =>
      token.split('-').map(part => part.charAt(0).toUpperCase() + (withDots ? '.' : '')).join('-')
    ).join(withSpaces ? ' ' : '');
  }

  public static formatApa7AuthorList(authors: AuthorName[], _language: 'nb' | 'en' = 'nb'): string {
    const formatted = (authors.length ? authors : [{ family: 'Ukjent forfatter' }]).map(author => {
      if (author.isOrganization) return author.family;
      const initials = this.formatInitials(author.given);
      return initials ? `${author.family}, ${initials}` : author.family;
    });
    if (formatted.length === 1) return formatted[0];
    if (formatted.length <= 20) return `${formatted.slice(0, -1).join(', ')}, & ${formatted.at(-1)}`;
    return `${formatted.slice(0, 19).join(', ')}, ... ${formatted.at(-1)}`;
  }

  public static formatVancouverAuthorList(authors: AuthorName[]): string {
    return authors.map(a => a.isOrganization ? a.family : `${a.family} ${this.formatInitials(a.given, false, false)}`.trim()).slice(0, 6).join(', ')
      + (authors.length > 6 ? ', et al.' : '');
  }

  public static async copyRichTextToClipboard(htmlContent: string, plainTextFallback: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([plainTextFallback], { type: 'text/plain' }),
        })]);
        return true;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(plainTextFallback);
        return true;
      }
    } catch (error) {
      console.warn('Clipboard write failed', error);
    }
    return false;
  }

  private static authorFamily(authors: AuthorName[]): string {
    if (!authors.length) return 'Ukjent forfatter';
    if (authors.length === 1) return authors[0].family;
    if (authors.length === 2) return `${authors[0].family} & ${authors[1].family}`;
    return `${authors[0].family} et al.`;
  }

  private static makeStyle(style: CitationStyleId, input: Apa7MetadataInput, language: 'nb' | 'en'): MultiStyleCitationResult {
    const authors = Array.isArray(input.authors) ? input.authors : this.parseAuthorString(input.authors);
    const family = this.authorFamily(authors);
    const year = String(input.year || 'n.d.');
    const title = (input.title || 'Uten tittel').trim();
    const journal = input.journal?.trim() || '';
    const volume = input.volume ? String(input.volume) : '';
    const issue = input.issue ? `(${input.issue})` : '';
    const pages = input.pages ? `, ${input.pages}` : '';
    const doi = this.cleanDoi(input.doi);
    const doiText = doi ? `https://doi.org/${doi}` : (input.url || '');
    let plainText: string;

    switch (style) {
      case 'vancouver':
      case 'ieee':
        plainText = `${this.formatVancouverAuthorList(authors)}. ${title}. ${journal}${journal ? '. ' : ''}${year}${volume ? `;${volume}` : ''}${issue}${pages}${doiText ? `. ${doiText}` : '.'}`;
        break;
      case 'harvard':
        plainText = `${this.formatApa7AuthorList(authors, language)} (${year}). ${title}. ${journal}${volume ? `, ${volume}${issue}` : ''}${pages}.${doiText ? ` ${doiText}` : ''}`;
        break;
      case 'mla9':
        plainText = `${this.formatApa7AuthorList(authors, language)}. "${title}." ${journal}${volume ? `, vol. ${volume}` : ''}${issue ? `, no. ${String(input.issue)}` : ''}${pages ? `, ${pages.replace(/^, /, '')}` : ''}, ${year}.${doiText ? ` ${doiText}` : ''}`;
        break;
      case 'chicago-author-date':
      case 'chicago-notes':
        plainText = `${this.formatApa7AuthorList(authors, language)}. ${year}. "${title}." ${journal}${volume ? ` ${volume}${issue}` : ''}${pages}.${doiText ? ` ${doiText}` : ''}`;
        break;
      case 'bibtex':
        plainText = `@article{${family.replace(/\W+/g, '').toLowerCase()}${year},\n  author = {${this.formatApa7AuthorList(authors, language)}},\n  title = {${title}},\n  journal = {${journal}},\n  year = {${year}}\n}`;
        break;
      case 'ris':
        plainText = `TY  - JOUR\nAU  - ${this.formatApa7AuthorList(authors, language)}\nTI  - ${title}\nJO  - ${journal}\nPY  - ${year}\nDO  - ${doi}\nER  -`;
        break;
      case 'apa7':
      default:
        plainText = `${this.formatApa7AuthorList(authors, language)} (${year}). ${title}. ${journal ? `${journal}${volume ? `, ${volume}` : ''}${issue ? `(${input.issue})` : ''}${pages}` : ''}${doiText ? `. ${doiText}` : '.'}`.replace(/\. \./g, '.');
    }

    const htmlFormatted = esc(plainText).replace(/(https:\/\/doi\.org\/\S+)/g, '<a href="$1">$1</a>');
    const parenthetical = `(${family}, ${year})`;
    const narrative = `${family} (${year})`;
    return {
      style,
      styleName: SUPPORTED_CITATION_STYLES.find(s => s.id === style)?.name || style,
      plainText,
      htmlFormatted,
      markdownFormatted: plainText,
      inTextParenthetical: parenthetical,
      inTextNarrative: narrative,
      inTextWithPage: page => `(${family}, ${year}, p. ${page})`,
    };
  }

  public static formatApa7(input: Apa7MetadataInput, language: 'nb' | 'en' = 'nb'): Apa7FormattedResult {
    const authors = Array.isArray(input.authors) ? input.authors : this.parseAuthorString(input.authors);
    const doi = this.cleanDoi(input.doi);
    const styles = Object.fromEntries(SUPPORTED_CITATION_STYLES.map(style => [style.id, this.makeStyle(style.id, input, language)])) as Record<CitationStyleId, MultiStyleCitationResult>;
    const apa = styles.apa7;
    const parsedMetadata = {
      title: input.title || '',
      authors,
      year: String(input.year || ''),
      journal: input.journal || '',
      volume: input.volume ? String(input.volume) : '',
      issue: input.issue ? String(input.issue) : '',
      pages: input.pages || '',
      articleNumber: input.articleNumber || '',
      doi,
      doiUrl: doi ? `https://doi.org/${doi}` : '',
    };
    return {
      plainText: apa.plainText,
      htmlFormatted: apa.htmlFormatted,
      markdownFormatted: apa.markdownFormatted,
      shortCitation: apa.inTextParenthetical,
      parentheticalCitation: apa.inTextParenthetical,
      narrativeCitation: apa.inTextNarrative,
      parentheticalWithPage: apa.inTextWithPage,
      narrativeWithPage: page => `${this.authorFamily(authors)} (${String(input.year || 'n.d.')}, p. ${page})`,
      bibtex: styles.bibtex.plainText,
      ris: styles.ris.plainText,
      normalizedDoi: doi || undefined,
      doiUrl: doi ? `https://doi.org/${doi}` : undefined,
      styles,
      parsedMetadata,
    };
  }

  public static generateBatchBibliography(
    articles: Array<{ id: string; title: string; authors?: string; year?: number | string; journal?: string; volumeIssue?: string; pages?: string; doi?: string; sourceUrl?: string }>,
    style: CitationStyleId = 'apa7',
    sortOrder: 'author' | 'year' | 'order' = 'author',
    language: 'nb' | 'en' = 'nb',
  ): BatchBibliographyResult {
    const list = [...articles];
    if (sortOrder === 'author') list.sort((a, b) => (a.authors || '').localeCompare(b.authors || ''));
    if (sortOrder === 'year') list.sort((a, b) => String(a.year || '').localeCompare(String(b.year || '')));
    const items = list.map(article => {
      const volumeMatch = article.volumeIssue?.match(/^([^()]+?)(?:\(([^)]+)\))?$/);
      const citation = this.makeStyle(style, {
        title: article.title,
        authors: article.authors,
        year: article.year,
        journal: article.journal,
        volume: volumeMatch?.[1]?.trim(),
        issue: volumeMatch?.[2],
        pages: article.pages,
        doi: article.doi,
        url: article.sourceUrl,
      }, language);
      return { id: article.id, citation, parsed: article };
    });
    return {
      style,
      count: items.length,
      plainText: items.map((item, index) => `${index + 1}. ${item.citation.plainText}`).join('\n\n'),
      htmlFormatted: items.map(item => `<p>${item.citation.htmlFormatted}</p>`).join(''),
      markdownFormatted: items.map(item => `- ${item.citation.markdownFormatted}`).join('\n'),
      bibtexBlock: items.map(item => item.citation.style === 'bibtex' ? item.citation.plainText : this.makeStyle('bibtex', item.parsed as Apa7MetadataInput, language).plainText).join('\n\n'),
      risBlock: items.map(item => item.citation.style === 'ris' ? item.citation.plainText : this.makeStyle('ris', item.parsed as Apa7MetadataInput, language).plainText).join('\n'),
      items,
    };
  }

  public static async lookupDoi(input: string, language: 'nb' | 'en' = 'nb'): Promise<DoiLookupResult> {
    const doi = this.cleanDoi(input);
    if (!this.isValidDoi(doi)) {
      return { success: false, source: 'Local Parser', errorMessage: 'Ingen gyldig DOI oppgitt.', formatted: this.formatApa7({}, language) };
    }
    try {
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Crossref HTTP ${response.status}`);
      const data = await response.json() as { message?: Record<string, unknown> };
      const item = data.message || {};
      const authors = Array.isArray(item.author)
        ? (item.author as Array<{ family?: string; given?: string }>).map(author => ({ family: author.family || 'Ukjent', given: author.given }))
        : [];
      const issued = item.issued as { 'date-parts'?: number[][] } | undefined;
      const year = issued?.['date-parts']?.[0]?.[0];
      const title = Array.isArray(item.title) ? String(item.title[0] || '') : '';
      const journal = Array.isArray(item['container-title']) ? String(item['container-title'][0] || '') : '';
      const formatted = this.formatApa7({
        title,
        authors,
        year,
        journal,
        volume: typeof item.volume === 'string' ? item.volume : undefined,
        issue: typeof item.issue === 'string' ? item.issue : undefined,
        pages: typeof item.page === 'string' ? item.page : undefined,
        doi,
        url: `https://doi.org/${doi}`,
      }, language);
      return { success: true, source: 'Crossref REST API', formatted, rawCslJson: item };
    } catch (error) {
      return { success: false, source: 'Local Parser', formatted: this.formatApa7({ doi }, language), errorMessage: error instanceof Error ? error.message : 'DOI-oppslag feilet.' };
    }
  }
}
