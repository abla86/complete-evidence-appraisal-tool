import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { DocumentSourceType } from '../types/index.js';

export interface ExtractedDocumentContent {
  sourceType: DocumentSourceType;
  text: string;
  wordCount: number;
  estimatedPages: number;
  isScannedOrImageOnly: boolean;
  ocrNeeded: boolean;
}

export async function extractText(filePath: string): Promise<ExtractedDocumentContent> {
  const absolutePath = path.resolve(filePath);
  const extension = path.extname(absolutePath).toLowerCase();

  if (!await fileExists(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let sourceType: DocumentSourceType;
  let text = '';
  let estimatedPages = 1;
  let isScannedOrImageOnly = false;
  let ocrNeeded = false;

  if (extension === '.txt' || extension === '.md' || extension === '.rtf') {
    sourceType = extension === '.md' ? 'markdown' : 'txt';
    text = await fs.readFile(absolutePath, 'utf8');
  } else if (extension === '.docx') {
    sourceType = 'docx';
    const buffer = await fs.readFile(absolutePath);
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (extension === '.pdf') {
    sourceType = 'pdf';
    const data = new Uint8Array(await fs.readFile(absolutePath));
    const pdf = await getDocument({ data }).promise;
    estimatedPages = Math.max(1, pdf.numPages);
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: unknown) => {
          if (typeof item === 'object' && item !== null && 'str' in item) {
            return typeof (item as { str?: unknown }).str === 'string'
              ? (item as { str: string }).str
              : '';
          }
          return '';
        })
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (pageText) pages.push(`[Page ${pageNumber}]\n${pageText}`);
    }

    text = pages.join('\n\n').trim();
    isScannedOrImageOnly = text.length < 80;
    ocrNeeded = isScannedOrImageOnly;
  } else {
    throw new Error(`Unsupported document type: ${extension}`);
  }

  const normalized = text.replace(/\u0000/g, '').trim();
  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;

  if (sourceType !== 'pdf') {
    estimatedPages = Math.max(1, Math.ceil(wordCount / 500));
  }

  return {
    sourceType,
    text: normalized,
    wordCount,
    estimatedPages,
    isScannedOrImageOnly,
    ocrNeeded,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
