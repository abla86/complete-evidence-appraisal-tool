import crypto from 'crypto';

export interface DocumentPage {
  pageNumber: number;
  text: string;
  wordCount: number;
}

export interface ParsedDocument {
  documentId: string;
  documentHash: string;
  title: string;
  fileName: string;
  fileSize: number;
  totalPages: number;
  pages: DocumentPage[];
  fullText: string;
  createdAt: string;
  isValid: boolean;
  validationError?: string;
}

export class DocumentService {
  /**
   * Parses raw file text or uploaded PDF buffer into a structured, traceable Document model with pages and hashes.
   */
  public static parseDocument(fileName: string, rawText: string, titleHint?: string): ParsedDocument {
    if (!rawText || rawText.trim().length < 50) {
      return {
        documentId: `doc-${Date.now()}`,
        documentHash: 'invalid-hash',
        title: titleHint || fileName,
        fileName,
        fileSize: rawText ? rawText.length : 0,
        totalPages: 0,
        pages: [],
        fullText: rawText || '',
        createdAt: new Date().toISOString(),
        isValid: false,
        validationError: 'Dokumentet inneholder utilstrekkelig med tekst for kritisk vurdering (< 50 tegn).'
      };
    }

    // Compute stable SHA-256 hash for document integrity
    const cleanText = rawText.trim();
    const documentHash = crypto.createHash('sha256').update(cleanText).digest('hex');
    const documentId = `doc-${documentHash.substring(0, 12)}`;

    // Split text into logical pages (~3000 chars per page if single block)
    const pageLength = 3000;
    const rawParagraphs = cleanText.split(/\n\s*\n/);
    
    let pages: DocumentPage[] = [];
    let currentPageText = '';
    let pageNum = 1;

    for (const para of rawParagraphs) {
      if ((currentPageText + '\n\n' + para).length > pageLength && currentPageText.length > 0) {
        pages.push({
          pageNumber: pageNum,
          text: currentPageText.trim(),
          wordCount: currentPageText.split(/\s+/).length
        });
        pageNum++;
        currentPageText = para;
      } else {
        currentPageText = currentPageText ? currentPageText + '\n\n' + para : para;
      }
    }

    if (currentPageText.trim().length > 0) {
      pages.push({
        pageNumber: pageNum,
        text: currentPageText.trim(),
        wordCount: currentPageText.split(/\s+/).length
      });
    }

    if (pages.length === 0) {
      pages.push({
        pageNumber: 1,
        text: cleanText,
        wordCount: cleanText.split(/\s+/).length
      });
    }

    return {
      documentId,
      documentHash,
      title: titleHint || fileName.replace(/\.[^/.]+$/, ''),
      fileName,
      fileSize: cleanText.length,
      totalPages: pages.length,
      pages,
      fullText: cleanText,
      createdAt: new Date().toISOString(),
      isValid: true
    };
  }

  /**
   * Locates exact page and snippet matching for an evidence quote.
   */
  public static locateEvidence(doc: ParsedDocument, quote: string): { found: boolean; pageNumber?: number; snippetContext?: string } {
    if (!quote || quote.trim().length === 0) {
      return { found: false };
    }

    const cleanQuote = quote.trim().toLowerCase();
    
    for (const page of doc.pages) {
      const lowerPageText = page.text.toLowerCase();
      const idx = lowerPageText.indexOf(cleanQuote);
      if (idx !== -1) {
        // Extract surrounding context
        const start = Math.max(0, idx - 60);
        const end = Math.min(page.text.length, idx + cleanQuote.length + 60);
        const snippetContext = '...' + page.text.substring(start, end) + '...';
        return {
          found: true,
          pageNumber: page.pageNumber,
          snippetContext
        };
      }
    }

    return { found: false };
  }
}
