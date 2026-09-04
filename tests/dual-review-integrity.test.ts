import test from 'node:test';
import assert from 'node:assert/strict';
import { compareReviewInstances } from '../src/services/researchWorkflowBridge.ts';

const base = { id:'1', appraisalId:'a', studyId:'s', instrumentId:'jbi', status:'completed' as const, responses:{'1':'Yes'}, comments:[] };

test('dual review requires different reviewers', () => {
  assert.throws(() => compareReviewInstances({...base, reviewerId:'r1'}, {...base, id:'2', reviewerId:'r1'}), /to forskjellige/);
});
test('comparison requires completed reviews', () => {
  assert.throws(() => compareReviewInstances({...base, reviewerId:'r1'}, {...base, id:'2', reviewerId:'r2', status:'inProgress'}), /completed/);
});
