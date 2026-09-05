import type { CandidateEvidence, DocumentAnalysisResult, IMRaDAnalysisResult } from '../types';
import { DocumentAnalysisService } from './documentAnalysisService';
import { MetaResearchService } from './metaResearchService';
import { IMRaDAnalysisService } from './imradAnalysisService';
import mammoth from 'mammoth';

export function normalizeDoi(value: string): string { return String(value || '').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').replace(/[<>\s]+$/g, '').replace(/[.,;:)]+$/g, ''); }

export function parseAuthorList(value: string): string[] { return String(value || '').replace(/["*†‡§0-9¹²³⁴⁵⁶⁷⁸⁹]+/g, '').split(/\s*,\s*|\s+and\s+/i).map(name => name.trim()).filter(Boolean); }

export interface FileParseResult {
  fileName: string;
  fileSizeBytes: number;
  fileType: 'pdf' | 'docx' | 'txt' | 'unknown';
  mimeType: string;
  isScannedOrImageOnly: boolean;
  ocrAppliedOrNeeded: boolean;
  ocrConfidence?: number;
  extractedText: string;
  wordCount: number;
  estimatedPages: number;
  metadata: {
    title: string;
    authors: string;
    year: number;
    journal: string;
    doi: string;
    abstract: string;
    studyDesignDetected: string;
    recommendedInstrumentId: string;
  };
  imradAnalysis: IMRaDAnalysisResult;
  sections: {
    title: string;
    content: string;
    characterCount: number;
  }[];
  validationErrors?: string[];
  candidateEvidence?: CandidateEvidence[];
}

export class DocumentParserService {
  public static readonly MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  public static readonly ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.rtf', '.md'];

  /**
   * Validates file properties before processing
   */
  public static validateFile(file: { name: string; size: number; type?: string }): { valid: boolean; error?: string } {
    if (!file.name) {
      return { valid: false, error: 'Filnavn mangler.' };
    }

    if (file.size <= 0) {
      return { valid: false, error: 'Filen er tom (0 bytes). Vennligst velg et gyldig forskningsdokument.' };
    }

    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { valid: false, error: `Filen er for stor (${sizeMB} MB). Maksimal tillatt filstørrelse er 25 MB.` };
    }

    const lowerName = file.name.toLowerCase();
    const isAllowed = this.ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
    if (!isAllowed) {
      return { 
        valid: false, 
        error: `Filformatet støttes ikke. Vennligst last opp PDF (.pdf), Word (.docx) eller ren tekst (.txt / .md).` 
      };
    }

    return { valid: true };
  }

  /**
   * Parses raw file content (ArrayBuffer or string) into structured scientific text and metadata
   */
  public static async parseFile(
    file: File | { name: string; size: number; content: ArrayBuffer | string }
  ): Promise<FileParseResult> {
    const validation = this.validateFile({
      name: file.name,
      size: file.size,
      type: 'type' in file ? file.type : undefined
    });

    if (!validation.valid) {
      throw new Error(validation.error || 'Ugyldig fil.');
    }

    const lowerName = file.name.toLowerCase();
    let fileType: FileParseResult['fileType'] = 'unknown';
    let extractedText = '';
    let isScannedOrImageOnly = false;
    let ocrAppliedOrNeeded = false;

    if (lowerName.endsWith('.pdf')) {
      fileType = 'pdf';
      const parsedPdf = await this.extractPdfText(file);
      extractedText = parsedPdf.text;
      isScannedOrImageOnly = parsedPdf.isScanned;
      ocrAppliedOrNeeded = parsedPdf.ocrNeeded;
    } else if (lowerName.endsWith('.docx')) {
      fileType = 'docx';
      extractedText = await this.extractDocxText(file);
    } else {
      fileType = 'txt';
      extractedText = await this.extractPlainText(file);
    }

    if (!extractedText.trim() && isScannedOrImageOnly) {
      extractedText = `[SKANNET DOKUMENT IDENTIFISERT - ${file.name}]\n\nDokumentet fremstår som en skannet bilde-PDF eller inneholder ikke et tilgjengelig tekstlag.\nSystemet har registrert filen for videre manuell gjennomgang eller OCR-behandling.\nForfattere og tittel bør kontrolleres manuelt.`;
    }

    const words = extractedText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 500));

    // Extract metadata
    const metadata = this.extractMetadata(extractedText, file.name);

    // Identify sections
    const sections = this.extractSections(extractedText);

    const imradAnalysis = IMRaDAnalysisService.analyze(extractedText, file.name);

    // Run candidate evidence analysis
    let candidateEvidence: CandidateEvidence[] = [];
    if (extractedText.length > 50) {
      try {
        const analysis = DocumentAnalysisService.analyzeText(extractedText, file.name);
        candidateEvidence = analysis.candidateEvidence;
      } catch (e) {
        console.warn('Candidate evidence extraction notice:', e);
      }
    }

    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType,
      mimeType: ('type' in file ? file.type : undefined) || (fileType === 'pdf' ? 'application/pdf' : 'text/plain'),
      isScannedOrImageOnly,
      ocrAppliedOrNeeded,
      // No synthetic OCR confidence: OCR is not performed by this parser.\n      // A scanned PDF is explicitly flagged for an OCR-capable workflow.\n      ocrConfidence: undefined,
      extractedText,
      wordCount,
      estimatedPages,
      metadata,
      sections,
      imradAnalysis,
      candidateEvidence
    };
  }

  /**
   * Plain text extraction (UTF-8)
   */
  private static async extractPlainText(file: File | { name: string; size: number; content: ArrayBuffer | string }): Promise<string> {
    if (typeof file.text === 'function') {
      return await file.text();
    }
    if (typeof file.content === 'string') {
      return file.content;
    }
    if (file.content instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(file.content);
    }
    return '';
  }

  /**
   * PDF text extraction engine
   * Detects embedded text streams, Tj/TJ operators, and flags scanned PDFs
   */
  private static async extractPdfText(file: File | { name: string; size: number; content: ArrayBuffer | string }): Promise<{ text: string; isScanned: boolean; ocrNeeded: boolean }> {
    let buffer: ArrayBuffer;
    if (typeof file.arrayBuffer === 'function') {
      buffer = await file.arrayBuffer();
    } else if (file.content instanceof ArrayBuffer) {
      buffer = file.content;
    } else if (typeof file.content === 'string') {
      return { text: file.content, isScanned: false, ocrNeeded: false };
    } else {
      return { text: '', isScanned: true, ocrNeeded: true };
    }

    try {
      // PDF.js parses compressed streams, font encodings and page structure.
      // The previous implementation inspected raw PDF bytes and therefore could
      // not reliably extract text from normal compressed PDFs.
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        });
      const pdf = await loadingTask.promise;
      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => typeof item.str === 'string' ? item.str : '')
          .join(' ')
          .replace(/\\s{2,}/g, ' ')
          .trim();

        if (pageText) {
          pages.push(pageText);
        }
      }

      const text = pages.join('\\n\\n').trim();
      const isScanned = text.length < 80;
      return {
        text,
        isScanned,
        ocrNeeded: isScanned
      };
    } catch (error) {
      console.warn('PDF.js extraction failed:', error);
      return {
        text: '',
        isScanned: true,
        ocrNeeded: true
      };
    }
  }

  /**
   * Word DOCX text extraction
   * Extracts text from <w:t> tags
   */
  private static async extractDocxText(file: File | { name: string; size: number; content: ArrayBuffer | string }): Promise<string> {
    let buffer: ArrayBuffer;
    if (typeof file.arrayBuffer === 'function') {
      buffer = await file.arrayBuffer();
    } else if (file.content instanceof ArrayBuffer) {
      buffer = file.content;
    } else if (typeof file.content === 'string') {
      return file.content;
    } else {
      return '';
    }

    // DOCX is a ZIP package. Reading the binary as Latin-1 and regexing XML
    // does not work for normal DOCX files because document.xml is compressed.
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value.replace(/\\s{2,}/g, ' ').trim();
  }

  private static cleanPdfEscapes(str: string): string {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Scientific Metadata Extraction from text
   */
  public static extractMetadata(text: string, fileName: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const textLower = text.toLowerCase();

    // 1. DOI
    let doi = '';
    const doiMatch = text.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
    if (doiMatch) {
      doi = normalizeDoi(doiMatch[0]);
    }

    // 2. Title
    let title = '';
    const titleExplicit = text.match(/title\s*[:\-]\s*(.+)/i);
    if (titleExplicit && titleExplicit[1].length > 10) {
      title = titleExplicit[1].split(/\n/)[0].trim();
    } else if (lines.length > 0) {
      // Find first substantive line that looks like a title
      for (const line of lines.slice(0, 8)) {
        if (line.length > 20 && !line.toLowerCase().startsWith('http') && !line.toLowerCase().startsWith('doi:')) {
          title = line;
          break;
        }
      }
    }
    if (!title) {
      title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }

    // 3. Authors — preserve Unicode names and remove BMC footnote markers.
    let authors = '';
    const authorsExplicit = text.match(/authors?\s*[:\-]\s*([^\n]+)/i);
    if (authorsExplicit && authorsExplicit[1].length > 5) {
      authors = parseAuthorList(authorsExplicit[1]).join('; ');
    } else {
      const candidateLines = lines.slice(1, 10).filter(line =>
        line.length > 8 &&
        !/^https?:\/\//i.test(line) &&
        !/^doi\s*:/i.test(line) &&
        !/^(?:BMC Primary Care|BMJ|The Lancet)$/i.test(line)
      );
      const authorLine = candidateLines.find(line =>
        (/,/.test(line) || /\band\b/i.test(line)) &&
        /[A-ZÆØÅ][\p{L}'’-]+/u.test(line) &&
        !/:/.test(line)
      );
      authors = authorLine ? parseAuthorList(authorLine).join('; ') : 'Forfattere ikke entydig identifisert';
    }

    // 4. Year
    let year = new Date().getFullYear();
    const yearMatch = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
    }

    // 5. Journal
    let journal = '';
    const journalsList = [
      'BMC Primary Care', 'BMC Public Health', 'The Lancet', 'BMJ', 'BMJ Open', 
      'Tidsskrift for Den Norske Legeforening', 'Nordic Journal of Nursing Research',
      'Social Science & Medicine', 'Qualitative Health Research', 'Journal of Clinical Epidemiology',
      'Cochrane Database of Systematic Reviews', 'Systematic Reviews', 'Implementation Science'
    ];
    for (const j of journalsList) {
      if (textLower.includes(j.toLowerCase())) {
        journal = j;
        break;
      }
    }
    if (!journal) {
      const journalMatch = text.match(/(?:published in|journal|tidsskrift)\s*[:\-]\s*([A-Za-z\s&]+)/i);
      if (journalMatch) {
        journal = journalMatch[1].trim();
      } else {
        journal = 'Vitenskapelig tidsskrift / kilde';
      }
    }

    // 6. Abstract
    let abstract = '';
    const abstractMatch = text.match(/abstract\s*[:\-]?\s*([\s\S]{80,1200}?)(?=\n\s*(?:introduction|background|methods|bakgrunn|formål)|\n\n\n)/i);
    if (abstractMatch) {
      abstract = abstractMatch[1].trim().replace(/\s{2,}/g, ' ');
    }

    // 7. Study Design & Instrument Recommendation
    let studyDesignDetected = 'Ukjent / kan ikke fastslås sikkert';
    let recommendedInstrumentId = 'UNKNOWN';

    if (textLower.includes('systematic review') || textLower.includes('meta-analysis') || textLower.includes('systematisk oversikt')) {
      studyDesignDetected = 'Systematisk oversikt / Meta-analyse';
      recommendedInstrumentId = 'amstar-2';
    } else if (textLower.includes('randomized controlled trial') || textLower.includes('randomised controlled trial') || textLower.includes('rct')) {
      studyDesignDetected = 'Randomisert kontrollert studie (RCT)';
      recommendedInstrumentId = 'casp-rct';
    } else if (textLower.includes('clinical practice guideline') || textLower.includes('retningslinje') || textLower.includes('guideline')) {
      studyDesignDetected = 'Klinisk retningslinje (Guideline)';
      recommendedInstrumentId = 'agree-ii';
    } else if (textLower.includes('cohort study') || textLower.includes('kohortstudie')) {
      studyDesignDetected = 'Kohortstudie (Observasjonell)';
      recommendedInstrumentId = 'jbi-cohort';
    } else if (textLower.includes('case-control') || textLower.includes('kasuskontroll')) {
      studyDesignDetected = 'Kasus-kontrollstudie';
      recommendedInstrumentId = 'jbi-case-control';
    } else if (textLower.includes('cross-sectional') || textLower.includes('tverrsnittsstudie')) {
      studyDesignDetected = 'Tverrsnittsstudie';
      recommendedInstrumentId = 'jbi-cross-sectional';
    } else if (textLower.includes('diagnostic') || textLower.includes('sensitivitet') || textLower.includes('spesifisitet')) {
      studyDesignDetected = 'Diagnostisk nøyaktighetsstudie';
      recommendedInstrumentId = 'jbi-diagnostic-accuracy';
    } else if (textLower.includes('mixed methods') || textLower.includes('flermetode')) {
      studyDesignDetected = 'Mixed Methods (Kombinert design)';
      recommendedInstrumentId = 'mmat-2018';
    } else if (textLower.includes('grounded theory') || textLower.includes('phenomenolog') || textLower.includes('thematic analysis') || textLower.includes('qualitative')) {
      studyDesignDetected = 'Kvalitativ studie (Grounded Theory / Fenomenologi / Tematisk)';
      recommendedInstrumentId = 'jbi-qualitative-2017';
    }

    return {
      title,
      authors,
      year,
      journal,
      doi,
      abstract,
      studyDesignDetected,
      recommendedInstrumentId
    };
  }

  /**
   * Structure sections from document
   */
  public static extractSections(text: string) {
    const imrad = IMRaDAnalysisService.analyze(text, 'document');
    const labels: Record<string, string> = {
      introduction: 'Introduction / Background',
      methods: 'Methods / Design',
      results: 'Results / Findings',
      discussion: 'Discussion / Limitations',
    };
    const sections = imrad.sections
      .map(section => ({ key: section.key, content: this.extractImradContent(text, section.key) }))
      .filter(section => section.content.trim())
      .map(section => ({ title: labels[section.key], content: section.content, characterCount: section.content.length }));
    return sections.length ? sections : [{
      title: 'Hovedtekst – manuell gjennomgang',
      content: text.trim(),
      characterCount: text.length
    }];
  }

  private static extractImradContent(text: string, key: 'introduction'|'methods'|'results'|'discussion'): string {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const headings: Record<string, RegExp[]> = {
      introduction: [/^\s*(?:1[.)\s-]*)?(?:introduction|background|bakgrunn|innledning)\s*$/i, /^\s*(?:aim|objectives|purpose|formål|hensikt)\s*$/i],
      methods: [/^\s*(?:2[.)\s-]*)?(?:methods?|methodology|materials and methods|metode|metodologi|materiale og metode)\s*$/i, /^\s*(?:study design|research design|studiedesign)\s*$/i],
      results: [/^\s*(?:3[.)\s-]*)?(?:results?|findings?|resultater|funn)\s*$/i],
      discussion: [/^\s*(?:4[.)\s-]*)?(?:discussion|interpretation|drøfting|diskusjon)\s*$/i, /^\s*(?:strengths and limitations|limitations|styrker og begrensninger|begrensninger)\s*$/i]
    };
    let active: string|null=null; const out:string[]=[];
    for(const line of lines){
      const found=Object.entries(headings).find(([,patterns])=>patterns.some(pattern=>pattern.test(line.trim())));
      if(found){active=found[0]; if(active===key) continue;}
      else if(active===key) out.push(line);
      if(active!==key && active!==null && out.length) break;
    }
    return out.join('\n').trim();
  }
}
