export type FrameworkType = 'CASP_QUALITATIVE' | 'AMSTAR_2' | 'AGREE_II' | 'COCHRANE_ROB_2';

export type AppraisalResponse = 'YES' | 'NO' | 'UNCLEAR' | 'NOT_APPLICABLE';

export type ImradSectionType = 'ABSTRACT' | 'INTRODUCTION' | 'METHODS' | 'RESULTS' | 'DISCUSSION' | 'OTHER';

export interface EvidenceAnchor {
  section: ImradSectionType;
  quote: string;
  pageNumber?: number;
  charOffsetStart?: number;
  charOffsetEnd?: number;
}

export interface ChecklistCriterion {
  id: string;
  code: string; // f.eks. "CASP_Q1"
  questionText: string;
  helpText: string;
  mandatory: boolean;
}

export interface CriterionEvaluation {
  criterionId: string;
  response: AppraisalResponse;
  rationale: string;
  evidenceAnchors: EvidenceAnchor[];
}
