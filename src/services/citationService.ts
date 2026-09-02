export type CitationMetadata = {
  doi?: string;
  pmid?: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
};

export class CitationService {
  static apa7(m: CitationMetadata) {
    const authors = m.authors.length ? m.authors.join(', ') : 'Unknown author';
    const year = m.year ? '(' + m.year + ')' : '(n.d.)';
    const title = m.title.trim().replace(/[.]+$/, '');
    const journal = m.journal ? ' ' + m.journal : '';
    const volume = m.volume ? ', ' + m.volume : '';
    const issue = m.issue ? '(' + m.issue + ')' : '';
    const pages = m.pages ? ', ' + m.pages : '';
    const doi = m.doi ? ' https://doi.org/' + m.doi.replace(/^https?:\/\/doi.org\//, '') : (m.url ? ' ' + m.url : '');
    return (authors + ' ' + year + '. ' + title + '.' + journal + volume + issue + pages + '.' + doi).replace(/\s+/g, ' ').trim();
  }

  static vancouver(m: CitationMetadata) {
    const authorText = m.authors.slice(0, 6).join(', ');
    const extra = m.authors.length > 6 ? ', et al.' : '';
    return (authorText + extra + '. ' + m.title + '. ' + (m.journal || '') + '. ' + (m.year || '') + ';' + (m.volume || '') + (m.issue ? '(' + m.issue + ')' : '') + ':' + (m.pages || '') + '.').replace(/\s+/g, ' ').trim();
  }
}
