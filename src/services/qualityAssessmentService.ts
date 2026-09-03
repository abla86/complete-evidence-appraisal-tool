import { createId } from '../utils/id';
import { GradeAssessmentEngine, GradeCerqualAssessmentEngine } from './assessmentEngines';
import type { GradeCerqualSummaryItem } from '../types';
import { getQualityAssessmentsForSession as loadSessionQuality, upsertQualityAssessment } from './appraisalSessionStore';
import { getAppraisalWorkflowRecord } from './appraisalWorkflowBridge';

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

function assertQualityContext(sessionId: string, evidenceId: string, reviewerId: string): void {
  const normalizedSessionId = sessionId.trim();
  const normalizedEvidenceId = evidenceId.trim();
  const normalizedReviewerId = reviewerId.trim();
  if (!normalizedSessionId) throw new Error('appraisalSessionId is required.');
  if (!normalizedEvidenceId) throw new Error('evidenceId is required.');
  if (!normalizedReviewerId) throw new Error('reviewerId is required.');

  const record = getAppraisalWorkflowRecord(normalizedSessionId);
  if (!record) throw new Error(`Appraisal-sesjon finnes ikke i canonical workflow: ${normalizedSessionId}`);
  if (record.session.locked) throw new Error('Appraisal-sesjonen er låst.');
  if (record.session.reviewerId !== normalizedReviewerId) throw new Error('Reviewer stemmer ikke med appraisal-sesjonen.');
  if (!record.evidenceIds.includes(normalizedEvidenceId)) {
    throw new Error('Evidence er ikke en del av appraisal-payloaden for denne sesjonen.');
  }
}

export function getQualityAssessmentsForSession(sessionId: string): StoredQualityAssessment[] {
  return loadSessionQuality(sessionId);
}

export function addQualityAssessment(sessionId: string, assessment: StoredQualityAssessment): StoredQualityAssessment {
  assertQualityContext(sessionId, assessment.evidenceId, assessment.reviewerId);
  if (assessment.appraisalSessionId !== sessionId) throw new Error('Kvalitetsvurderingen peker til feil appraisal-sesjon.');
  const normalized = { ...assessment, appraisalSessionId: sessionId.trim(), evidenceId: assessment.evidenceId.trim(), reviewerId: assessment.reviewerId.trim() };
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
  assertQualityContext(input.appraisalSessionId, input.evidenceId, input.reviewerId);
  if (!input.outcomeName.trim()) throw new Error('Outcome må fylles ut.');
  const result = GradeAssessmentEngine.evaluateOutcome(input);
  const now = new Date().toISOString();
  return {
    id: createId('grade'),
    appraisalSessionId: input.appraisalSessionId.trim(),
    evidenceId: input.evidenceId.trim(),
    kind: 'GRADE',
    outcomeOrFinding: input.outcomeName.trim(),
    result,
    reviewerId: input.reviewerId.trim(),
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
  assertQualityContext(input.appraisalSessionId, input.evidenceId, input.reviewerId);
  if (!input.finding.trim()) throw new Error('Finding må fylles ut.');
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
    appraisalSessionId: input.appraisalSessionId.trim(),
    evidenceId: input.evidenceId.trim(),
    kind: 'CERQual',
    outcomeOrFinding: input.finding.trim(),
    result,
    reviewerId: input.reviewerId.trim(),
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
