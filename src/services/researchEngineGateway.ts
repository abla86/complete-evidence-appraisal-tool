import type { CandidateEvidence, DocumentAnalysisResult } from '../types';
import { DocumentAnalysisService } from './documentAnalysisService';
import { DocumentParserService, type FileParseResult } from './documentParserService';

export const RESEARCH_ENGINE_CONTRACT_VERSION = '1.0.0';

export interface ResearchEngineEvidence {
  id: string;
  documentId: string;
  location: {
    page?: string;
    section?: string;
    table?: string;
    figure?: string;
  };
  quote: string;
  status: 'AI_CANDIDATE' | 'HUMAN_VERIFIED' | 'REJECTED';
  verifiedByResearcher: boolean;
  source: 'DOCUMENT_PARSER' | 'DOCUMENT_ANALYSIS' | 'RESEARCH_ENGINE';
  questionId?: number;
  suggestedStatus?: string;
  relevanceScore?: number;
  confidenceReason?: string;
}

export interface ResearchEngineDocument {
  id: string;
  fileName: string;
  fileType: FileParseResult['fileType'];
  mimeType: string;
  extractedText: string;
  wordCount: number;
  estimatedPages: number;
  metadata: FileParseResult['metadata'];
  sections: FileParseResult['sections'];
  scanned: boolean;
  ocrNeeded: boolean;
  candidateEvidence: CandidateEvidence[];
}

export interface ResearchEngineHandoff {
  contractVersion: typeof RESEARCH_ENGINE_CONTRACT_VERSION;
  source: 'complete-evidence-appraisal-tool';
  document: ResearchEngineDocument;
  evidence: ResearchEngineEvidence[];
  methodology: {
    documentType?: string;
    studyDesign?: string;
    recommendedInstrumentId?: string;
  };
}

export class ResearchEngineGateway {
  public static async parseDocument(
    file: File | { name: string; size: number; type?: string; content: ArrayBuffer | string },
  ): Promise<ResearchEngineDocument> {
    const parsed = await DocumentParserService.parseFile(file);
    return {
      id: this.createDocumentId(`${file.name}:${file.size}:${parsed.extractedText.slice(0, 1000)}`),
      fileName: parsed.fileName,
      fileType: parsed.fileType,
      mimeType: parsed.mimeType,
      extractedText: parsed.extractedText,
      wordCount: parsed.wordCount,
      estimatedPages: parsed.estimatedPages,
      metadata: parsed.metadata,
      sections: parsed.sections,
      scanned: parsed.isScannedOrImageOnly,
      ocrNeeded: parsed.ocrAppliedOrNeeded,
      candidateEvidence: parsed.candidateEvidence ?? [],
    };
  }

  public static analyzeText(text: string, fileName = 'document.txt'): DocumentAnalysisResult {
    if (!text?.trim()) throw new Error('Dokumenttekst kan ikke vÃ¦re tom.');
    return DocumentAnalysisService.analyzeText(text, fileName);
  }

  public static createHandoff(
    document: ResearchEngineDocument,
    evidence: ResearchEngineEvidence[] = [],
  ): ResearchEngineHandoff {
    return {
      contractVersion: RESEARCH_ENGINE_CONTRACT_VERSION,
      source: 'complete-evidence-appraisal-tool',
      document,
      evidence: evidence.map(item => ({ ...item, location: { ...item.location } })),
      methodology: {
        documentType: document.metadata.studyDesignDetected,
        studyDesign: document.metadata.studyDesignDetected,
        recommendedInstrumentId: document.metadata.recommendedInstrumentId,
      },
    };
  }

  public static candidateEvidenceToHandoff(
    document: ResearchEngineDocument,
    candidates: CandidateEvidence[] = document.candidateEvidence,
  ): ResearchEngineHandoff {
    const evidence = candidates.map((candidate, index) => ({
      id: `evidence-${document.id}-${index + 1}`,
      documentId: document.id,
      location: {
        page: candidate.suggestedLocation.page,
        section: candidate.suggestedLocation.section,
        table: candidate.suggestedLocation.table,
        figure: candidate.suggestedLocation.figure,
      },
      quote: candidate.extractedSnippet,
      status: candidate.verifiedByResearcher ? 'HUMAN_VERIFIED' as const : 'AI_CANDIDATE' as const,
      verifiedByResearcher: candidate.verifiedByResearcher,
      source: 'DOCUMENT_ANALYSIS' as const,
      questionId: candidate.questionId,
      suggestedStatus: candidate.suggestedStatus,
      relevanceScore: candidate.relevanceScore,
      confidenceReason: candidate.confidenceReason,
    }));

    return this.createHandoff(document, evidence);
  }

  private static createDocumentId(value: string): string {
    const normalized = value.trim().toLowerCase();
    let hash = 2166136261;
    for (let index = 0; index < normalized.length; index += 1) {
      hash ^= normalized.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `doc-${(hash >>> 0).toString(16)}`;
  }
}

export default ResearchEngineGateway;

