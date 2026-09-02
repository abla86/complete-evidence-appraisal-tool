export type ScreeningDecisionValue = 'include' | 'exclude' | 'uncertain';

export interface PICO {
  population?: string;
  intervention?: string;
  comparator?: string;
  outcome?: string;
}

export interface ScreeningDecision {
  studyId: string;
  decision: ScreeningDecisionValue;
  reason?: string;
  picoMatches: Partial<PICO>;
  reviewerId: string;
  timestamp: string;
}

export type DualReviewStatus = 'assigned' | 'inProgress' | 'completed' | 'disputed' | 'resolved';

export interface DualReviewConfig {
  instrumentId: string;
  minReviewers: 2;
  conflictThreshold: number;
  arbitrationMethod: 'consensus' | 'thirdReviewer' | 'autoResolve';
}

export interface ReviewInstance {
  id: string;
  appraisalId: string;
  studyId: string;
  instrumentId: string;
  reviewerId: string;
  status: DualReviewStatus;
  responses: Record<string, string | number | boolean | null>;
  comments: Array<{ itemId: string; comment: string }>;
  completedAt?: string;
}

export interface ReviewDisagreement {
  itemId: string;
  reviewer1Score: string | number | boolean | null;
  reviewer2Score: string | number | boolean | null;
  disagreement: boolean;
}

export interface ReviewComparison {
  overallDisagreement: number;
  items: ReviewDisagreement[];
  requiresArbitration: boolean;
}

export interface ResolvedAppraisal {
  appraisalId: string;
  status: 'resolved';
  resolutionMethod: DualReviewConfig['arbitrationMethod'];
  resolvedBy: string;
  resolvedAt: string;
  disagreements: ReviewDisagreement[];
  consensusResponses: Record<string, string | number | boolean | null>;
}

export interface GRADEAssessment {
  id: string;
  evidenceId: string;
  outcome: string;
  studyDesign: 'RCT' | 'Observational';
  initialRating: 'high' | 'moderate' | 'low' | 'very_low';
  downgrades: Array<{
    domain: 'riskOfBias' | 'inconsistency' | 'indirectness' | 'imprecision' | 'publicationBias';
    severity: 'serious' | 'very_serious';
    justification: string;
  }>;
  upgrades: Array<{
    domain: 'largeEffect' | 'doseResponse' | 'plausibleConfounding';
    strength: 'strong' | 'weak';
    justification: string;
  }>;
  finalGrade: 'high' | 'moderate' | 'low' | 'very_low';
  reviewerId: string;
  version: number;
  locked: boolean;
  completedAt: string;
}

export interface CERQualAssessment {
  id: string;
  evidenceId: string;
  finding: string;
  components: {
    methodologicalLimitations: 'no_or_very_minor' | 'minor' | 'moderate' | 'serious';
    coherence: 'no_or_very_minor' | 'minor' | 'moderate' | 'serious';
    adequacy: 'no_or_very_minor' | 'minor' | 'moderate' | 'serious';
    relevance: 'no_or_very_minor' | 'minor' | 'moderate' | 'serious';
  };
  finalConfidence: 'high' | 'moderate' | 'low' | 'very_low';
  reviewerId: string;
  version: number;
  locked: boolean;
  completedAt: string;
}

export interface PRISMAFlow {
  identification: {
    recordsFromDatabases: number;
    recordsFromOtherSources: number;
    totalIdentified: number;
    duplicatesRemoved: number;
  };
  screening: {
    recordsScreened: number;
    recordsExcluded: number;
  };
  eligibility: {
    fullTextsAssessed: number;
    fullTextsExcluded: Array<{ reason: string; count: number }>;
  };
  included: {
    studiesFinalSynthesis: number;
    studiesQualityAssessment: number;
  };
}
