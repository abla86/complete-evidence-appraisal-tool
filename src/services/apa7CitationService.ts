/**
 * Comprehensive Academic Citation & Reference Engine
 * 
 * Supports all major international citation standards:
 * - APA 7th Edition (American Psychological Association)
 * - Vancouver / ICMJE / NLM (National Library of Medicine / Medical & Clinical Journals)
 * - Harvard Reference Style (Author-Date System)
 * - Chicago Manual of Style 17th/18th Ed. (Author-Date & Notes-Bibliography)
 * - MLA 9th Edition (Modern Language Association)
 * - IEEE Citation Style (Institute of Electrical and Electronics Engineers)
 * - BibTeX (LaTeX / Overleaf)
 * - RIS (EndNote, Zotero, Mendeley, Citavi, Paperpile)
 * 
 * Features:
 * - Direct Rich-Text (HTML) clipboard copy for pasting into MS Word & Google Docs with italics preserved
 * - In-text citation generator with custom page and paragraph locators
 * - Batch Bibliography generator with automatic alphabetization or numeric sorting
 * - Live DOI metadata resolution via Crossref REST API, DOI.org Content Negotiation, and Europe PMC
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
  {
    id: 'apa7',
    name: 'APA 7th Edition',
    shortName: 'APA 7',
    discipline: 'Helsefag, Sykepleie, Psykologi, Pedagogikk, Samfunnsvitenskap',
    description: 'Forfatter-år format med sentence case artikkeltitler og kursivert tidsskrift/volum.'
  },
  {
    id: 'vancouver',
    name: 'Vancouver / ICMJE (NLM)',
    shortName: 'Vancouver',
    discipline: 'Medisin, Biomedisin, Kliniske retningslinjer, Tidsskriftet, BMJ, Lancet',
    description: 'Numerisk sekvensiell sitering [1] med standard NLM-forkortelser for tidsskrift.'
  },
  {
    id: 'harvard',
    name: 'Harvard Style',
    shortName: 'Harvard',
    discipline: 'Naturvitenskap, Økonomi, Tverrfaglige studier',
    description: 'Forfatter-år format med enkle anførselstegn for titler og eksplisitt "Available at:".'
  },
  {
    id: 'chicago-author-date',
    name: 'Chicago 17th / 18th (Author-Date)',
    shortName: 'Chicago (A-D)',
    discipline: 'Samfunnsvitenskap, Antropologi, Naturvitenskap',
    description: 'Forfatter-år format med doble anførselstegn for titler og Title Case.'
  },
  {
    id: 'chicago-notes',
    name: 'Chicago 17th / 18th (Notes & Bibliography)',
    shortName: 'Chicago (Notes)',
    discipline: 'Humaniora, Historie, Etikk, Filosofi',
    description: 'Fotnote- og sluttnotebasert referansestil.'
  },
  {
    id: 'mla9',
    name: 'MLA 9th Edition',
    shortName: 'MLA 9',
    discipline: 'Språk, Litteratur, Kulturstudier, Humaniora',
    description: 'Works Cited format med "vol.", "no." og "pp." deskriptorer.'
  },
  {
    id: 'ieee',
    name: 'IEEE Reference Style',
    shortName: 'IEEE',
    discipline: 'Medisinsk informatikk, Kunstig intelligens, Bioingeniørfag, Teknologi',
    description: 'Numerisk format i hakeparentes [1] med forfatterinitialer først.'
  },
  {
    id: 'bibtex',
    name: 'BibTeX (.bib)',
    shortName: 'BibTeX',
    discipline: 'LaTeX, Overleaf, R Markdown, Quarto',
    description: 'Standard maskinlesbart format for akademisk publisering i LaTeX.'
  },
  {
    id: 'ris',
    name: 'RIS Export Format',
    shortName: 'RIS',
    discipline: 'EndNote, Zotero, Mendeley, Citavi, Paperpile',
    description: 'Universelt utvekslingsformat for alle ledende referansehåndterere.'
  }
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
  rawCslJson?: any;
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
  items: Array<{
    id: string;
    citation: MultiStyleCitationResult;
    parsed: any;
  }>;
}

export class Apa7CitationService {
  /**
   * Copies formatted rich text (HTML) and plain text fallback to clipboard
   */
  public static async copyRichTextToClipboard(htmlContent: string, plainTextFallback: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        const blobHtml = new Blob([htmlContent], { type: 'text/html' });
        const blobText = new Blob([plainTextFallback], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        });
        await navigator.clipboard.write([item]);
        return true;
      }
    } catch (err) {
      console.warn('Rich text clipboard write failed, falling back to writeText', err);
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(plainTextFallback);
        return true;
      }
    } catch (err) {
      console.error('Fallback clipboard writeText also failed', err);
    }

    return false;
  }

  /**
   * Cleans and extracts raw DOI (e.g., "10.1111/jan.12345") from URLs or prefixed strings
   */
  public static cleanDoi(input?: string): string {
    if (!input) return '';
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^doi:\s*/i, '');
    cleaned = cleaned.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    cleaned = cleaned.replace(/\/+$/, '').trim();
    return cleaned;
  }

  /**
   * Validates if a string looks like a standard DOI
   */
  public static isValidDoi(input?: string): boolean {
    const cleaned = this.cleanDoi(input);
    if (!cleaned) return false;
    return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(cleaned);
  }

  /**
   * Parses free-text authors string into structured AuthorName array
   */
  public static parseAuthorString(authorsStr?: string): AuthorName[] {
    if (!authorsStr || !authorsStr.trim()) {
      return [{ family: 'Ukjent forfatter', isOrganization: false }];
    }

    const trimmed = authorsStr.trim();

    const orgPatterns = [
      /world health organization/i,
      /joanna briggs institute/i,
      /helsedirektoratet/i,
      /folkehelseinstituttet/i,
      /cochrane/i,
      /ministry of/i,
      /department of/i,
      /institute/i,
      /association/i,
      /center for/i,
      /centre for/i,
      /group$/i,
      /committee$/i,
      /collaboration$/i
    ];
    if (orgPatterns.some(p => p.test(trimmed)) && !trimmed.includes(';') && !trimmed.includes(',')) {
      return [{ family: trimmed, isOrganization: true }];
    }

    let parts: string[] = [];
    if (trimmed.includes(';')) {
      parts = trimmed.split(';').map(p => p.trim()).filter(Boolean);
    } else if (/\s+and\s+/i.test(trimmed)) {
      parts = trimmed.split(/\s+and\s+/i).map(p => p.trim()).filter(Boolean);
    } else if (trimmed.includes(' & ')) {
      parts = trimmed.split(' & ').map(p => p.trim()).filter(Boolean);
    } else if (trimmed.includes(',') && (trimmed.match(/,/g) || []).length > 2) {
      const rawCommaParts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
      if (rawCommaParts.length % 2 === 0 && rawCommaParts[1].length <= 3) {
        for (let i = 0; i < rawCommaParts.length; i += 2) {
          parts.push(`${rawCommaParts[i]}, ${rawCommaParts[i + 1]}`);
        }
      } else {
        parts = rawCommaParts;
      }
    } else {
      parts = [trimmed];
    }

    const result: AuthorName[] = [];

    for (const part of parts) {
      const cleanPart = part.replace(/\.$/, '').trim();
      if (!cleanPart) continue;

      if (cleanPart.includes(',')) {
        const [last, ...firsts] = cleanPart.split(',');
        const givenCombined = firsts.join(' ').trim();
        result.push({
          family: last.trim(),
          given: givenCombined || undefined
        });
      } else {
        const tokens = cleanPart.split(/\s+/).filter(Boolean);
        if (tokens.length === 1) {
          result.push({ family: tokens[0] });
        } else {
          const family = tokens[tokens.length - 1];
          const given = tokens.slice(0, tokens.length - 1).join(' ');
          result.push({ family, given });
        }
      }
    }

    return result.length > 0 ? result : [{ family: trimmed }];
  }

  /**
   * Formats initials from given name (e.g. "Kjetil" -> "K.", "Paul Andrew" -> "P. A.")
   */
  public static formatInitials(given?: string, withDots = true, withSpaces = true): string {
    if (!given || !given.trim()) return '';
    const clean = given.trim();
    const parts = clean.split(/[\s.]+/).filter(Boolean);
    const formatted = parts.map(part => {
      if (part.includes('-')) {
        return part.split('-').map(sub => sub.charAt(0).toUpperCase() + (withDots ? '.' : '')).join('-');
      }
      return part.charAt(0).toUpperCase() + (withDots ? '.' : '');
    });
    return formatted.join(withSpaces ? ' ' : '');
  }

  /**
   * Formats author list according to APA 7th Edition rules
   */
  public static formatApa7AuthorList(authors: AuthorName[], language: 'nb' | 'en' = 'nb'): string {
    if (!authors || authors.length === 0) return 'Ukjent forfatter';

    const formattedIndividual = authors.map(author => {
      if (author.isOrganization) return author.family;
      const initials = this.formatInitials(author.given);
      return initials ? `${author.family}, ${initials}` : author.family;
    });

    const count = formattedIndividual.length;
    if (count === 1) return formattedIndividual[0];
    if (count === 2) return `${formattedIndividual[0]}, & ${formattedIndividual[1]}`;

    if (count <= 20) {
      const allExceptLast = formattedIndividual.slice(0, count - 1).join(', ');
      return `${allExceptLast}, & ${formattedIndividual[count - 1]}`;
    }

    const first19 = formattedIndividual.slice(0, 19).join(', ');
    const lastOne = formattedIndividual[count - 1];
    return `${first19}, ... ${lastOne}`;
  }

  /**
   * Formats author list according to Vancouver / NLM rules (Last FM, Last FM, et al.)
   */
  public static formatVancouverAuthorList(authors: AuthorName[]): string {
    if (!authors || authors.length === 0) return 'Unknown';

    const formatted = authors.map(a => {
      if (a.isOrganization) return a.family;
      const initialsNoDots = this.formatInitials(a.given, false, false);
      return initialsNoDots ? `${a.family} ${initialsNoDots}` : a.family;
    });

    if (formatted.length > 6) {
      return `${formatted.slice(0, 6).join(', ')}, et al.`;
    }
    return formatted.join(', ');
  }

  /**
   * Formats author list according to Harvard style
   */
  public static formatHarvardAuthorList(authors: AuthorName[], language: 'nb' | 'en' = 'nb'): string {
    if (!authors || authors.length === 0) return 'Anon.';
    const andWord = language === 'nb' ? 'og' : 'and';

    const formatted = authors.map(a => {
      if (a.isOrganization) return a.family;
      const initials = this.formatInitials(a.given);
      return initials ? `${a.family}, ${initials}` : a.family;
    });

    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} ${andWord} ${formatted[1]}`;
    if (formatted.length <= 3) {
      return `${formatted.slice(0, -1).join(', ')} ${andWord} ${formatted[formatted.length - 1]}`;
    }
    return `${formatted[0]} et al.`;
  }

  /**
   * Formats author list according to Chicago Author-Date style
   */
  public static formatChicagoAuthorList(authors: AuthorName[], language: 'nb' | 'en' = 'nb'): string {
    if (!authors || authors.length === 0) return 'Anonymous';
    const andWord = language === 'nb' ? 'og' : 'and';

    if (authors.length === 1) {
      const a = authors[0];
      return a.isOrganization ? a.family : `${a.family}, ${a.given || ''}`.trim();
    }
    if (authors.length === 2) {
      const a1 = authors[0];
      const a2 = authors[1];
      const s1 = a1.isOrganization ? a1.family : `${a1.family}, ${a1.given || ''}`.trim();
      const s2 = a2.isOrganization ? a2.family : `${a2.given || ''} ${a2.family}`.trim();
      return `${s1}, ${andWord} ${s2}`;
    }
    if (authors.length <= 10) {
      const first = authors[0].isOrganization ? authors[0].family : `${authors[0].family}, ${authors[0].given || ''}`.trim();
      const middle = authors.slice(1, -1).map(a => a.isOrganization ? a.family : `${a.given || ''} ${a.family}`.trim());
      const last = authors[authors.length - 1].isOrganization ? authors[authors.length - 1].family : `${authors[authors.length - 1].given || ''} ${authors[authors.length - 1].family}`.trim();
      return `${first}, ${middle.length > 0 ? middle.join(', ') + ', ' : ''}${andWord} ${last}`;
    }
    const firstAuthor = authors[0].isOrganization ? authors[0].family : `${authors[0].family}, ${authors[0].given || ''}`.trim();
    return `${firstAuthor}, et al.`;
  }

  /**
   * Formats author list according to IEEE style (Initials Lastname, Initials Lastname, and Initials Lastname)
   */
  public static formatIeeeAuthorList(authors: AuthorName[], language: 'nb' | 'en' = 'nb'): string {
    if (!authors || authors.length === 0) return 'Anon.';
    const andWord = language === 'nb' ? 'og' : 'and';

    const formatted = authors.map(a => {
      if (a.isOrganization) return a.family;
      const initials = this.formatInitials(a.given);
      return initials ? `${initials} ${a.family}` : a.family;
    });

    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} ${andWord} ${formatted[1]}`;
    if (formatted.length <= 6) {
      return `${formatted.slice(0, -1).join(', ')}, ${andWord} ${formatted[formatted.length - 1]}`;
    }
    return `${formatted[0]} et al.`;
  }

  /**
   * Formats author list according to MLA 9th style
   */
  public static formatMlaAuthorList(authors: AuthorName[], language: 'nb' | 'en' = 'nb'): string {
    if (!authors || authors.length === 0) return 'Unknown Author';
    const andWord = language === 'nb' ? 'og' : 'and';

    if (authors.length === 1) {
      const a = authors[0];
      return a.isOrganization ? a.family : `${a.family}, ${a.given || ''}`.trim();
    }
    if (authors.length === 2) {
      const a1 = authors[0];
      const a2 = authors[1];
      const s1 = a1.isOrganization ? a1.family : `${a1.family}, ${a1.given || ''}`.trim();
      const s2 = a2.isOrganization ? a2.family : `${a2.given || ''} ${a2.family}`.trim();
      return `${s1}, ${andWord} ${s2}`;
    }
    const firstAuthor = authors[0].isOrganization ? authors[0].family : `${authors[0].family}, ${authors[0].given || ''}`.trim();
    return `${firstAuthor}, et al.`;
  }

  /**
   * Formats an article title in APA 7th Sentence Case
   */
  public static toApaSentenceCase(title?: string): string {
    if (!title || !title.trim()) return 'Uten tittel.';
    let clean = title.trim();

    const preservedAcronyms = new Set([
      'JBI', 'WHO', 'COVID-19', 'SARS-CoV-2', 'NHS', 'RCT', 'HIV', 'AIDS', 'DNA', 'RNA', 
      'APA', 'AMSTAR', 'GRADE', 'CERQual', 'CASP', 'AGREE', 'RoB', 'PRISMA', 'ICU', 'GP',
      'Norge', 'Norway', 'UK', 'USA', 'EU', 'SF-36', 'EQ-5D'
    ]);

    const segments = clean.split(/([:?]\s+)/);
    const formattedSegments = segments.map((seg, idx) => {
      if (idx % 2 === 1) return seg;
      
      const words = seg.split(/\s+/);
      const formattedWords = words.map((w, wIdx) => {
        const pureWord = w.replace(/^[("']+|[)"',.;:!?]+$/g, '');
        if (preservedAcronyms.has(pureWord) || (pureWord.length > 1 && pureWord === pureWord.toUpperCase() && /^[A-Z0-9-]+$/.test(pureWord))) {
          return w;
        }

        if (wIdx === 0) {
          return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }

        return w.toLowerCase();
      });

      return formattedWords.join(' ');
    });

    let result = formattedSegments.join('');
    if (!/[.!?]$/.test(result)) {
      result += '.';
    }
    return result;
  }

  /**
   * Formats a Journal title in Title Case
   */
  public static toJournalTitleCase(journal?: string): string {
    if (!journal || !journal.trim()) return '';
    const minorWords = new Set([
      'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'with', 'og', 'i', 'av', 'for', 'på'
    ]);

    const words = journal.trim().split(/\s+/);
    return words.map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  /**
   * Builds complete formatted outputs across all citation styles
   */
  public static formatApa7(input: Apa7MetadataInput, language: 'nb' | 'en' = 'nb', sequentialIndex = 1): Apa7FormattedResult {
    const authorsList = Array.isArray(input.authors) 
      ? input.authors 
      : this.parseAuthorString(input.authors);

    let yearStr = 'n.d.';
    if (input.year) {
      const parsedYear = String(input.year).match(/\b(19\d\d|20\d\d)\b/);
      if (parsedYear) {
        yearStr = parsedYear[1];
      } else if (String(input.year).trim()) {
        yearStr = String(input.year).trim();
      }
    }

    const rawTitle = (input.title || 'Uten tittel').replace(/\.$/, '').trim();
    const apaTitle = this.toApaSentenceCase(input.title);
    const journalTitle = this.toJournalTitleCase(input.journal);
    const volume = input.volume ? String(input.volume).trim() : '';
    const issue = input.issue ? String(input.issue).trim() : '';
    let pages = input.pages ? String(input.pages).trim() : '';
    if (pages) pages = pages.replace(/-/g, '–');
    const articleNumber = input.articleNumber ? String(input.articleNumber).trim() : '';

    const rawDoi = this.cleanDoi(input.doi);
    const doiUrl = rawDoi ? `https://doi.org/${rawDoi}` : (input.url?.trim() || '');

    const firstAuthor = authorsList[0] || { family: 'Ukjent' };
    const secondAuthor = authorsList[1];
    const authorCount = authorsList.length;
    const andWord = language === 'nb' ? 'og' : '&';
    const andNarrative = language === 'nb' ? 'og' : 'and';
    const pagePrefix = language === 'nb' ? 's.' : 'p.';

    // -------------------------------------------------------------
    // 1. APA 7th Edition
    // -------------------------------------------------------------
    const apaAuthors = this.formatApa7AuthorList(authorsList, language);
    let apaContainerPlain = '';
    let apaContainerHtml = '';
    let apaContainerMd = '';

    if (journalTitle) {
      apaContainerPlain += journalTitle;
      apaContainerHtml += `<i>${journalTitle}</i>`;
      apaContainerMd += `*${journalTitle}*`;

      if (volume) {
        apaContainerPlain += `, ${volume}`;
        apaContainerHtml += `, <i>${volume}</i>`;
        apaContainerMd += `, *${volume}*`;
        if (issue) {
          apaContainerPlain += `(${issue})`;
          apaContainerHtml += `(${issue})`;
          apaContainerMd += `(${issue})`;
        }
      } else if (issue) {
        apaContainerPlain += `, (${issue})`;
        apaContainerHtml += `, (${issue})`;
        apaContainerMd += `, (${issue})`;
      }

      if (pages) {
        apaContainerPlain += `, ${pages}.`;
        apaContainerHtml += `, ${pages}.`;
        apaContainerMd += `, ${pages}.`;
      } else if (articleNumber) {
        const label = articleNumber.toLowerCase().startsWith('art') ? articleNumber : `Artikkel ${articleNumber}`;
        apaContainerPlain += `, ${label}.`;
        apaContainerHtml += `, ${label}.`;
        apaContainerMd += `, ${label}.`;
      } else {
        apaContainerPlain += '.';
        apaContainerHtml += '.';
        apaContainerMd += '.';
      }
    } else if (input.publisher) {
      apaContainerPlain += `${input.publisher}.`;
      apaContainerHtml += `${input.publisher}.`;
      apaContainerMd += `${input.publisher}.`;
    }

    const apaPlain = `${apaAuthors} (${yearStr}). ${apaTitle}${apaContainerPlain ? ' ' + apaContainerPlain : ''}${doiUrl ? ' ' + doiUrl : ''}`;
    const apaHtml = `${apaAuthors} (${yearStr}). ${apaTitle}${apaContainerHtml ? ' ' + apaContainerHtml : ''}${doiUrl ? ` <a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline">${doiUrl}</a>` : ''}`;
    const apaMd = `${apaAuthors} (${yearStr}). ${apaTitle}${apaContainerMd ? ' ' + apaContainerMd : ''}${doiUrl ? ' ' + doiUrl : ''}`;

    let apaPar = '';
    let apaNar = '';
    if (authorCount === 1) {
      apaPar = `(${firstAuthor.family}, ${yearStr})`;
      apaNar = `${firstAuthor.family} (${yearStr})`;
    } else if (authorCount === 2) {
      apaPar = `(${firstAuthor.family} ${andWord} ${secondAuthor.family}, ${yearStr})`;
      apaNar = `${firstAuthor.family} ${andNarrative} ${secondAuthor.family} (${yearStr})`;
    } else {
      apaPar = `(${firstAuthor.family} et al., ${yearStr})`;
      apaNar = `${firstAuthor.family} et al. (${yearStr})`;
    }

    const apaWithPage = (p: string | number) => {
      const cleanP = String(p).replace(/^[sp.]+/i, '').trim();
      if (authorCount === 1) return `(${firstAuthor.family}, ${yearStr}, ${pagePrefix} ${cleanP})`;
      if (authorCount === 2) return `(${firstAuthor.family} ${andWord} ${secondAuthor.family}, ${yearStr}, ${pagePrefix} ${cleanP})`;
      return `(${firstAuthor.family} et al., ${yearStr}, ${pagePrefix} ${cleanP})`;
    };

    // -------------------------------------------------------------
    // 2. Vancouver / NLM
    // -------------------------------------------------------------
    const vancAuthors = this.formatVancouverAuthorList(authorsList);
    const vancPages = pages.replace(/–/g, '-');
    let vancSource = '';
    if (journalTitle) {
      vancSource += `${journalTitle}. ${yearStr}`;
      if (volume) {
        vancSource += `;${volume}`;
        if (issue) vancSource += `(${issue})`;
      }
      if (vancPages) vancSource += `:${vancPages}`;
      vancSource += '.';
    }
    const vancDoi = rawDoi ? ` doi:${rawDoi}` : '';
    const vancPlain = `${vancAuthors}. ${rawTitle}. ${vancSource}${vancDoi}`;
    const vancHtml = `${vancAuthors}. ${rawTitle}. ${vancSource}${rawDoi ? ` <a href="https://doi.org/${rawDoi}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline">doi:${rawDoi}</a>` : ''}`;
    const vancMd = `${vancAuthors}. ${rawTitle}. ${vancSource}${vancDoi}`;

    // -------------------------------------------------------------
    // 3. Harvard
    // -------------------------------------------------------------
    const harvAuthors = this.formatHarvardAuthorList(authorsList, language);
    let harvSourcePlain = '';
    let harvSourceHtml = '';
    if (journalTitle) {
      harvSourcePlain = `${journalTitle}, ${volume}${issue ? `(${issue})` : ''}, pp. ${pages}.`;
      harvSourceHtml = `<i>${journalTitle}</i>, ${volume}${issue ? `(${issue})` : ''}, pp. ${pages}.`;
    }
    const harvAvail = doiUrl ? ` Available at: ${doiUrl}.` : '';
    const harvPlain = `${harvAuthors} (${yearStr}) '${rawTitle}', ${harvSourcePlain}${harvAvail}`;
    const harvHtml = `${harvAuthors} (${yearStr}) '${rawTitle}', ${harvSourceHtml}${doiUrl ? ` Available at: <a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline">${doiUrl}</a>.` : ''}`;
    const harvMd = `${harvAuthors} (${yearStr}) '${rawTitle}', *${journalTitle}*, ${volume}${issue ? `(${issue})` : ''}, pp. ${pages}.${harvAvail}`;

    // -------------------------------------------------------------
    // 4. Chicago Author-Date
    // -------------------------------------------------------------
    const chicAuthors = this.formatChicagoAuthorList(authorsList, language);
    let chicSourcePlain = '';
    let chicSourceHtml = '';
    if (journalTitle) {
      chicSourcePlain = `${journalTitle} ${volume}${issue ? ` (${issue})` : ''}: ${pages}.`;
      chicSourceHtml = `<i>${journalTitle}</i> ${volume}${issue ? ` (${issue})` : ''}: ${pages}.`;
    }
    const chicPlain = `${chicAuthors}. ${yearStr}. "${rawTitle}." ${chicSourcePlain}${doiUrl ? ' ' + doiUrl + '.' : ''}`;
    const chicHtml = `${chicAuthors}. ${yearStr}. "${rawTitle}." ${chicSourceHtml}${doiUrl ? ` <a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline">${doiUrl}</a>.` : ''}`;
    const chicMd = `${chicAuthors}. ${yearStr}. "${rawTitle}." *${journalTitle}* ${volume}${issue ? ` (${issue})` : ''}: ${pages}.${doiUrl ? ' ' + doiUrl + '.' : ''}`;

    // -------------------------------------------------------------
    // 5. Chicago Notes & Bibliography
    // -------------------------------------------------------------
    const chicNoteAuthor = authorsList.map(a => a.isOrganization ? a.family : `${a.given || ''} ${a.family}`.trim()).join(', ');
    const chicNotesPlain = `${chicNoteAuthor}, "${rawTitle}," ${journalTitle} ${volume}, no. ${issue || '1'} (${yearStr}): ${pages || '1'}, ${doiUrl}.`;
    const chicNotesHtml = `${chicNoteAuthor}, "${rawTitle}," <i>${journalTitle}</i> ${volume}, no. ${issue || '1'} (${yearStr}): ${pages || '1'}, <a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline">${doiUrl}</a>.`;
    const chicNotesMd = `${chicNoteAuthor}, "${rawTitle}," *${journalTitle}* ${volume}, no. ${issue || '1'} (${yearStr}): ${pages || '1'}, ${doiUrl}.`;

    // -------------------------------------------------------------
    // 6. MLA 9th Edition
    // -------------------------------------------------------------
    const mlaAuthors = this.formatMlaAuthorList(authorsList, language);
    let mlaSourcePlain = '';
    let mlaSourceHtml = '';
    if (journalTitle) {
      mlaSourcePlain = `${journalTitle}, vol. ${volume || '1'}, no. ${issue || '1'}, ${yearStr}, pp. ${pages}.`;
      mlaSourceHtml = `<i>${journalTitle}</i>, vol. ${volume || '1'}, no. ${issue || '1'}, ${yearStr}, pp. ${pages}.`;
    }
    const mlaDoi = rawDoi ? ` https://doi.org/${rawDoi}.` : '';
    const mlaPlain = `${mlaAuthors}. "${rawTitle}." ${mlaSourcePlain}${mlaDoi}`;
    const mlaHtml = `${mlaAuthors}. "${rawTitle}." ${mlaSourceHtml}${rawDoi ? ` <a href="https://doi.org/${rawDoi}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline">https://doi.org/${rawDoi}</a>.` : ''}`;
    const mlaMd = `${mlaAuthors}. "${rawTitle}." *${journalTitle}*, vol. ${volume || '1'}, no. ${issue || '1'}, ${yearStr}, pp. ${pages}.${mlaDoi}`;

    // -------------------------------------------------------------
    // 7. IEEE Style
    // -------------------------------------------------------------
    const ieeeAuthors = this.formatIeeeAuthorList(authorsList, language);
    let ieeeSourcePlain = '';
    let ieeeSourceHtml = '';
    if (journalTitle) {
      ieeeSourcePlain = `"${rawTitle}," ${journalTitle}, vol. ${volume || '1'}, no. ${issue || '1'}, pp. ${pages}, ${yearStr}, doi: ${rawDoi || 'N/A'}.`;
      ieeeSourceHtml = `"${rawTitle}," <i>${journalTitle}</i>, vol. ${volume || '1'}, no. ${issue || '1'}, pp. ${pages}, ${yearStr}, doi: <a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-700 underline">${rawDoi || 'N/A'}</a>.`;
    }
    const ieeePlain = `[${sequentialIndex}] ${ieeeAuthors}, ${ieeeSourcePlain}`;
    const ieeeHtml = `[${sequentialIndex}] ${ieeeAuthors}, ${ieeeSourceHtml}`;
    const ieeeMd = `[${sequentialIndex}] ${ieeeAuthors}, "${rawTitle}," *${journalTitle}*, vol. ${volume || '1'}, no. ${issue || '1'}, pp. ${pages}, ${yearStr}, doi: ${rawDoi || 'N/A'}.`;

    // -------------------------------------------------------------
    // 8. BibTeX
    // -------------------------------------------------------------
    const firstAuthClean = (firstAuthor?.family || 'item').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const citeKey = `${firstAuthClean}_${yearStr}`;
    const bibAuthors = authorsList.map(a => `${a.family}, ${a.given || ''}`).join(' and ');
    const bibtex = `@article{${citeKey},
  author    = {${bibAuthors}},
  title     = {${input.title || 'Uten tittel'}},
  journal   = {${journalTitle}},
  year      = {${yearStr}},
  volume    = {${volume}},
  number    = {${issue}},
  pages     = {${pages}},
  doi       = {${rawDoi}},
  url       = {${doiUrl}}
}`;

    // -------------------------------------------------------------
    // 9. RIS
    // -------------------------------------------------------------
    let ris = `TY  - JOUR\n`;
    authorsList.forEach(a => {
      ris += `AU  - ${a.family}, ${a.given || ''}\n`;
    });
    ris += `TI  - ${input.title || ''}\n`;
    if (journalTitle) ris += `JO  - ${journalTitle}\n`;
    if (yearStr !== 'n.d.') ris += `PY  - ${yearStr}\n`;
    if (volume) ris += `VL  - ${volume}\n`;
    if (issue) ris += `IS  - ${issue}\n`;
    if (pages) {
      const [sp, ep] = pages.split('–');
      if (sp) ris += `SP  - ${sp.trim()}\n`;
      if (ep) ris += `EP  - ${ep.trim()}\n`;
    }
    if (rawDoi) ris += `DO  - ${rawDoi}\n`;
    if (doiUrl) ris += `UR  - ${doiUrl}\n`;
    ris += `ER  - \n`;

    // Style map dictionary
    const styles: Record<CitationStyleId, MultiStyleCitationResult> = {
      apa7: {
        style: 'apa7',
        styleName: 'APA 7th Edition',
        plainText: apaPlain,
        htmlFormatted: apaHtml,
        markdownFormatted: apaMd,
        inTextParenthetical: apaPar,
        inTextNarrative: apaNar,
        inTextWithPage: apaWithPage
      },
      vancouver: {
        style: 'vancouver',
        styleName: 'Vancouver / ICMJE (NLM)',
        plainText: vancPlain,
        htmlFormatted: vancHtml,
        markdownFormatted: vancMd,
        inTextParenthetical: `[${sequentialIndex}]`,
        inTextNarrative: `[${sequentialIndex}]`,
        inTextWithPage: (p) => `[${sequentialIndex}, ${pagePrefix} ${p}]`
      },
      harvard: {
        style: 'harvard',
        styleName: 'Harvard Style',
        plainText: harvPlain,
        htmlFormatted: harvHtml,
        markdownFormatted: harvMd,
        inTextParenthetical: authorCount === 1 ? `(${firstAuthor.family}, ${yearStr})` : (authorCount === 2 ? `(${firstAuthor.family} and ${secondAuthor.family}, ${yearStr})` : `(${firstAuthor.family} et al., ${yearStr})`),
        inTextNarrative: authorCount === 1 ? `${firstAuthor.family} (${yearStr})` : (authorCount === 2 ? `${firstAuthor.family} and ${secondAuthor.family} (${yearStr})` : `${firstAuthor.family} et al. (${yearStr})`),
        inTextWithPage: (p) => `(${firstAuthor.family}${authorCount > 2 ? ' et al.' : ''}, ${yearStr}, p. ${p})`
      },
      'chicago-author-date': {
        style: 'chicago-author-date',
        styleName: 'Chicago (Author-Date)',
        plainText: chicPlain,
        htmlFormatted: chicHtml,
        markdownFormatted: chicMd,
        inTextParenthetical: authorCount === 1 ? `(${firstAuthor.family} ${yearStr})` : `(${firstAuthor.family} and ${secondAuthor?.family || ''} ${yearStr})`,
        inTextNarrative: `${firstAuthor.family} (${yearStr})`,
        inTextWithPage: (p) => `(${firstAuthor.family} ${yearStr}, ${p})`
      },
      'chicago-notes': {
        style: 'chicago-notes',
        styleName: 'Chicago (Notes & Bibliography)',
        plainText: chicNotesPlain,
        htmlFormatted: chicNotesHtml,
        markdownFormatted: chicNotesMd,
        inTextParenthetical: `^${sequentialIndex}`,
        inTextNarrative: `^${sequentialIndex}`,
        inTextWithPage: (p) => `^${sequentialIndex}, ${p}`
      },
      mla9: {
        style: 'mla9',
        styleName: 'MLA 9th Edition',
        plainText: mlaPlain,
        htmlFormatted: mlaHtml,
        markdownFormatted: mlaMd,
        inTextParenthetical: authorCount === 1 ? `(${firstAuthor.family})` : `(${firstAuthor.family} and ${secondAuthor?.family || ''})`,
        inTextNarrative: `${firstAuthor.family}`,
        inTextWithPage: (p) => `(${firstAuthor.family} ${p})`
      },
      ieee: {
        style: 'ieee',
        styleName: 'IEEE Reference Style',
        plainText: ieeePlain,
        htmlFormatted: ieeeHtml,
        markdownFormatted: ieeeMd,
        inTextParenthetical: `[${sequentialIndex}]`,
        inTextNarrative: `[${sequentialIndex}]`,
        inTextWithPage: (p) => `[${sequentialIndex}, p. ${p}]`
      },
      bibtex: {
        style: 'bibtex',
        styleName: 'BibTeX (.bib)',
        plainText: bibtex,
        htmlFormatted: `<pre>${bibtex}</pre>`,
        markdownFormatted: `\`\`\`bibtex\n${bibtex}\n\`\`\``,
        inTextParenthetical: `\\cite{${citeKey}}`,
        inTextNarrative: `\\citet{${citeKey}}`,
        inTextWithPage: (p) => `\\cite[${pagePrefix} ${p}]{${citeKey}}`
      },
      ris: {
        style: 'ris',
        styleName: 'RIS Export Format',
        plainText: ris,
        htmlFormatted: `<pre>${ris}</pre>`,
        markdownFormatted: `\`\`\`ris\n${ris}\n\`\`\``,
        inTextParenthetical: `(RIS: ${citeKey})`,
        inTextNarrative: `(RIS: ${citeKey})`,
        inTextWithPage: (p) => `(RIS: ${citeKey}, p. ${p})`
      }
    };

    const shortCitation = `${firstAuthor.family}${authorCount > 1 ? (authorCount === 2 ? ` & ${secondAuthor.family}` : ' et al.') : ''} (${yearStr})`;

    return {
      plainText: apaPlain,
      htmlFormatted: apaHtml,
      markdownFormatted: apaMd,
      shortCitation,
      parentheticalCitation: apaPar,
      narrativeCitation: apaNar,
      parentheticalWithPage: apaWithPage,
      narrativeWithPage: (p) => {
        const cleanP = String(p).replace(/^[sp.]+/i, '').trim();
        if (authorCount === 1) return `${firstAuthor.family} (${yearStr}, ${pagePrefix} ${cleanP})`;
        if (authorCount === 2) return `${firstAuthor.family} ${andNarrative} ${secondAuthor.family} (${yearStr}, ${pagePrefix} ${cleanP})`;
        return `${firstAuthor.family} et al. (${yearStr}, ${pagePrefix} ${cleanP})`;
      },
      bibtex,
      ris,
      normalizedDoi: rawDoi || undefined,
      doiUrl: doiUrl || undefined,
      styles,
      parsedMetadata: {
        title: input.title || '',
        authors: authorsList,
        year: yearStr,
        journal: journalTitle,
        volume,
        issue,
        pages,
        articleNumber,
        doi: rawDoi,
        doiUrl
      }
    };
  }

  /**
   * Generates a batch bibliography across multiple articles in a specified citation style
   */
  public static generateBatchBibliography(
    articles: Array<{ id: string; title: string; authors?: string; year?: number | string; journal?: string; volumeIssue?: string; pages?: string; doi?: string; sourceUrl?: string }>,
    style: CitationStyleId = 'apa7',
    sortOrder: 'author' | 'year' | 'order' = 'author',
    language: 'nb' | 'en' = 'nb'
  ): BatchBibliographyResult {
    // Sort articles
    const sorted = [...articles].sort((a, b) => {
      if (sortOrder === 'author') {
        const authA = (a.authors || '').toLowerCase();
        const authB = (b.authors || '').toLowerCase();
        return authA.localeCompare(authB);
      }
      if (sortOrder === 'year') {
        const yrA = typeof a.year === 'number' ? a.year : parseInt(String(a.year), 10) || 0;
        const yrB = typeof b.year === 'number' ? b.year : parseInt(String(b.year), 10) || 0;
        return yrB - yrA; // newest first
      }
      return 0; // retain original sequential order
    });

    const items: Array<{ id: string; citation: MultiStyleCitationResult; parsed: any }> = [];
    const plainList: string[] = [];
    const htmlList: string[] = [];
    const mdList: string[] = [];
    const bibtexList: string[] = [];
    const risList: string[] = [];

    sorted.forEach((art, index) => {
      const seqIndex = index + 1;
      const formatted = this.formatApa7({
        title: art.title,
        authors: art.authors,
        year: art.year,
        journal: art.journal,
        volume: art.volumeIssue?.split('(')[0]?.trim(),
        issue: art.volumeIssue?.match(/\((.*?)\)/)?.[1],
        pages: art.pages,
        doi: art.doi,
        url: art.sourceUrl
      }, language, seqIndex);

      const styleResult = formatted.styles[style] || formatted.styles.apa7;
      items.push({
        id: art.id,
        citation: styleResult,
        parsed: formatted.parsedMetadata
      });

      plainList.push(styleResult.plainText);
      htmlList.push(`<div style="margin-bottom: 1em; padding-left: 2em; text-indent: -2em;">${styleResult.htmlFormatted}</div>`);
      mdList.push(`${seqIndex}. ${styleResult.markdownFormatted}`);
      bibtexList.push(formatted.bibtex);
      risList.push(formatted.ris);
    });

    return {
      style,
      count: items.length,
      plainText: plainList.join('\n\n'),
      htmlFormatted: `<div class="bibliography-container font-serif">\n${htmlList.join('\n')}\n</div>`,
      markdownFormatted: mdList.join('\n\n'),
      bibtexBlock: bibtexList.join('\n\n'),
      risBlock: risList.join('\n'),
      items
    };
  }

  /**
   * Fetches metadata for a given DOI using official Crossref Content Negotiation and open APIs
   */
  public static async lookupDoi(doiOrUrl: string, language: 'nb' | 'en' = 'nb'): Promise<DoiLookupResult> {
    const cleanDoi = this.cleanDoi(doiOrUrl);

    if (!cleanDoi) {
      return {
        success: false,
        source: 'Local Parser',
        errorMessage: 'Ingen gyldig DOI oppgitt.',
        formatted: this.formatApa7({}, language)
      };
    }

    // Step 1: Attempt Content Negotiation on https://doi.org with CSL-JSON
    try {
      const cslResponse = await fetch(`https://doi.org/${cleanDoi}`, {
        headers: {
          'Accept': 'application/vnd.citationstyles.csl+json, application/json'
        }
      });

      if (cslResponse.ok) {
        const csl = await cslResponse.json();
        const authors: AuthorName[] = [];
        if (Array.isArray(csl.author)) {
          csl.author.forEach((a: any) => {
            if (a.family) {
              authors.push({
                family: a.family,
                given: a.given || a['non-dropping-particle'] || undefined
              });
            } else if (a.name || a.literal) {
              authors.push({
                family: a.name || a.literal,
                isOrganization: true
              });
            }
          });
        }

        let year: string | number = '';
        if (csl['published-print']?.['date-parts']?.[0]?.[0]) {
          year = csl['published-print']['date-parts'][0][0];
        } else if (csl['published-online']?.['date-parts']?.[0]?.[0]) {
          year = csl['published-online']['date-parts'][0][0];
        } else if (csl.issued?.['date-parts']?.[0]?.[0]) {
          year = csl.issued['date-parts'][0][0];
        } else if (csl.created?.['date-parts']?.[0]?.[0]) {
          year = csl.created['date-parts'][0][0];
        }

        const formatted = this.formatApa7({
          title: csl.title || csl['original-title'],
          authors: authors.length > 0 ? authors : undefined,
          year,
          journal: csl['container-title'] || csl['short-container-title'] || csl.publisher,
          volume: csl.volume,
          issue: csl.issue,
          pages: csl.page,
          articleNumber: csl['article-number'],
          doi: cleanDoi,
          url: csl.URL || `https://doi.org/${cleanDoi}`,
          publisher: csl.publisher,
          abstract: csl.abstract
        }, language);

        return {
          success: true,
          source: 'DOI Content Negotiation',
          formatted,
          rawCslJson: csl
        };
      }
    } catch (err) {
      console.warn('DOI Content Negotiation failed, falling back to Crossref REST API', err);
    }

    // Step 2: Fallback to Crossref REST API
    try {
      const crResponse = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`);
      if (crResponse.ok) {
        const crData = await crResponse.json();
        const msg = crData.message;
        
        const authors: AuthorName[] = [];
        if (Array.isArray(msg.author)) {
          msg.author.forEach((a: any) => {
            if (a.family) {
              authors.push({
                family: a.family,
                given: a.given
              });
            } else if (a.name) {
              authors.push({
                family: a.name,
                isOrganization: true
              });
            }
          });
        }

        const title = Array.isArray(msg.title) ? msg.title[0] : (msg.title || 'Uten tittel');
        const journal = Array.isArray(msg['container-title']) ? msg['container-title'][0] : (msg['container-title'] || msg.publisher);
        const year = msg.published?.['date-parts']?.[0]?.[0] || msg['published-print']?.['date-parts']?.[0]?.[0] || msg['published-online']?.['date-parts']?.[0]?.[0];

        const formatted = this.formatApa7({
          title,
          authors: authors.length > 0 ? authors : undefined,
          year,
          journal,
          volume: msg.volume,
          issue: msg.issue,
          pages: msg.page,
          articleNumber: msg['article-number'],
          doi: cleanDoi,
          url: msg.URL || `https://doi.org/${cleanDoi}`,
          publisher: msg.publisher
        }, language);

        return {
          success: true,
          source: 'Crossref REST API',
          formatted,
          rawCslJson: msg
        };
      }
    } catch (err) {
      console.warn('Crossref REST API failed, falling back to Europe PMC', err);
    }

    // Step 3: Fallback to Europe PMC
    try {
      const epmcResponse = await fetch(`https://api.europepmc.org/search?query=DOI:${encodeURIComponent(cleanDoi)}&format=json&resultType=core`);
      if (epmcResponse.ok) {
        const epmcData = await epmcResponse.json();
        const item = epmcData.resultList?.result?.[0];
        if (item) {
          const authors: AuthorName[] = [];
          if (item.authorList?.author) {
            item.authorList.author.forEach((a: any) => {
              if (a.lastName) {
                authors.push({
                  family: a.lastName,
                  given: a.firstName || a.initials
                });
              } else if (a.fullName) {
                authors.push({ family: a.fullName });
              }
            });
          } else if (item.authorString) {
            authors.push(...this.parseAuthorString(item.authorString));
          }

          const formatted = this.formatApa7({
            title: item.title?.replace(/<[^>]*>?/gm, ''),
            authors: authors.length > 0 ? authors : undefined,
            year: item.pubYear,
            journal: item.journalTitle || item.journalInfo?.journal?.title,
            volume: item.journalInfo?.volume,
            issue: item.journalInfo?.issue,
            pages: item.pageInfo,
            doi: cleanDoi,
            url: `https://doi.org/${cleanDoi}`,
            abstract: item.abstractText
          }, language);

          return {
            success: true,
            source: 'Europe PMC',
            formatted,
            rawCslJson: item
          };
        }
      }
    } catch (err) {
      console.warn('Europe PMC search failed', err);
    }

    return {
      success: false,
      source: 'Local Parser',
      errorMessage: `Kunne ikke finne DOI "${cleanDoi}" i internasjonale registre (Crossref/Europe PMC). Sjekk at DOI-koden er skrevet riktig.`,
      formatted: this.formatApa7({ doi: cleanDoi }, language)
    };
  }
}
