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
  assert.equal(result.finalCertainty, 'Very Low');
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


test('unknown study design has no automatically recommended appraisal instrument', async () => {
  const { StudyDesignGateService } = await import('../src/services/studyDesignGateService.ts');
  const detected = StudyDesignGateService.detectStudyDesign('A document with insufficient methodological information.');
  assert.equal(detected.id, 'unknown-uncertain');
  assert.equal(detected.primaryInstrumentId, '');
  const result = StudyDesignGateService.checkCompatibility('unknown-uncertain', 'casp-qualitative');
  assert.equal(result.isCompatible, false);
  assert.equal(result.recommendedInstruments.length, 0);
  assert.equal(result.requiresExplicitOverrideConfirmation, true);
});

test('case-control design recommends the case-control appraisal instrument', async () => {
  const { StudyDesignGateService } = await import('../src/services/studyDesignGateService.ts');
  const result = StudyDesignGateService.checkCompatibility('case-control', 'casp-case-control');
  assert.equal(result.isCompatible, true);
  assert.equal(result.matchLevel, 'EXACT_RECOMMENDED');
});

test('scoping review uses PRISMA-ScR as reporting standard rather than PRISMA 2020', async () => {
  const { StudyDesignGateService } = await import('../src/services/studyDesignGateService.ts');
  const detected = StudyDesignGateService.detectStudyDesign('This is a scoping review of the literature.');
  assert.equal(detected.id, 'scoping-review');
  assert.equal(detected.primaryInstrumentId, 'prisma-scr');
});
