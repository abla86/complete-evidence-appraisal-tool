import assert from 'node:assert/strict';
import test from 'node:test';
import { createApa7JournalReference, createNorwegianLawReference } from '../src/services/sharedReferenceEngine.ts';
import { createReferenceRecord, markReferenceVerified } from '../src/services/referenceHubService.ts';

test('shared APA adapter produces a draft but never a false verification', () => {
  const result = createApa7JournalReference({
    authors: 'Hansen, K., & Olsen, P. A.',
    year: 2023,
    title: 'Effekt av tiltak X',
    journal: 'Norsk Tidsskrift for Forskning',
    volume: 12,
    issue: 3,
    pages: '45–58',
    doi: '10.1000/abc.123'
  });

  assert.equal(result.status, 'VALIDATION_REQUIRED');
  assert.equal(result.verified, false);
  assert.equal(result.draft, result.reference);
  assert.match(result.reference, /https:\/\/doi\.org\/10\.1000\/abc\.123$/);
});

test('shared Norwegian law adapter keeps legal source distinct', () => {
  const result = createNorwegianLawReference({
    shortTitle: 'Helsepersonelloven',
    year: 1999,
    officialTitle: 'Lov om helsepersonell m.v.',
    dateCode: 'LOV-1999-07-02-64',
    websiteName: 'Lovdata',
    url: 'https://lovdata.no/lov/1999-07-02-64'
  });

  assert.equal(result.status, 'VALIDATION_REQUIRED');
  assert.equal(result.verified, false);
  assert.equal(result.inTextParenthetical, '(Helsepersonelloven, 1999)');
});

test('explicit verification is required before status can become VALIDATED', () => {
  const draft = createReferenceRecord({
    id: 'reference-verification-test',
    kind: 'JOURNAL_ARTICLE',
    authors: 'Hansen, K.',
    year: 2023,
    title: 'Effekt av tiltak X',
    journal: 'Norsk Tidsskrift for Forskning',
    doi: '10.1000/abc.123',
    importedFrom: ['MANUAL'],
  });

  assert.notEqual(draft.verification, 'VALIDATED');

  const verified = markReferenceVerified(
    draft,
    'researcher@example.invalid',
    '2026-09-02T18:00:00.000Z',
  );

  assert.equal(verified.verification, 'VALIDATED');
  assert.equal(verified.verifiedBy, 'researcher@example.invalid');
  assert.equal(verified.verifiedAt, '2026-09-02T18:00:00.000Z');
});
