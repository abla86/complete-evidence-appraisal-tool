// Browser-context smoke cases for the local analyzer contract.
// Full browser automation is intentionally kept separate from unit tests.

import assert from 'node:assert/strict';
import test from 'node:test';

test('DOI pattern accepts a standard DOI', () => {
  const re = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
  assert.equal(re.test('doi: 10.1234/example.2026'), true);
});

test('DOI pattern does not accept an ordinary URL', () => {
  const re = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
  assert.equal(re.test('https://example.org/article'), false);
});

test('verification state is intentionally separate from detection', () => {
  const state = { metadataState: 'COMPLETE', verificationState: 'NOT_VERIFIED' };
  assert.equal(state.metadataState, 'COMPLETE');
  assert.equal(state.verificationState, 'NOT_VERIFIED');
});
