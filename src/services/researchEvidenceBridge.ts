import type {
  CandidateEvidence,
  EvidenceLocation,
  DocumentClassificationResult,
} from '../types';
import type { ResearchEngineDocument } from './researchEngineGateway';

export type ResearchEvidenceVerification =
  | 'AI_CANDIDATE'
  | 'HUMAN_VERIFIED'
  | 'REJECTED'
  | 'MANUAL';

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
    const normalizedStudyId = studyId.trim();
    if (!normalizedStudyId) throw new Error('studyId is required.');

    const candidates = document.candidateEvidence ?? [];
    const evidence = candidates.map((candidate, index) =>
      this.mapCandidate(document, normalizedStudyId, candidate, index),
    );

    const recommendedInstrument =
      classification?.recommendedInstrumentId?.trim() ??
      document.metadata.recommendedInstrumentId?.trim() ??
      '';
    const classificationApproved = classification?.humanDecision?.status === 'APPROVED';

    return {
      contractVersion: '1.0.0',
      document,
      classification,
      evidence,
      readyForAppraisal: classificationApproved && Boolean(recommendedInstrument),
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
    reviewerId: string,
  ): ResearchToAppraisalBundle {
    const normalizedEvidenceId = evidenceId.trim();
    const normalizedReviewerId = reviewerId.trim();
    if (!normalizedEvidenceId) throw new Error('Evidence ID is required.');
    if (!normalizedReviewerId) throw new Error('Reviewer ID is required.');

    let found = false;
    const now = new Date().toISOString();
    const evidence = bundle.evidence.map(item => {
      if (item.id !== normalizedEvidenceId) return item;
      found = true;
      return {
        ...item,
        source: verified ? ('HUMAN_VERIFIED' as const) : ('REJECTED' as const),
        verifiedByResearcher: verified,
        verifiedAt: now,
        verifiedBy: normalizedReviewerId,
      };
    });
    if (!found) throw new Error(`Evidence finnes ikke: ${normalizedEvidenceId}`);
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
    const humanVerified = candidate.verifiedByResearcher === true;
    return {
      id: `research-evidence-${document.id}-${index + 1}`,
      studyId,
      documentId: document.id,
      location: this.toAppraisalLocation(candidate.suggestedLocation),
      quote: candidate.extractedSnippet,
      source: humanVerified ? 'HUMAN_VERIFIED' : 'AI_CANDIDATE',
      verifiedByResearcher: humanVerified,
      questionId: candidate.questionId,
      suggestedStatus: candidate.suggestedStatus,
      relevanceScore: candidate.relevanceScore,
      confidenceReason: humanVerified
        ? 'ForhÃ¥ndsmarkert som verifisert i innkommende data; reviewer-identitet og tidspunkt mÃ¥ fÃ¸lge med separat fÃ¸r materialet brukes som komplett auditspor.'
        : candidate.confidenceReason,
    };
  }
}

export default ResearchEvidenceBridge;


