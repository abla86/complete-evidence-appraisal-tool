import assert from 'node:assert/strict';
import test from 'node:test';
import { requireScreened, requireReferenceVerification, requireNoFalseClaim } from '../src/services/workflowGate';

test('PICO attachment requires reviewed screening state', () => {
  assert.deepEqual(requireScreened('unassigned'), { ok: false, reason: 'source-record-must-be-reviewed-before-PICO-attachment' });
  assert.deepEqual(requireScreened('reviewed'), { ok: true });
});

test('reference verification gate separates validated from validation-required', () => {
  assert.deepEqual(requireReferenceVerification('VALIDATION_REQUIRED', false), { ok: false, reason: 'reference-verification-required' });
  assert.deepEqual(requireReferenceVerification('VALIDATED', true), { ok: true });
});

test('unsupported certification claims are rejected', () => {
  assert.equal(requireNoFalseClaim('detected').ok, true);
  assert.equal(requireNoFalseClaim('signal').ok, true);
  assert.equal(requireNoFalseClaim('verified').ok, false);
  assert.equal(requireNoFalseClaim('certified').ok, false);
});
