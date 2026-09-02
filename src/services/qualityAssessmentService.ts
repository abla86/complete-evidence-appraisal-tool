import { GradeAssessmentEngine, GradeCerqualAssessmentEngine } from './assessmentEngines';
import type { GradeSummaryOfFindingsItem, GradeCerqualSummaryItem } from '../types';

export interface StoredQualityAssessment {
  id: string;
  evidenceId: string;
  kind: 'GRADE' | 'CERQual';
  outcomeOrFinding: string;
  result: unknown;
  reviewerId: string;
  version: number;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export function assessGRADE(input: {
  evidenceId: string;
  outcomeName: string;
  studyDesign: 'RCT' | 'Observational';
  riskOfBias: 0 | -1 | -2;
  inconsistency: 0 | -1 | -2;
  indirectness: 0 | -1 | -2;
  imprecision: 0 | -1 | -2;
  publicationBias: 0 | -1 | -2;
  reviewerId: string;
}): StoredQualityAssessment {
  const result = GradeAssessmentEngine.evaluateOutcome(input);
  const now = new Date().toISOString();
  return {
    id: `grade_${crypto.randomUUID()}`,
    evidenceId: input.evidenceId,
    kind: 'GRADE',
    outcomeOrFinding: input.outcomeName,
    result,
    reviewerId: input.reviewerId,
    version: 1,
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function assessCERQual(input: {
  evidenceId: string;
  finding: string;
  methodologicalLimitations: GradeCerqualSummaryItem['methodologicalLimitations'];
  coherence: GradeCerqualSummaryItem['coherence'];
  adequacyOfData: GradeCerqualSummaryItem['adequacyOfData'];
  relevance: GradeCerqualSummaryItem['relevance'];
  reviewerId: string;
}): StoredQualityAssessment {
  const result = GradeCerqualAssessmentEngine.evaluateFinding({
    reviewFinding: input.finding,
    methodologicalLimitations: input.methodologicalLimitations,
    coherence: input.coherence,
    adequacyOfData: input.adequacyOfData,
    relevance: input.relevance,
  });
  const now = new Date().toISOString();
  return {
    id: `cerqual_${crypto.randomUUID()}`,
    evidenceId: input.evidenceId,
    kind: 'CERQual',
    outcomeOrFinding: input.finding,
    result,
    reviewerId: input.reviewerId,
    version: 1,
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function lockQualityAssessment(assessment: StoredQualityAssessment): StoredQualityAssessment {
  if (assessment.locked) throw new Error('Kvalitetsvurderingen er allerede låst.');
  return {
    ...assessment,
    locked: true,
    version: assessment.version + 1,
    updatedAt: new Date().toISOString(),
  };
}
