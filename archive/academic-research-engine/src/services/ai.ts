import { GoogleGenAI } from '@google/genai';
import { getDocument } from './workspace.js';
import type { EvidenceLocation, ResearchAnswer } from '../types/index.js';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!client && process.env.GEMINI_API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

function normalizeEvidence(value: unknown): EvidenceLocation[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.documentId !== 'string' || typeof row.quote !== 'string') return [];
    return [{
      documentId: row.documentId,
      fileName: typeof row.fileName === 'string' ? row.fileName : '',
      location: typeof row.location === 'string' ? row.location : 'document',
      quote: row.quote,
      page: typeof row.page === 'string' ? row.page : undefined,
      section: typeof row.section === 'string' ? row.section : undefined,
      table: typeof row.table === 'string' ? row.table : undefined,
      figure: typeof row.figure === 'string' ? row.figure : undefined,
    }];
  });
}

export async function askResearch(question: string, documentIds: string[]): Promise<ResearchAnswer> {
  const normalizedQuestion = String(question ?? '').trim();
  if (!normalizedQuestion) throw new Error('question is required');
  if (!Array.isArray(documentIds)) throw new Error('documentIds must be an array');

  const documents = documentIds
    .map(id => getDocument(String(id)))
    .filter((document): document is NonNullable<ReturnType<typeof getDocument>> => Boolean(document));

  if (!documents.length) {
    return { mode: 'fallback', answer: 'Ingen kilder er valgt.', evidence: [], uncertainties: ['No source selected'] };
  }

  const ai = getClient();
  if (!ai) {
    return {
      mode: 'fallback',
      answer: 'AI er ikke konfigurert. Bruk kilde-søk for å finne dokumentert tekst.',
      evidence: [],
      uncertainties: ['GEMINI_API_KEY is not configured'],
    };
  }

  const context = documents.map(document => [
    `DOCUMENT ID: ${document.id}`,
    `FILE: ${document.fileName}`,
    document.text.slice(0, 18000),
  ].join('\n')).join('\n\n');

  const prompt = `You are a source-grounded academic research assistant.
Use ONLY the supplied source documents.
Never invent facts, citations, quotations, verification status, or source metadata.
Distinguish evidence from interpretation and state uncertainty.
Return JSON only with answer, evidence and uncertainties.
Evidence objects must contain documentId, location and quote.
QUESTION:\n${normalizedQuestion}\n\nSOURCE DOCUMENTS:\n${context}`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' },
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text || '{}');
  } catch {
    return {
      mode: 'fallback',
      answer: 'AI-svaret kunne ikke valideres som JSON og er derfor ikke brukt.',
      evidence: [],
      uncertainties: ['AI returned invalid JSON'],
    };
  }

  const data = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  return {
    mode: 'ai',
    answer: typeof data.answer === 'string' ? data.answer : '',
    evidence: normalizeEvidence(data.evidence),
    uncertainties: Array.isArray(data.uncertainties)
      ? data.uncertainties.filter((item): item is string => typeof item === 'string')
      : ['AI response contained no structured uncertainty list'],
  };
}
