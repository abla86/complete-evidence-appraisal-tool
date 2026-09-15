import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMetaAnalysis } from './metaAnalysis';

test('calculates pooled risk ratio for valid dichotomous studies', () => {
  const result = calculateMetaAnalysis([
    {
      studyId: 'study-1', citationKey: 'Smith2024', year: 2024,
      eventsIntervention: 10, totalIntervention: 100,
      eventsControl: 20, totalControl: 100,
    },
    {
      studyId: 'study-2', citationKey: 'Jones2025', year: 2025,
      eventsIntervention: 15, totalIntervention: 100,
      eventsControl: 25, totalControl: 100,
    },
  ]);

  assert.equal(result.studyEffects.length, 2);
  assert.ok(result.pooledEffect > 0);
  assert.ok(result.ciLower > 0);
  assert.ok(result.ciUpper >= result.ciLower);
  assert.equal(result.totalEventsI, 25);
  assert.equal(result.totalEventsC, 45);
});

test('rejects impossible event counts and returns an empty analysis', () => {
  const result = calculateMetaAnalysis([
    {
      studyId: 'invalid', citationKey: 'Invalid', year: 2026,
      eventsIntervention: 101, totalIntervention: 100,
      eventsControl: 1, totalControl: 100,
    },
  ]);

  assert.deepEqual(result.studyEffects, []);
  assert.equal(result.cochranQ, 0);
});

test('applies continuity correction for zero events', () => {
  const result = calculateMetaAnalysis([
    {
      studyId: 'zero-events', citationKey: 'Zero2026', year: 2026,
      eventsIntervention: 0, totalIntervention: 50,
      eventsControl: 5, totalControl: 50,
    },
  ], 'fixed');

  assert.equal(result.studyEffects.length, 1);
  assert.ok(Number.isFinite(result.pooledEffect));
  assert.ok(Number.isFinite(result.ciLower));
  assert.ok(Number.isFinite(result.ciUpper));
});
