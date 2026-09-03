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
  verifiedAt?: string;
  verifiedBy?: string;
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
    reviewerId = 'researcher',
  ): ResearchToAppraisalBundle {
    const normalizedReviewerId = reviewerId.trim();
    if (!normalizedReviewerId) throw new Error('Reviewer ID is required.');

    let found = false;
    const now = new Date().toISOString();
    const evidence = bundle.evidence.map(item => {
      if (item.id !== evidenceId) return item;
      found = true;
      return {
        ...item,
        source: verified ? 'HUMAN_VERIFIED' as const : 'REJECTED' as const,
        verifiedByResearcher: verified,
        verifiedAt: now,
        verifiedBy: normalizedReviewerId,
      };
    });

    if (!found) throw new Error(`Evidence finnes ikke: ${evidenceId}`);
    return { ...bundle, evidence };
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
      verifiedAt: candidate.verifiedByResearcher ? new Date().toISOString() : undefined,
      verifiedBy: undefined,
      questionId: candidate.questionId,
      suggestedStatus: candidate.suggestedStatus,
      relevanceScore: candidate.relevanceScore,
      confidenceReason: candidate.confidenceReason,
    };
  }
}

export default ResearchEvidenceBridge;
