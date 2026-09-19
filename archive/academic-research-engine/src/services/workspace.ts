import crypto from 'node:crypto';
import type {
  ResearchDocument,
  EvidenceClaim,
  DocumentSourceType,
} from '../types/index.js';

const documents = new Map<string, ResearchDocument>();
const claims = new Map<string, EvidenceClaim>();

export function addDocument(input: {
  fileName: string;
  mimeType?: string;
  sourceType?: DocumentSourceType;
  text: string;
}): ResearchDocument {
  const fileName = String(input.fileName ?? '').trim();
  const text = String(input.text ?? '');

  if (!fileName) throw new Error('fileName is required');
  if (!text.trim()) throw new Error('Document text cannot be empty');

  const words = text.trim().split(/\s+/).filter(Boolean);
  const document: ResearchDocument = {
    id: crypto.randomUUID(),
    fileName,
    mimeType: input.mimeType,
    sourceType: input.sourceType ?? inferSourceType(fileName),
    text,
    createdAt: new Date().toISOString(),
    verification: 'UNVERIFIED',
    wordCount: words.length,
    estimatedPages: Math.max(1, Math.ceil(words.length / 500)),
  };

  documents.set(document.id, document);
  return cloneDocument(document);
}

export function getDocument(id: string): ResearchDocument | undefined {
  const document = documents.get(id);
  return document ? cloneDocument(document) : undefined;
}

export function listDocuments() {
  return [...documents.values()].map(document => ({
    id: document.id,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sourceType: document.sourceType,
    characters: document.text.length,
    wordCount: document.wordCount,
    estimatedPages: document.estimatedPages,
    createdAt: document.createdAt,
    verification: document.verification,
  }));
}

export function searchDocuments(query: string, documentIds?: string[]) {
  const terms = String(query ?? '')
    .toLowerCase()
    .split(/\s+/)
    .map(term => term.trim())
    .filter(Boolean);

  if (!terms.length) return [];

  const allowed = documentIds?.length ? new Set(documentIds) : undefined;
  const results: Array<{
    documentId: string;
    fileName: string;
    location: string;
    quote: string;
    page?: string;
    section?: string;
  }> = [];

  for (const document of documents.values()) {
    if (allowed && !allowed.has(document.id)) continue;

    const lower = document.text.toLowerCase();
    if (!terms.every(term => lower.includes(term))) continue;

    const primaryTerm = terms[0];
    let position = lower.indexOf(primaryTerm);
    let count = 0;

    while (position >= 0 && count < 10) {
      const start = Math.max(0, position - 220);
      const end = Math.min(document.text.length, position + 600);
      const lineNumber = document.text.slice(0, position).split(/\r?\n/).length;
      const estimatedPage = Math.max(1, Math.ceil(lineNumber / 40));

      results.push({
        documentId: document.id,
        fileName: document.fileName,
        location: `character:${position}`,
        quote: document.text.slice(start, end),
        page: String(estimatedPage),
      });

      position = lower.indexOf(primaryTerm, position + Math.max(1, primaryTerm.length));
      count += 1;
    }
  }

  return results.slice(0, 100);
}

export function createClaim(
  input: Omit<EvidenceClaim, 'id' | 'createdAt'>,
): EvidenceClaim {
  const claim = String(input.claim ?? '').trim();
  if (!claim) throw new Error('claim is required');

  const status = input.status;
  if (!['candidate', 'verified', 'rejected'].includes(status)) {
    throw new Error('claim status must be candidate, verified, or rejected');
  }

  const record: EvidenceClaim = {
    ...input,
    claim,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  claims.set(record.id, record);
  return { ...record };
}

export function listClaims(): EvidenceClaim[] {
  return [...claims.values()].map(claim => ({ ...claim }));
}

export function verifyDocument(id: string): ResearchDocument {
  const document = documents.get(id);
  if (!document) throw new Error('Document not found');

  const verified: ResearchDocument = {
    ...document,
    verification: 'HUMAN_VERIFIED',
  };

  documents.set(id, verified);
  return cloneDocument(verified);
}

export function setDocumentVerification(
  id: string,
  status: ResearchDocument['verification'],
): ResearchDocument {
  const document = documents.get(id);
  if (!document) throw new Error('Document not found');

  const updated: ResearchDocument = { ...document, verification: status };
  documents.set(id, updated);
  return cloneDocument(updated);
}

function cloneDocument(document: ResearchDocument): ResearchDocument {
  return { ...document };
}

function inferSourceType(fileName: string): DocumentSourceType {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.md')) return 'markdown';
  if (lower.endsWith('.txt') || lower.endsWith('.rtf')) return 'txt';
  return 'unknown';
}
