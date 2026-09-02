import type {
  CandidateEvidence,
  EvidenceLocation,
  DocumentClassificationResult,
} from '../types';
import type { ResearchEngineDocument } from './researchEngineGateway';

export interface ResearchEvidenceRecord {
  id: string;
  studyId: string;
  documentId: string;
  location: EvidenceLocation;
  quote: string;
  source: 'AI_CANDIDATE' | 'HUMAN_VERIFIED' | 'MANUAL';
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
    const evidence = candidates.map((candidate, index) =>
      this.mapCandidate(document, studyId, candidate, index),
    );

    const readyForAppraisal = Boolean(
      classification?.recommendedInstrumentId &&
      classification.confidenceStatus !== 'INSUFFICIENT_INFORMATION' &&
      classification.confidenceStatus !== 'CONFLICTING_EVIDENCE',
    );

    return {
      contractVersion: '1.0.0',
      document,
      classification,
      evidence,
      readyForAppraisal,
      gating: {
        classificationRequired: true,
        humanVerificationRequired: true,
        instrumentRecommendation:
          classification?.recommendedInstrumentId ??
          document.metadata.recommendedInstrumentId,
      },
    };
  }

  public static verifyEvidence(
    bundle: ResearchToAppraisalBundle,
    evidenceId: string,
    verified: boolean,
  ): ResearchToAppraisalBundle {
    return {
      ...bundle,
      evidence: bundle.evidence.map((item) =>
        item.id === evidenceId
          ? {
              ...item,
              source: verified ? 'HUMAN_VERIFIED' : 'MANUAL',
              verifiedByResearcher: verified,
            }
          : item,
      ),
    };
  }

  public static toAppraisalLocation(
    location: CandidateEvidence['suggestedLocation'],
  ): EvidenceLocation {
    return {
      page: location.page === undefined ? undefined : String(location.page),
      section: location.section,
      table: location.table,
      figure: location.figure,
    };
  }

  private static mapCandidate(
    document: ResearchEngineDocument,
    studyId: string,
    candidate: CandidateEvidence,
    index: number,
  ): ResearchEvidenceRecord {
    return {
      id: `research-evidence-${document.id}-${index + 1}`,
      studyId,
      documentId: document.id,
      location: this.toAppraisalLocation(candidate.suggestedLocation),
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
