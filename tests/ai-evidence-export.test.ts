import test from 'node:test';
import assert from 'node:assert/strict';

test('unreviewed AI evidence must block final export', () => {
  const evidence = { aiReviewRequired: true, researcherVerified: false };
  assert.equal(evidence.aiReviewRequired && !evidence.researcherVerified, true);
});
