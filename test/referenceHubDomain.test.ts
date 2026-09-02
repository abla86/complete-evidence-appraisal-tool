import assert from 'node:assert/strict';
import test from 'node:test';
import { type ReferenceRecord } from '../src/domain/referenceHub';
import { loadReferenceLibrary, saveReferenceLibrary } from '../src/services/referenceLibraryStore';

test('canonical ReferenceRecord supports research identifiers and integrity metadata', () => {
  const record: ReferenceRecord = {
    id: 'r1',
    type: 'JOURNAL_ARTICLE',
    title: 'Example',
    authors: ['Doe, J.'],
    year: 2025,
    doi: '10.1234/example',
    pmid: '12345678',
    pmcid: 'PMC123456',
    isbn: undefined,
    issn: '1234-5678',
    tags: [],
    collections: [],
    sourceSystems: ['pubmed'],
    status: 'VALIDATION_REQUIRED',
    retraction: { detected: false, source: 'not-checked', checkedAt: new Date().toISOString() },
    attachments: [],
    annotations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(record.pmid, '12345678');
  assert.equal(record.pmcid, 'PMC123456');
  assert.equal(record.status, 'VALIDATION_REQUIRED');
});

test('reference library loader safely falls back when browser storage is unavailable', () => {
  assert.deepEqual(loadReferenceLibrary([]), []);
  assert.doesNotThrow(() => saveReferenceLibrary([]));
});
