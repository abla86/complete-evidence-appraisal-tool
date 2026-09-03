import { createId } from '../utils/id';
import { GradeAssessmentEngine, GradeCerqualAssessmentEngine } from './assessmentEngines';
import type { GradeCerqualSummaryItem } from '../types';
import { getQualityAssessmentsForSession as loadSessionQuality, upsertQualityAssessment } from './appraisalSessionStore';

export interface StoredQualityAssessment {
  id: string;
  appraisalSessionId: string;
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

export function getQualityAssessmentsForSession(sessionId: string): StoredQualityAssessment[] {
  return loadSessionQuality(sessionId);
}

export function addQualityAssessment(sessionId: string, assessment: StoredQualityAssessment): StoredQualityAssessment {
  if (assessment.appraisalSessionId !== sessionId) throw new Error('Kvalitetsvurderingen peker til feil appraisal-sesjon.');
  if (!assessment.evidenceId.trim()) throw new Error('Kvalitetsvurderingen mangler evidenceId.');
  if (!assessment.reviewerId.trim()) throw new Error('Kvalitetsvurderingen mangler reviewerId.');
  const normalized = { ...assessment, appraisalSessionId: sessionId };
  upsertQualityAssessment(normalized);
  return normalized;
}

export function assessGRADE(input: {
  evidenceId: string;
  appraisalSessionId: string;
  outcomeName: string;
  studyDesign: 'RCT' | 'Observational';
  riskOfBias: 0 | -1 | -2;
  inconsistency: 0 | -1 | -2;
  indirectness: 0 | -1 | -2;
  imprecision: 0 | -1 | -2;
  publicationBias: 0 | -1 | -2;
  reviewerId: string;
}): StoredQualityAssessment {
  if (!input.appraisalSessionId.trim()) throw new Error('appraisalSessionId is required.');
  if (!input.evidenceId.trim()) throw new Error('evidenceId is required.');
  if (!input.outcomeName.trim()) throw new Error('Outcome må fylles ut.');
  if (!input.reviewerId.trim()) throw new Error('reviewerId is required.');
  const result = GradeAssessmentEngine.evaluateOutcome(input);
  const now = new Date().toISOString();
  return {
    id: createId('grade'),
    appraisalSessionId: input.appraisalSessionId,
    evidenceId: input.evidenceId,
    kind: 'GRADE',
    outcomeOrFinding: input.outcomeName.trim(),
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
  appraisalSessionId: string;
  finding: string;
  methodologicalLimitations: GradeCerqualSummaryItem['methodologicalLimitations'];
  coherence: GradeCerqualSummaryItem['coherence'];
  adequacyOfData: GradeCerqualSummaryItem['adequacyOfData'];
  relevance: GradeCerqualSummaryItem['relevance'];
  reviewerId: string;
}): StoredQualityAssessment {
  if (!input.appraisalSessionId.trim()) throw new Error('appraisalSessionId is required.');
  if (!input.evidenceId.trim()) throw new Error('evidenceId is required.');
  if (!input.finding.trim()) throw new Error('Finding må fylles ut.');
  if (!input.reviewerId.trim()) throw new Error('reviewerId is required.');
  const result = GradeCerqualAssessmentEngine.evaluateFinding({
    reviewFinding: input.finding.trim(),
    methodologicalLimitations: input.methodologicalLimitations,
    coherence: input.coherence,
    adequacyOfData: input.adequacyOfData,
    relevance: input.relevance,
  });
  const now = new Date().toISOString();
  return {
    id: createId('cerqual'),
    appraisalSessionId: input.appraisalSessionId,
    evidenceId: input.evidenceId,
    kind: 'CERQual',
    outcomeOrFinding: input.finding.trim(),
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
  const locked = {
    ...assessment,
    locked: true,
    version: assessment.version + 1,
    updatedAt: new Date().toISOString(),
  };
  upsertQualityAssessment(locked);
  return locked;
}
