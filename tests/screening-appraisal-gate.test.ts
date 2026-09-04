import test from 'node:test';
import assert from 'node:assert/strict';
import { assertEligibleForAppraisal } from '../src/services/researchWorkflowBridge.ts';

test('excluded study cannot enter appraisal', () => {
  assert.throws(() => assertEligibleForAppraisal({studyId:'s1',screening:{studyId:'s1',decision:'exclude'},reviewerId:'r1'}), /Kun inkluderte/);
});

test('included study with matching id can pass the gate', () => {
  assert.doesNotThrow(() => assertEligibleForAppraisal({studyId:'s1',screening:{studyId:'s1',decision:'include'},reviewerId:'r1'}));
});
