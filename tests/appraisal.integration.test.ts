import test from 'node:test';
import assert from 'node:assert/strict';
import { Amstar2AssessmentEngine, Agree2AssessmentEngine, Rob2AssessmentEngine, GradeAssessmentEngine, GradeCerqualAssessmentEngine } from '../src/services/assessmentEngines.ts';
import { buildAppraisalResult } from '../src/services/appraisalResultService.ts';

test('AMSTAR 2 uses 16 items and does not produce a numeric total score', () => {
  const responses: Record<number, string> = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i + 1, 'Yes']));
  const result = Amstar2AssessmentEngine.evaluate(responses);
  assert.equal(result.criticalFlawsCount, 0);
  assert.equal(result.overallConfidence, 'High');
  assert.equal('totalScore' in result, false);
});

test('AGREE II calculates six independent domain scores', () => {
  const ratings = Object.fromEntries(Array.from({ length: 23 }, (_, i) => [i + 1, 7]));
  const result = Agree2AssessmentEngine.evaluateDomainScores(ratings);
  assert.equal(result.domainScores.length, 6);
  assert.ok(result.domainScores.every(domain => domain.standardizedScorePercent === 100));
});

test('RoB 2 derives overall risk from five domains', () => {
  const result = Rob2AssessmentEngine.evaluate({
    d1Randomisation: 'Low risk',
    d2Deviations: 'Low risk',
    d3MissingData: 'Some concerns',
    d4Measurement: 'Low risk',
    d5Selection: 'Low risk',
  });
  assert.equal(result.domainEvaluations.length, 5);
  assert.equal(result.overallRiskOfBias, 'Some concerns');
});

test('GRADE starts at the appropriate design certainty and records domains', () => {
  const result = GradeAssessmentEngine.evaluateOutcome({
    outcomeName: 'Mortality',
    studyDesign: 'RCT',
    riskOfBias: -1,
    inconsistency: 0,
    indirectness: 0,
    imprecision: 0,
    publicationBias: 0,
  });
  assert.equal(result.initialCertainty, 'High');
  assert.equal(result.finalCertainty, 'Moderate');
  assert.equal(result.downgradeFactors.riskOfBias, -1);
});

test('CERQual returns one confidence judgement for one synthesis finding', () => {
  const result = GradeCerqualAssessmentEngine.evaluateFinding({
    reviewFinding: 'Pasienter beskrev behov for kontinuitet.',
    methodologicalLimitations: 'Minor concerns',
    coherence: 'No or very minor concerns',
    adequacyOfData: 'Minor concerns',
    relevance: 'No or very minor concerns',
  });
  assert.equal(result.reviewFinding, 'Pasienter beskrev behov for kontinuitet.');
  assert.equal(result.overallConfidence, 'Moderate confidence');
});

test('incomplete persisted appraisal data never receives a fallback methodological score', () => {
  const base = {
    instrumentVersion: 'test',
    studyId: 'study-1',
    reviewerId: 'reviewer-1',
  };
  const amstar = buildAppraisalResult({ ...base, instrumentId: 'amstar-2', responses: [{ itemId: 1, answer: 'Yes', rationale: 'evidence' }] });
  const agree = buildAppraisalResult({ ...base, instrumentId: 'agree-ii', responses: [{ itemId: 1, answer: 7, rationale: 'evidence' }] });
  const rob2 = buildAppraisalResult({ ...base, instrumentId: 'rob-2', responses: [{ itemId: 1, answer: 'Low risk', rationale: 'evidence' }] });
  assert.equal(amstar.result, null);
  assert.equal(agree.result, null);
  assert.equal(rob2.result, null);
});
