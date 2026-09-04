import { ArticleAppraisal, JBIEvaluationItem, AuditTrailEntry } from '../types';
import { JBI_QUESTIONS } from '../data/jbiData';
import { JbiQualitativeValidationService } from './jbiValidationService';
import { DocumentParserService } from './documentParserService';
import { generateUniqueId, generateArticleId, generateAuditId } from './idGenerator';
import JSZip from 'jszip';

export type SupportedImportFormat = 'ris' | 'bibtex' | 'json' | 'csv' | 'tsv' | 'pubmed' | 'document' | 'unknown';
export type SupportedExportFormat = 
  | 'json' 
  | 'zip'
  | 'csv' 
  | 'tsv' 
  | 'excel' 
  | 'word' 
  | 'pdf' 
  | 'ris' 
  | 'bibtex' 
  | 'markdown' 
  | 'latex' 
  | 'txt';

export interface ImportPreviewItem {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  design: string;
  abstract?: string;
  items?: JBIEvaluationItem[];
  verdict?: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon';
  isDuplicate?: boolean;
}

export interface ImportResult {
  format: SupportedImportFormat;
  formatName: string;
  totalParsed: number;
  newArticles: ArticleAppraisal[];
  duplicatesCount: number;
  warnings: string[];
}

export interface ExportOptions {
  scope: 'all' | 'included_only' | 'selected_only';
  selectedArticleId?: string;
  includeJustifications: boolean;
  includeAuditTrail: boolean;
  includeEvidenceQuotes: boolean;
  projectName?: string;
}

export class ImportExportService {

  // ==========================================
  // FORMAT AUTO-DETECTION
  // ==========================================
  public static detectFormat(content: string, fileName?: string): SupportedImportFormat {
    const trimmed = content.trim();
    const lowerName = (fileName || '').toLowerCase();

    if (lowerName.endsWith('.ris')) return 'ris';
    if (lowerName.endsWith('.bib') || lowerName.endsWith('.bibtex')) return 'bibtex';
    if (lowerName.endsWith('.json')) return 'json';
    if (lowerName.endsWith('.csv')) return 'csv';
    if (lowerName.endsWith('.tsv') || lowerName.endsWith('.tab')) return 'tsv';
    if (lowerName.endsWith('.nbib') || lowerName.endsWith('.medline')) return 'pubmed';
    if (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx')) return 'document';

    // Content inspection
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // not valid json
      }
    }

    if (/^TY\s{1,2}-\s+/m.test(trimmed) || /^(ER\s{1,2}-\s*)/m.test(trimmed)) {
      return 'ris';
    }

    if (/@(article|book|inproceedings|misc|phdthesis|techreport)\s*\{/i.test(trimmed)) {
      return 'bibtex';
    }

    if (/^(PMID|PMID-|TI\s{1,2}-|AU\s{1,2}-)/m.test(trimmed)) {
      return 'pubmed';
    }

    const firstLine = trimmed.split('\n')[0] || '';
    if (firstLine.includes('\t')) return 'tsv';
    if (firstLine.includes(';') || firstLine.includes(',')) {
      const headerLower = firstLine.toLowerCase();
      if (headerLower.includes('title') || headerLower.includes('tittel') || headerLower.includes('author') || headerLower.includes('doi') || headerLower.includes('forfatter')) {
        return firstLine.includes(';') ? 'csv' : 'csv';
      }
    }

    return 'unknown';
  }

  // ==========================================
  // 1. IMPORT PARSERS
  // ==========================================

  /**
   * Universal text/file importer
   */
  public static async parseImport(
    content: string | ArrayBuffer,
    fileName: string,
    existingArticles: ArticleAppraisal[] = []
  ): Promise<ImportResult> {
    const existingDois = new Set(existingArticles.map(a => a.doi.toLowerCase().trim()).filter(Boolean));
    const existingTitles = new Set(existingArticles.map(a => a.title.toLowerCase().trim()).filter(Boolean));

    let stringContent = '';
    if (typeof content === 'string') {
      stringContent = content;
    } else {
      // Document file (PDF, Word, etc.)
      const parseRes = await DocumentParserService.parseFile({
        name: fileName,
        size: content.byteLength,
        content
      });

      const newArticle = this.createDefaultArticle({
        title: parseRes.metadata.title,
        authors: parseRes.metadata.authors,
        year: parseRes.metadata.year,
        journal: parseRes.metadata.journal,
        doi: parseRes.metadata.doi,
        design: parseRes.metadata.studyDesignDetected,
        studyContext: parseRes.metadata.abstract || undefined,
        sourceName: fileName
      });

      return {
        format: 'document',
        formatName: 'Forskningsdokument (PDF/DOCX/TXT)',
        totalParsed: 1,
        newArticles: [newArticle],
        duplicatesCount: (newArticle.doi && existingDois.has(newArticle.doi.toLowerCase())) ? 1 : 0,
        warnings: parseRes.isScannedOrImageOnly ? ['Dokumentet er en skannet PDF. Teksten er ekstrahert med OCR-forbehold.'] : []
      };
    }

    const detectedFormat = this.detectFormat(stringContent, fileName);
    let parsedItems: ImportPreviewItem[] = [];
    const warnings: string[] = [];

    switch (detectedFormat) {
      case 'ris':
        parsedItems = this.parseRis(stringContent);
        break;
      case 'bibtex':
        parsedItems = this.parseBibtex(stringContent);
        break;
      case 'json':
        parsedItems = this.parseJson(stringContent);
        break;
      case 'csv':
      case 'tsv':
        parsedItems = this.parseDelimited(stringContent, detectedFormat === 'tsv' ? '\t' : (stringContent.includes(';') ? ';' : ','));
        break;
      case 'pubmed':
        parsedItems = this.parsePubmed(stringContent);
        break;
      default:
        // Fallback: analyze unstructured text as article
        const meta = DocumentParserService.extractMetadata(stringContent, fileName);
        parsedItems = [{
          id: generateArticleId('art'),
          title: meta.title,
          authors: meta.authors,
          year: meta.year,
          journal: meta.journal,
          doi: meta.doi,
          design: meta.studyDesignDetected,
          abstract: meta.abstract
        }];
        warnings.push('Formatet ble gjenkjent som ustrukturert tekst. Metadata ble ekstrahert med heuristisk parser.');
        break;
    }

    let duplicatesCount = 0;
    const finalArticles: ArticleAppraisal[] = [];

    for (const item of parsedItems) {
      const isDup = (item.doi && existingDois.has(item.doi.toLowerCase().trim())) ||
                    (item.title && existingTitles.has(item.title.toLowerCase().trim()));

      if (isDup) {
        duplicatesCount++;
      }

      const art = this.createDefaultArticle({
        id: item.id || generateArticleId('art'),
        title: item.title || 'Uten tittel',
        authors: item.authors || 'Ukjent forfatter',
        year: item.year || undefined,
        journal: item.journal || 'Tidsskrift / Kilde',
        doi: item.doi || '',
        design: item.design || undefined,
        studyContext: item.abstract || undefined,
        sourceName: `${fileName} (${detectedFormat.toUpperCase()})`,
        verdict: item.verdict,
        items: item.items
      });

      finalArticles.push(art);
    }

    const formatNames: Record<SupportedImportFormat, string> = {
      ris: 'RIS (EndNote, Zotero, Covidence, Rayyan)',
      bibtex: 'BibTeX (.bib)',
      json: 'JSON Data / Prosjekt-sikkerhetskopi',
      csv: 'CSV Tabell (Excel / SPSS)',
      tsv: 'TSV Tabell (Tab-separert)',
      pubmed: 'PubMed / MEDLINE (.nbib / .txt)',
      document: 'Forskningsdokument (PDF/DOCX)',
      unknown: 'Tekst / Automatisk analyse'
    };

    return {
      format: detectedFormat,
      formatName: formatNames[detectedFormat] || 'Ukjent format',
      totalParsed: parsedItems.length,
      newArticles: finalArticles,
      duplicatesCount,
      warnings
    };
  }

  /**
   * RIS Format Parser (TY, TI/T1, AU/A1, PY/Y1, JO/JF/T2, DO, AB/N2, etc.)
   */
  public static parseRis(risText: string): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const entries = risText.split(/(?:^|\n)ER\s{1,2}-\s*/m).filter(e => e.trim().length > 0);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const lines = entry.split(/\r?\n/);

      let title = '';
      const authors: string[] = [];
      let year: number | undefined;
      let journal = '';
      let doi = '';
      let abstract = '';
      let design = 'Kvalitativ studie';
      let currentTag = '';
      let currentVal = '';

      for (const line of lines) {
        const tagMatch = line.match(/^([A-Z0-9]{2})\s{1,2}-\s*(.*)$/);
        if (tagMatch) {
          currentTag = tagMatch[1];
          currentVal = tagMatch[2].trim();

          switch (currentTag) {
            case 'TI':
            case 'T1':
            case 'CT':
            case 'BT':
              title = currentVal;
              break;
            case 'AU':
            case 'A1':
            case 'A2':
            case 'ED':
              if (currentVal) authors.push(currentVal);
              break;
            case 'PY':
            case 'Y1':
            case 'DA':
              const yMatch = currentVal.match(/\b(19\d{2}|20[0-2]\d)\b/);
              if (yMatch) year = parseInt(yMatch[1], 10);
              break;
            case 'JO':
            case 'JF':
            case 'JA':
            case 'T2':
            case 'J2':
              journal = currentVal;
              break;
            case 'DO':
            case 'DI':
              doi = currentVal.replace(/^https?:\/\/doi\.org\//i, '').trim();
              break;
            case 'AB':
            case 'N2':
              abstract = currentVal;
              break;
            case 'KW':
              if (currentVal.toLowerCase().includes('qualitative') || currentVal.toLowerCase().includes('grounded theory') || currentVal.toLowerCase().includes('phenomenol')) {
                design = 'Kvalitativ studie';
              }
              break;
          }
        } else if (currentTag && line.startsWith('  ')) {
          // Continuation line
          const cont = line.trim();
          if (currentTag === 'AB' || currentTag === 'N2') abstract += ' ' + cont;
          else if (currentTag === 'TI' || currentTag === 'T1') title += ' ' + cont;
        }
      }

      if (title || authors.length > 0 || doi) {
        items.push({
          id: generateUniqueId('ris'),
          title: title || `Artikkel #${i + 1}`,
          authors: authors.length > 0 ? authors.join('; ') : 'Ukjent forfatter',
          year,
          journal: journal || 'Tidsskrift / Kilde',
          doi,
          design,
          abstract
        });
      }
    }

    return items;
  }

  /**
   * BibTeX Format Parser (@article{key, title={}, author={}, ...})
   */
  public static parseBibtex(bibText: string): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,]+),([\s\S]*?)(?=\n@[a-zA-Z]+\s*\{|\s*$)/g;
    let match: RegExpExecArray | null;

    let idx = 0;
    while ((match = entryRegex.exec(bibText)) !== null) {
      idx++;
      const body = match[3];

      const getField = (field: string): string => {
        const regex = new RegExp(`${field}\\s*=\\s*[{"]([\\s\\S]*?)[}"]`, 'i');
        const m = body.match(regex);
        if (m) return m[1].replace(/\s+/g, ' ').trim();
        const numRegex = new RegExp(`${field}\\s*=\\s*(\\d+)`, 'i');
        const numM = body.match(numRegex);
        if (numM) return numM[1].trim();
        return '';
      };

      const title = getField('title') || getField('booktitle');
      const author = getField('author') || getField('editor');
      const yearStr = getField('year');
      const year = yearStr ? parseInt(yearStr, 10) : undefined;
      const journal = getField('journal') || getField('publisher') || getField('school');
      const doi = getField('doi').replace(/^https?:\/\/doi\.org\//i, '').trim();
      const abstract = getField('abstract') || getField('note');

      if (title || author || doi) {
        items.push({
          id: generateUniqueId('bib'),
          title: title || `BibTeX oppføring #${idx}`,
          authors: author ? author.replace(/\s+and\s+/g, '; ') : 'Ukjent forfatter',
          year: Number.isNaN(year) ? undefined : year,
          journal: journal || 'Vitenskapelig publikasjon',
          doi,
          design: 'Kvalitativ studie',
          abstract
        });
      }
    }

    return items;
  }

  /**
   * JSON Format Parser (Full project backup or array of articles)
   */
  public static parseJson(jsonText: string): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const parsed = JSON.parse(jsonText);

    const list: any[] = Array.isArray(parsed) 
      ? parsed 
      : (parsed.articles || parsed.data || (parsed.title ? [parsed] : []));

    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      items.push({
        id: a.id || generateUniqueId('json'),
        title: a.title || 'Uten tittel',
        authors: a.authors || 'Forfattere',
        year: a.year || undefined,
        journal: a.journal || 'Tidsskrift',
        doi: a.doi || '',
        design: a.design || undefined,
        abstract: a.studyContext || a.abstract || '',
        items: Array.isArray(a.items) ? a.items : undefined,
        verdict: a.overallVerdict
      });
    }

    return items;
  }

  /**
   * Delimited format parser (CSV / TSV)
   */
  public static parseDelimited(text: string, delimiter: string = ','): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return items;

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === '“' || char === '”') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Find index positions
    const findCol = (...names: string[]): number => {
      for (const name of names) {
        const idx = headers.findIndex(h => h.includes(name));
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const titleIdx = findCol('title', 'tittel', 'navn');
    const authorIdx = findCol('author', 'forfatter');
    const yearIdx = findCol('year', 'år', 'dato', 'date');
    const journalIdx = findCol('journal', 'tidsskrift', 'kilde', 'source');
    const doiIdx = findCol('doi', 'url', 'link');
    const designIdx = findCol('design', 'metod', 'type');
    const verdictIdx = findCol('verdict', 'konklusjon', 'beslutning', 'status');
    const abstractIdx = findCol('abstract', 'sammendrag', 'context', 'kontekst');

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;

      const title = titleIdx >= 0 ? cols[titleIdx] : cols[0];
      const authors = authorIdx >= 0 ? cols[authorIdx] : (cols[1] || 'Forfattere');
      const yearStr = yearIdx >= 0 ? cols[yearIdx] : '';
      const yearMatch = yearStr.match(/\b(19\d{2}|20[0-2]\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;
      const journal = journalIdx >= 0 ? cols[journalIdx] : 'Tidsskrift';
      const doi = doiIdx >= 0 ? cols[doiIdx].replace(/^https?:\/\/doi\.org\//i, '').trim() : '';
      const design = designIdx >= 0 ? cols[designIdx] : 'Kvalitativ studie';
      const abstract = abstractIdx >= 0 ? cols[abstractIdx] : '';
      const rawVerdict = verdictIdx >= 0 ? cols[verdictIdx].trim() : '';
      const verdict: ImportPreviewItem['verdict'] = ['Inkluder', 'Ekskluder', 'Vurder videre', 'Søk mer informasjon'].includes(rawVerdict) ? rawVerdict as ImportPreviewItem['verdict'] : undefined;

      if (title || authors) {
        items.push({
          id: generateUniqueId('csv'),
          title: title || `Oppføring #${i}`,
          authors: authors || '',
          year,
          journal,
          doi,
          design: design || undefined,
          abstract,
          verdict: verdict && ['Inkluder', 'Ekskluder', 'Vurder videre', 'Søk mer informasjon'].includes(verdict) ? verdict : undefined
        });
      }
    }

    return items;
  }

  /**
   * PubMed / MEDLINE format parser
   */
  public static parsePubmed(text: string): ImportPreviewItem[] {
    const items: ImportPreviewItem[] = [];
    const entries = text.split(/(?:^|\n)PMID-?\s+/m).filter(e => e.trim().length > 0);

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const lines = entry.split(/\r?\n/);

      let title = '';
      const authors: string[] = [];
      let year = new Date().getFullYear();
      let journal = '';
      let doi = '';
      let abstract = '';

      for (const line of lines) {
        const m = line.match(/^([A-Z]{2,4})\s*-\s*(.*)$/);
        if (m) {
          const tag = m[1];
          const val = m[2].trim();

          if (tag === 'TI') title = val;
          else if (tag === 'AU' || tag === 'FAU') authors.push(val);
          else if (tag === 'DP') {
            const y = val.match(/\b(19\d{2}|20[0-2]\d)\b/);
            if (y) year = parseInt(y[1], 10);
          }
          else if (tag === 'JT' || tag === 'TA') journal = val;
          else if (tag === 'AID' && val.includes('[doi]')) doi = val.replace(/\s*\[doi\]/i, '');
          else if (tag === 'AB') abstract = val;
        }
      }

      if (title || doi || authors.length > 0) {
        items.push({
          id: generateUniqueId('pmid'),
          title: title || `PubMed artikkel #${i + 1}`,
          authors: authors.length > 0 ? authors.join('; ') : 'Forfattere',
          year,
          journal: journal || 'PubMed Medline Journal',
          doi,
          design: 'Kvalitativ studie',
          abstract
        });
      }
    }

    return items;
  }

  // ==========================================
  // 2. EXPORT GENERATORS IN ALL FORMATS
  // ==========================================

  public static exportData(
    articles: ArticleAppraisal[],
    format: SupportedExportFormat,
    options: ExportOptions
  ): { content: string; filename: string; mimeType: string } {
    if (!Array.isArray(articles)) throw new Error('EXPORT_INVALID: articles must be an array.');
    if (options.scope === 'selected_only' && !options.selectedArticleId) {
      throw new Error('EXPORT_INVALID: selectedArticleId is required for selected_only export.');
    }
    let filteredArticles = articles;
    if (options.scope === 'included_only') {
      filteredArticles = articles.filter(a => a.overallVerdict === 'Inkluder' || a.overallVerdict === 'Vurder videre');
    } else if (options.scope === 'selected_only' && options.selectedArticleId) {
      filteredArticles = articles.filter(a => a.id === options.selectedArticleId);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = `evidence-appraisal-${options.scope}-${timestamp}`;

    switch (format) {
      case 'json':
        return {
          content: this.generateJson(filteredArticles, options),
          filename: `${baseName}.json`,
          mimeType: 'application/json'
        };

      case 'csv':
        return {
          content: this.generateCsv(filteredArticles, options, ','),
          filename: `${baseName}.csv`,
          mimeType: 'text/csv;charset=utf-8;'
        };

      case 'tsv':
        return {
          content: this.generateCsv(filteredArticles, options, '\t'),
          filename: `${baseName}.tsv`,
          mimeType: 'text/tab-separated-values;charset=utf-8;'
        };

      case 'excel':
        // UTF-8 BOM CSV that opens seamlessly in Microsoft Excel
        return {
          content: '\uFEFF' + this.generateCsv(filteredArticles, options, ';'),
          filename: `${baseName}-excel.csv`,
          mimeType: 'text/csv;charset=utf-8;'
        };

      case 'word':
        return {
          content: this.generateWordHtml(filteredArticles, options),
          filename: `${baseName}-report.doc`,
          mimeType: 'application/msword'
        };

      case 'ris':
        return {
          content: this.generateRis(filteredArticles, options),
          filename: `${baseName}.ris`,
          mimeType: 'application/x-research-info-systems'
        };

      case 'bibtex':
        return {
          content: this.generateBibtex(filteredArticles, options),
          filename: `${baseName}.bib`,
          mimeType: 'text/x-bibtex'
        };

      case 'markdown':
        return {
          content: this.generateMarkdown(filteredArticles, options),
          filename: `${baseName}.md`,
          mimeType: 'text/markdown'
        };

      case 'latex':
        return {
          content: this.generateLatex(filteredArticles, options),
          filename: `${baseName}-tables.tex`,
          mimeType: 'application/x-tex'
        };

      case 'pdf':
      case 'txt':
      default:
        return {
          content: this.generatePlainText(filteredArticles, options),
          filename: `${baseName}.txt`,
          mimeType: 'text/plain;charset=utf-8'
        };
    }
  }

  // --- JSON EXPORT ---
  public static generateJson(articles: ArticleAppraisal[], options: ExportOptions): string {
    const payload = {
      metadata: {
        tool: 'Evidence Appraisal Tool - JBI & WHO Standard Engine',
        exportedAt: new Date().toISOString(),
        totalArticles: articles.length,
        exportOptions: options,
        standard: 'Joanna Briggs Institute (JBI) Critical Appraisal 2017/2024 & WHO Guideline Standard'
      },
      articles: articles.map(art => {
        const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
        return {
          ...art,
          computedMetrics: score
        };
      })
    };
    return JSON.stringify(payload, null, 2);
  }

  // --- CSV / TSV EXPORT ---
  public static generateCsv(articles: ArticleAppraisal[], options: ExportOptions, delimiter: string = ','): string {
    const headers = [
      'ID',
      'Forfattere',
      'Kort_sitering',
      'År',
      'Tittel',
      'Tidsskrift',
      'DOI',
      'Studie_Design',
      'Kontekst_Populasjon',
      'Datainnsamling',
      'Analysemetode',
      'Samlet_Beslutning',
      'Score_Ja',
      'Score_Uklart',
      'Score_Nei',
      'Score_Prosent',
      'Metodisk_Styrke',
      'Metodisk_Begrensning',
      'Vurderingsnotat',
      'APA_Referanse'
    ];

    // Add Q1 to Q10 headers
    for (let q = 1; q <= 10; q++) {
      headers.push(`JBI_Q${q}_Svar`);
      if (options.includeJustifications) {
        headers.push(`JBI_Q${q}_Begrunnelse`);
      }
      if (options.includeEvidenceQuotes) {
        headers.push(`JBI_Q${q}_EvidensSitat`);
      }
    }

    const escapeVal = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows: string[] = [];
    rows.push(headers.map(escapeVal).join(delimiter));

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      const rowVals: any[] = [
        art.id,
        art.authors,
        art.shortCitation,
        art.year,
        art.title,
        art.journal,
        art.doi,
        art.design,
        art.studyContext,
        art.dataCollection,
        art.analyticMethod,
        art.overallVerdict,
        score.ja,
        score.uklart,
        score.nei,
        `${score.jaScorePercent}%`,
        art.keyStrength,
        art.mainLimitation,
        art.verdictNote,
        art.apaReference
      ];

      for (let q = 1; q <= 10; q++) {
        const item = art.items?.find(it => it.questionId === q);
        rowVals.push(item?.status || 'Uklart');
        if (options.includeJustifications) {
          rowVals.push(item?.justification || '');
        }
        if (options.includeEvidenceQuotes) {
          rowVals.push(item?.evidenceText || '');
        }
      }

      rows.push(rowVals.map(escapeVal).join(delimiter));
    }

    return rows.join('\r\n');
  }

  // --- WORD (.doc / .docx compatible HTML) ---
  public static generateWordHtml(articles: ArticleAppraisal[], options: ExportOptions): string {
    let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Evidence Appraisal Report</title>
<style>
  body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; }
  h1 { font-family: 'Cambria', 'Georgia', serif; font-size: 20pt; color: #0f766e; border-bottom: 2pt solid #0f766e; padding-bottom: 6pt; }
  h2 { font-family: 'Cambria', 'Georgia', serif; font-size: 15pt; color: #115e59; margin-top: 18pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 4pt; }
  h3 { font-family: 'Cambria', 'Georgia', serif; font-size: 12pt; color: #334155; margin-top: 12pt; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 9.5pt; }
  th, td { border: 1pt solid #94a3b8; padding: 6pt 8pt; text-align: left; vertical-align: top; }
  th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
  .badge-yes { color: #065f46; font-weight: bold; }
  .badge-unclear { color: #854d0e; font-weight: bold; }
  .badge-no { color: #991b1b; font-weight: bold; }
  .box { background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 10pt; margin: 10pt 0; border-radius: 4pt; }
  .quote { font-style: italic; background-color: #f1f5f9; padding: 6pt 10pt; border-left: 3pt solid #0f766e; margin: 6pt 0; }
  .footer { font-size: 8.5pt; color: #64748b; margin-top: 24pt; border-top: 1pt solid #cbd5e1; padding-top: 6pt; }
</style>
</head>
<body>
<h1>Kritisk Metodisk Vurdering & Evidenssyntese</h1>
<p><strong>Standard:</strong> Joanna Briggs Institute (JBI) Critical Appraisal Checklist for Qualitative Research (2017/2024)<br>
<strong>Dato generert:</strong> ${new Date().toLocaleDateString('no-NO')} | <strong>Antall artikler:</strong> ${articles.length}</p>

<h2>1. Samlet Vurderingsmatrise (JBI 10-Item Matrix)</h2>
<table>
  <thead>
    <tr>
      <th>Artikkel (Sitering)</th>
      <th>Design & Populasjon</th>
      <th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Q5</th><th>Q6</th><th>Q7</th><th>Q8</th><th>Q9</th><th>Q10</th>
      <th>Score (Ja)</th>
      <th>Beslutning</th>
    </tr>
  </thead>
  <tbody>`;

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      html += `
    <tr>
      <td><strong>${art.shortCitation}</strong><br><small>${art.journal} (${art.year})</small></td>
      <td>${art.design}<br><small>${art.participants}</small></td>`;
      
      for (let q = 1; q <= 10; q++) {
        const item = art.items?.find(it => it.questionId === q);
        const st = item?.status || 'Uklart';
        let cls = 'badge-unclear';
        if (st === 'Ja') cls = 'badge-yes';
        else if (st === 'Nei') cls = 'badge-no';
        html += `<td class="${cls}" align="center">${st}</td>`;
      }

      html += `
      <td align="center"><strong>${score.ja}/10</strong><br><small>${score.jaScorePercent}%</small></td>
      <td align="center"><strong>${art.overallVerdict}</strong></td>
    </tr>`;
    }

    html += `
  </tbody>
</table>

<h2>2. Detaljert Artikkelgjennomgang</h2>`;

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      html += `
<div class="box">
  <h3>${art.shortCitation} – ${art.title}</h3>
  <p><strong>Forfattere:</strong> ${art.authors} | <strong>Tidsskrift:</strong> ${art.journal} (${art.year}) | <strong>DOI:</strong> ${art.doi || 'N/A'}</p>
  <p><strong>Metodisk design:</strong> ${art.design} | <strong>Datainnsamling:</strong> ${art.dataCollection} | <strong>Analyse:</strong> ${art.analyticMethod}</p>
  <p><strong>Samlet vurdering:</strong> ${art.overallVerdict} (JBI Score: ${score.ja}/10 «Ja» - ${score.jaScorePercent}%)</p>
  <p><strong>Metodisk styrke:</strong> ${art.keyStrength}<br><strong>Begrensning:</strong> ${art.mainLimitation}</p>
  <p><strong>Vurderingsnotat:</strong> ${art.verdictNote}</p>

  <h4>Kriterievurdering (JBI 1-10):</h4>
  <table>
    <thead>
      <tr><th>Kriterium</th><th>Vurdering</th><th>Begrunnelse & Rationale</th><th>Evidenspassasje</th></tr>
    </thead>
    <tbody>`;

      for (const q of JBI_QUESTIONS) {
        const it = art.items?.find(i => i.questionId === q.id);
        const st = it?.status || 'Uklart';
        html += `
      <tr>
        <td><strong>Q${q.id}. ${q.shortTitle}</strong><br><small>${q.officialQuestion}</small></td>
        <td><strong>${st}</strong></td>
        <td>${it?.justification || 'Ingen spesifikk begrunnelse oppgitt.'}</td>
        <td>${it?.evidenceText ? `<div class="quote">«${it.evidenceText}»</div>` : '<small>Ingen sitat</small>'}</td>
      </tr>`;
      }

      html += `
    </tbody>
  </table>
  <p><strong>APA 7th Referanse:</strong><br><em>${art.apaReference}</em></p>
</div>`;
    }

    html += `
<h2>3. Referanser (APA 7th Edition)</h2>
<p>Joanna Briggs Institute. (2017). <em>JBI critical appraisal checklist for qualitative research</em>. Joanna Briggs Institute Adelaide. https://jbi.global/critical-appraisal-tools</p>`;

    for (const art of articles) {
      html += `<p>${art.apaReference}</p>`;
    }

    html += `
<div class="footer">
  Evidence Appraisal Tool • WHO Guideline Development Standard • Generert automatisk i samsvar med JBI Methodology Framework
</div>
</body>
</html>`;

    return html;
  }

  // --- RIS EXPORT ---
  public static generateRis(articles: ArticleAppraisal[], options: ExportOptions): string {
    let ris = '';

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      ris += `TY  - JOUR\r\n`;
      ris += `TI  - ${art.title}\r\n`;

      const authorsList = art.authors.split(/;|, and | and /).map(a => a.trim()).filter(Boolean);
      for (const auth of authorsList) {
        ris += `AU  - ${auth}\r\n`;
      }

      ris += `PY  - ${art.year}\r\n`;
      ris += `JO  - ${art.journal}\r\n`;
      if (art.doi) ris += `DO  - ${art.doi}\r\n`;
      if (art.doiUrl) ris += `UR  - ${art.doiUrl}\r\n`;
      if (art.studyContext) ris += `AB  - ${art.studyContext}\r\n`;

      // Custom appraisal tags and notes
      ris += `KW  - JBI Appraisal: ${score.ja}/10 Yes\r\n`;
      ris += `KW  - Verdict: ${art.overallVerdict}\r\n`;
      ris += `KW  - Design: ${art.design}\r\n`;
      ris += `N1  - JBI Qualitative Appraisal Score: ${score.ja}/10 Yes (${score.jaScorePercent}%). Samlet beslutning: ${art.overallVerdict}. Metodisk styrke: ${art.keyStrength}. Begrensning: ${art.mainLimitation}. Vurderingsnotat: ${art.verdictNote}\r\n`;
      ris += `ER  - \r\n\r\n`;
    }

    return ris;
  }

  // --- BIBTEX EXPORT ---
  public static generateBibtex(articles: ArticleAppraisal[], options: ExportOptions): string {
    let bib = `@misc{jbi2017qualitative,
  title={JBI Critical Appraisal Checklist for Qualitative Research},
  author={{Joanna Briggs Institute}},
  year={2017},
  publisher={Joanna Briggs Institute Adelaide},
  url={https://jbi.global/critical-appraisal-tools}
}\n\n`;

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      const citeKey = `${(art.authors.split(',')[0] || 'study').replace(/[^a-zA-Z0-9]/g, '')}_${art.year}`;
      
      bib += `@article{${citeKey},
  title = {${art.title}},
  author = {${art.authors.replace(/;/g, ' and ')}},
  journal = {${art.journal}},
  year = {${art.year}},
  doi = {${art.doi || ''}},
  note = {JBI Qualitative Score: ${score.ja}/10 (${score.jaScorePercent}%), Verdict: ${art.overallVerdict}},
  annote = {${art.verdictNote || ''}}
}\n\n`;
    }

    return bib;
  }

  // --- MARKDOWN EXPORT ---
  public static generateMarkdown(articles: ArticleAppraisal[], options: ExportOptions): string {
    let md = `# Kritisk Metodisk Vurdering & Evidenssyntese\n\n`;
    md += `*Standard: Joanna Briggs Institute (JBI) Qualitative 2017/2024 & WHO Guideline Standard*\n`;
    md += `*Dato: ${new Date().toISOString().split('T')[0]} | Antall artikler: ${articles.length}*\n\n`;

    md += `## 1. Samlet Vurderingsmatrise\n\n`;
    md += `| Artikkel | Design | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Score | Beslutning |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      const qStatuses = [];
      for (let q = 1; q <= 10; q++) {
        const item = art.items?.find(it => it.questionId === q);
        qStatuses.push(item?.status === 'Ja' ? '✅ Ja' : item?.status === 'Nei' ? '❌ Nei' : '⚠️ Uk');
      }
      md += `| **${art.shortCitation}** | ${art.design} | ${qStatuses.join(' | ')} | **${score.ja}/10** | **${art.overallVerdict}** |\n`;
    }

    md += `\n## 2. Detaljert Evidens og Begrunnelser\n\n`;
    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      md += `### ${art.shortCitation}: ${art.title}\n\n`;
      md += `- **Forfattere:** ${art.authors}\n`;
      md += `- **Publisert i:** ${art.journal} (${art.year}) | **DOI:** ${art.doi || 'N/A'}\n`;
      md += `- **Studiedesign:** ${art.design} | **Datainnsamling:** ${art.dataCollection} | **Analyse:** ${art.analyticMethod}\n`;
      md += `- **JBI-score:** ${score.ja}/10 Ja (${score.jaScorePercent}%) | **Samlet Beslutning:** ${art.overallVerdict}\n`;
      md += `- **Styrke:** ${art.keyStrength}\n`;
      md += `- **Begrensning:** ${art.mainLimitation}\n`;
      md += `- **Notat:** ${art.verdictNote}\n\n`;

      if (options.includeJustifications) {
        md += `#### Kriterier (JBI 1-10):\n`;
        for (const q of JBI_QUESTIONS) {
          const item = art.items?.find(it => it.questionId === q.id);
          md += `- **Q${q.id} [${item?.status || 'Uklart'}]:** ${q.shortTitle}\n`;
          if (item?.justification) md += `  - *Begrunnelse:* ${item.justification}\n`;
          if (item?.evidenceText && options.includeEvidenceQuotes) md += `  - *Evidens:* > «${item.evidenceText}»\n`;
        }
        md += `\n`;
      }
    }

    md += `## 3. Referanseliste (APA 7th)\n\n`;
    md += `Joanna Briggs Institute. (2017). *JBI critical appraisal checklist for qualitative research*. Joanna Briggs Institute Adelaide. https://jbi.global/critical-appraisal-tools\n\n`;
    for (const art of articles) {
      md += `${art.apaReference}\n\n`;
    }

    return md;
  }

  // --- LATEX EXPORT ---
  public static generateLatex(articles: ArticleAppraisal[], options: ExportOptions): string {
    let tex = `% Evidence Appraisal Summary Table (LaTeX)
% Generated by Evidence Appraisal Tool
\\begin{table*}[htbp]
\\centering
\\caption{Kritisk vurdering av inkluderte kvalitative studier (JBI Qualitative Checklist, 2017)}
\\label{tab:jbi_appraisal_matrix}
\\small
\\begin{tabular}{lp{3.5cm}cccccccccccl}
\\hline
\\textbf{Studie} & \\textbf{Metode \& Populasjon} & \\textbf{Q1} & \\textbf{Q2} & \\textbf{Q3} & \\textbf{Q4} & \\textbf{Q5} & \\textbf{Q6} & \\textbf{Q7} & \\textbf{Q8} & \\textbf{Q9} & \\textbf{Q10} & \\textbf{Score} & \\textbf{Beslutning} \\\\
\\hline
`;

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      const safeCitation = art.shortCitation.replace(/&/g, '\\&').replace(/_/g, '\\_');
      const safeDesign = `${art.design}, ${art.participants}`.replace(/&/g, '\\&').replace(/_/g, '\\_');

      const qSyms = [];
      for (let q = 1; q <= 10; q++) {
        const item = art.items?.find(it => it.questionId === q);
        const st = item?.status || 'Uklart';
        if (st === 'Ja') qSyms.push('Y');
        else if (st === 'Nei') qSyms.push('N');
        else qSyms.push('U');
      }

      tex += `${safeCitation} & \\footnotesize{${safeDesign.slice(0, 45)}...} & ${qSyms.join(' & ')} & ${score.ja}/10 & ${art.overallVerdict} \\\\\n`;
    }

    tex += `\\hline
\\end{tabular}
\\begin{tablenotes}
\\footnotesize
\\item \\textit{Forkortelser:} Y = Ja, U = Uklart, N = Nei. JBI Q1: Filosofisk samsvar, Q2: Metodisk samsvar, Q3: Datainnsamling, Q4: Analyse, Q5: Tolkning, Q6: Forskerposisjon/Refleksivitet, Q7: Informantrepresentasjon, Q8: Etikk, Q9: Konklusjon.
\\end{tablenotes}
\\end{table*}
`;

    return tex;
  }

  // --- PLAIN TEXT EXPORT ---
  public static generatePlainText(articles: ArticleAppraisal[], options: ExportOptions): string {
    let txt = `================================================================================\n`;
    txt += `EVIDENCE APPRAISAL RAPPORT & SERTIFIKAT\n`;
    txt += `Joanna Briggs Institute (JBI) Qualitative Standard (2017/2024)\n`;
    txt += `Generert: ${new Date().toISOString()} | Antall artikler: ${articles.length}\n`;
    txt += `================================================================================\n\n`;

    for (const art of articles) {
      const score = JbiQualitativeValidationService.computeScore(art.items || [], 10);
      txt += `--------------------------------------------------------------------------------\n`;
      txt += `STUDIE: ${art.shortCitation}\n`;
      txt += `Tittel: ${art.title}\n`;
      txt += `Forfattere: ${art.authors}\n`;
      txt += `Tidsskrift: ${art.journal} (${art.year})\n`;
      txt += `DOI: ${art.doi || 'N/A'}\n`;
      txt += `Studiedesign: ${art.design}\n`;
      txt += `Samlet vurdering: ${art.overallVerdict} (JBI Score: ${score.ja}/10 «Ja» - ${score.jaScorePercent}%)\n`;
      txt += `Styrke: ${art.keyStrength}\n`;
      txt += `Begrensning: ${art.mainLimitation}\n`;
      txt += `Vurderingsnotat: ${art.verdictNote}\n\n`;

      txt += `JBI Kriterier (1-10):\n`;
      for (const q of JBI_QUESTIONS) {
        const item = art.items?.find(it => it.questionId === q.id);
        txt += `  Q${q.id} [${item?.status || 'Uklart'}]: ${q.shortTitle}\n`;
        if (item?.justification) txt += `     Begrunnelse: ${item.justification}\n`;
        if (item?.evidenceText) txt += `     Evidens: "${item.evidenceText}"\n`;
      }
      txt += `\nAPA Referanse:\n${art.apaReference}\n\n`;
    }

    return txt;
  }

  /**
   * Helper: instantiate a complete default article schema
   */
  public static createDefaultArticle(params: {
    id?: string;
    title: string;
    authors: string;
    year: number;
    journal: string;
    doi: string;
    design?: string;
    studyContext?: string;
    sourceName?: string;
    verdict?: 'Inkluder' | 'Ekskluder' | 'Vurder videre' | 'Søk mer informasjon';
    items?: JBIEvaluationItem[];
  }): ArticleAppraisal {
    const id = params.id && params.id.trim().length > 0 ? params.id : generateArticleId('art');
    const shortAuth = params.authors.split(';')[0]?.split(',')[0]?.trim() || 'Forfatter';
    const shortCitation = `${shortAuth} (${params.year || new Date().getFullYear()})`;

    const defaultItems: JBIEvaluationItem[] = JBI_QUESTIONS.map(q => {
      const existing = params.items?.find(i => i.questionId === q.id);
      return existing || {
        questionId: q.id,
        status: 'Uklart',
        justification: '',
        evidenceText: '',
        reviewerNotes: 'Importert for vurdering'
      };
    });

    return {
      id,
      instrumentId: 'jbi-qualitative-2017',
      instrumentVersion: '2017',
      lifecycleStatus: 'DRAFT',
      methodologyAlignmentStatus: 'PENDING_VERIFICATION',
      parsingStatus: 'PARSED_COMPLETE',
      authors: params.authors,
      shortCitation,
      year: params.year || new Date().getFullYear(),
      title: params.title,
      journal: params.journal,
      doi: params.doi,
      doiUrl: params.doi ? `https://doi.org/${params.doi}` : '#',
      sourceUrl: '#',
      sourceName: params.sourceName || 'Importert referanse',
      studyContext: params.studyContext || 'Kvalitativ studie for vurdering',
      design: params.design || 'Kvalitativ studie',
      dataCollection: 'Intervjuer / observasjon',
      participants: 'Studiepopulasjon',
      analyticMethod: 'Tematisk syntese / analyse',
      reviewerName: 'Primærvurderer',
      reviewerRole: 'Forsker / Vurderer',
      assessmentDate: new Date().toISOString().split('T')[0],
      projectName: 'Kunnskapsgrunnlag',
      summaryScore: {
        ja: 0,
        uklart: 10,
        nei: 0,
        ikkeRelevant: 0,
        total: 10
      },
      overallVerdict: params.verdict || 'Vurder videre',
      verdictNote: 'Importert for systematisk evidensvurdering',
      keyStrength: 'Dokumentert studie',
      mainLimitation: 'Krever metodisk gjennomgang',
      apaReference: `${params.authors} (${params.year || new Date().getFullYear()}). ${params.title}. ${params.journal}.`,
      items: defaultItems,
      auditTrail: [
        {
          id: generateAuditId('audit'),
          studyId: id,
          reviewer: 'System Import',
          instrumentId: params.instrumentId || 'UNKNOWN',
          version: params.instrumentVersion || 'UNKNOWN',
          itemId: 1,
          itemTitle: 'Initialisering',
          previousAnswer: 'NONE',
          newAnswer: 'UNCLEAR',
          previousRationale: '',
          newRationale: 'Importert til systemet',
          changedBy: 'System',
          timestamp: new Date().toISOString(),
          comment: 'Importert fra ekstern fil'
        }
      ]
    };
  }

  // ==========================================
  // ZIP BUNDLE EXPORT GENERATOR
  // ==========================================
  public static async generateZipBundle(
    articles: ArticleAppraisal[],
    options: ExportOptions
  ): Promise<{ blob: Blob; filename: string }> {
    let filteredArticles = articles;
    if (options.scope === 'included_only') {
      filteredArticles = articles.filter(a => a.overallVerdict === 'Inkluder' || a.overallVerdict === 'Vurder videre');
    } else if (options.scope === 'selected_only' && options.selectedArticleId) {
      filteredArticles = articles.filter(a => a.id === options.selectedArticleId);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = `evidence-appraisal-bundle-${options.scope}-${timestamp}`;
    const zip = new JSZip();

    // 1. JSON Protocol
    zip.file(`${baseName}/protocol-data.json`, this.generateJson(filteredArticles, options));

    // 2. CSV Matrix
    zip.file(`${baseName}/appraisal-matrix.csv`, this.generateCsv(filteredArticles, options, ','));

    // 3. Word Document Report (.doc)
    zip.file(`${baseName}/appraisal-report.doc`, this.generateWordHtml(filteredArticles, options));

    // 4. BibTeX Bibliography (.bib)
    zip.file(`${baseName}/references.bib`, this.generateBibtex(filteredArticles, options));

    // 5. RIS Library (.ris)
    zip.file(`${baseName}/references.ris`, this.generateRis(filteredArticles, options));

    // 6. Markdown Synthesis (.md)
    zip.file(`${baseName}/synthesis.md`, this.generateMarkdown(filteredArticles, options));

    // 7. Audit Trail log (.json)
    const auditEntries = filteredArticles.flatMap(a => a.auditTrail || []);
    zip.file(`${baseName}/audit-trail-log.json`, JSON.stringify(auditEntries, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    return {
      blob,
      filename: `${baseName}.zip`
    };
  }
}
