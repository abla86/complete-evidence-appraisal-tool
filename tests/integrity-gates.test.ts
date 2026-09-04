import test from 'node:test';
import assert from 'node:assert/strict';
import { GradeAssessmentEngine } from '../src/services/assessmentEngines.ts';
import { assessPublicationUsability } from '../src/services/publicationUsabilityService.ts';

test('GRADE accepts only bounded typed adjustments and preserves certainty bounds', () => {
  const result = GradeAssessmentEngine.evaluateOutcome({
    outcomeName: 'Outcome',
    studyDesign: 'RCT',
    riskOfBias: -1,
    inconsistency: -1,
    indirectness: 0,
    imprecision: -1,
    publicationBias: 0,
    largeEffect: 0,
    doseResponse: 0,
    opposingConfounders: 0,
  });
  assert.equal(result.initialCertainty, 'High');
  assert.equal(result.finalCertainty, 'Low');
});

test('retracted publication is blocked', () => {
  const result = assessPublicationUsability({
    isRetracted: true,
    hasCorrection: false,
    isPeerReviewed: 'VERIFIED',
  } as any);
  assert.equal(result.usability, 'BLOCKED');
});

test('correction requires review rather than automatic exclusion', () => {
  const result = assessPublicationUsability({
    isRetracted: false,
    hasCorrection: true,
    isPeerReviewed: 'VERIFIED',
  } as any);
  assert.equal(result.usability, 'REVIEW_REQUIRED');
});
