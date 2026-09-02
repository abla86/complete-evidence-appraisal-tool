import type {
  CandidateEvidence,
  EvidenceLocation,
  DocumentClassificationResult,
} from '../types';
import type { ResearchEngineDocument } from './researchEngineGateway';

export type ResearchEvidenceVerification = 'AI_CANDIDATE' | 'HUMAN_VERIFIED' | 'REJECTED' | 'MANUAL';

export interface ResearchEvidenceRecord {
  id: string;
  studyId: string;
  documentId: string;
  location: EvidenceLocation;
  quote: string;
  source: ResearchEvidenceVerification;
  verifiedByResearcher: boolean;
  questionId?: number;
  suggestedStatus?: string;
  relevanceScore: number;
  confidenceReason: string;
}

export interface ResearchToAppraisalBundle {
  contractVersion: string;
  document: ResearchEngineDocument;
  classification?: DocumentClassificationResult;
  evidence: ResearchEvidenceRecord[];
  readyForAppraisal: boolean;
  gating: {
    classificationRequired: true;
    humanVerificationRequired: true;
    instrumentRecommendation: string;
  };
}

export class ResearchEvidenceBridge {
  public static buildBundle(
    document: ResearchEngineDocument,
    classification?: DocumentClassificationResult,
    studyId = document.id,
  ): ResearchToAppraisalBundle {
    const candidates = document.candidateEvidence ?? [];
    const evidence = candidates.map((candidate, index) => this.mapCandidate(document, studyId, candidate, index));
    const recommendedInstrument = classification?.recommendedInstrumentId ?? document.metadata.recommendedInstrumentId;

    return {
      contractVersion: '1.0.0',
      document,
      classification,
      evidence,
      readyForAppraisal: Boolean(
        classification &&
        recommendedInstrument &&
        classification.humanDecision?.status === 'APPROVED',
      ),
      gating: {
        classificationRequired: true,
        humanVerificationRequired: true,
        instrumentRecommendation: recommendedInstrument,
      },
    };
  }

  public static verifyEvidence(
    bundle: ResearchToAppraisalBundle,
    evidenceId: string,
    verified: boolean,
  ): ResearchToAppraisalBundle {
    let found = false;
    const evidence = bundle.evidence.map(item => {
      if (item.id !== evidenceId) return item;
      found = true;
      return {
        ...item,
        source: verified ? 'HUMAN_VERIFIED' as const : 'REJECTED' as const,
        verifiedByResearcher: verified,
      };
    });

    if (!found) throw new Error(`Evidence finnes ikke: ${evidenceId}`);
    return { ...bundle, evidence };
  }

  public static toAppraisalLocation(
    location: CandidateEvidence['suggestedLocation'],
    document: ResearchEngineDocument,
  ): EvidenceLocation {
    return {
      documentId: document.id,
      fileName: document.fileName,
      page: location.page === undefined ? undefined : String(location.page),
      section: location.section,
      table: location.table,
      figure: location.figure,
      location: [
        location.page !== undefined ? `page:${location.page}` : '',
        location.section ? `section:${location.section}` : '',
        location.table ? `table:${location.table}` : '',
        location.figure ? `figure:${location.figure}` : '',
      ].filter(Boolean).join('|') || 'document',
      quote: '',
    };
  }

  private static mapCandidate(
    document: ResearchEngineDocument,
    studyId: string,
    candidate: CandidateEvidence,
    index: number,
  ): ResearchEvidenceRecord {
    const location = this.toAppraisalLocation(candidate.suggestedLocation, document);
    return {
      id: `research-evidence-${document.id}-${index + 1}`,
      studyId,
      documentId: document.id,
      location: { ...location, quote: candidate.extractedSnippet },
      quote: candidate.extractedSnippet,
      source: candidate.verifiedByResearcher ? 'HUMAN_VERIFIED' : 'AI_CANDIDATE',
      verifiedByResearcher: candidate.verifiedByResearcher,
      questionId: candidate.questionId,
      suggestedStatus: candidate.suggestedStatus,
      relevanceScore: candidate.relevanceScore,
      confidenceReason: candidate.confidenceReason,
    };
  }
}

export default ResearchEvidenceBridge;
