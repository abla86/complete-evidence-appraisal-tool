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
  if (record.session.reviewerId !== normalizedReviewerId) throw new Error('Reviewer stemmer ikke med appraisal-sesjonen.');
  if (!record.evidenceIds.includes(normalizedEvidenceId)) throw new Error('Evidence er ikke en del av appraisal-payloaden for denne sesjonen.');
}

export function getQualityAssessmentsForSession(sessionId: string): StoredQualityAssessment[] {
  return loadSessionQuality(sessionId);
}

export function addQualityAssessment(sessionId: string, assessment: StoredQualityAssessment): StoredQualityAssessment {
  const normalizedSessionId = sessionId.trim();
  if (!assessment.appraisalSessionId.trim()) throw new Error('Quality assessment appraisalSessionId is required.');
  if (assessment.appraisalSessionId.trim() !== normalizedSessionId) throw new Error('Kvalitetsvurderingen peker til feil appraisal-sesjon.');
  if (assessment.locked) throw new Error('LÃ¥st kvalitetsvurdering kan ikke overskrives.');

  assertQualityContext(normalizedSessionId, assessment.evidenceId, assessment.reviewerId);
  const normalized: StoredQualityAssessment = {
    ...assessment,
    appraisalSessionId: normalizedSessionId,
    evidenceId: assessment.evidenceId.trim(),
    reviewerId: assessment.reviewerId.trim(),
    outcomeOrFinding: assessment.outcomeOrFinding.trim(),
  };
  if (!normalized.outcomeOrFinding) throw new Error('Outcome eller finding mÃ¥ fylles ut.');
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
  if (!input.outcomeName.trim()) throw new Error('Outcome mÃ¥ fylles ut.');
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
  if (!input.finding.trim()) throw new Error('Finding mÃ¥ fylles ut.');
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
  if (assessment.locked) return assessment;
  assertQualityContext(assessment.appraisalSessionId, assessment.evidenceId, assessment.reviewerId);
  const appraisal = getAppraisalWorkflowRecord(assessment.appraisalSessionId);
  if (appraisal && appraisal.session.status !== 'completed' && appraisal.session.status !== 'resolved') throw new Error('Appraisal mÃ¥ vÃ¦re ferdigstilt fÃ¸r GRADE/CERQual kan lÃ¥ses.');
  if (!assessment.reviewerId.trim()) throw new Error('Reviewer ID er pÃ¥krevd fÃ¸r quality assessment kan lÃ¥ses.');
  const locked: StoredQualityAssessment = {
    ...assessment,
    appraisalSessionId: assessment.appraisalSessionId.trim(),
    evidenceId: assessment.evidenceId.trim(),
    reviewerId: assessment.reviewerId.trim(),
    outcomeOrFinding: assessment.outcomeOrFinding.trim(),
    locked: true,
    version: assessment.version + 1,
    updatedAt: new Date().toISOString(),
  };
  if (!locked.outcomeOrFinding) throw new Error('Outcome eller finding mÃ¥ fylles ut fÃ¸r lÃ¥sing.');
  upsertQualityAssessment(locked);
  return locked;
}


