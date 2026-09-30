import assert from 'node:assert/strict';
import test from 'node:test';
import { type ReferenceRecord } from '../src/domain/referenceHub';
import { loadReferenceLibrary, saveReferenceLibrary } from '../src/services/referenceLibraryStore';
import { createReferenceRecord } from '../src/services/referenceHubService';

test('canonical ReferenceRecord supports research identifiers and integrity metadata', () => {
  const record: ReferenceRecord = {
    id: 'r1',
    title: 'Example',
    authors: 'Doe, J.',
    year: 2025,
    doi: '10.1234/example',
    pmid: '12345678',
    pmcid: 'PMC123456',
    isbn: undefined,
    issn: '1234-5678',
    tags: [],
    collections: [],
    importedFrom: ['MANUAL'],
    verification: 'VALIDATION_REQUIRED',
    retraction: { detected: false, source: 'not-checked', checkedAt: new Date().toISOString() },
    attachments: [],
    annotations: [],
    articleIds: [],
    sourceRecordIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(record.pmid, '12345678');
  assert.equal(record.pmcid, 'PMC123456');
  assert.equal(record.verification, 'VALIDATION_REQUIRED');
  assert.deepEqual(record.articleIds, []);
});

test('reference library loader safely falls back when browser storage is unavailable', () => {
  assert.deepEqual(loadReferenceLibrary([]), []);
  assert.doesNotThrow(() => saveReferenceLibrary([]));
});


test('reference records use an independent identity from article records', () => {
  const record = createReferenceRecord({
    id: 'ref-1',
    kind: 'JOURNAL_ARTICLE',
    title: 'Example',
    authors: 'Doe, J.',
    year: 2025,
    articleIds: ['art-1'],
  });
  assert.notEqual(record.id, record.articleIds?.[0]);
  assert.deepEqual(record.articleIds, ['art-1']);
});


test('reference library rejects malformed persisted records without discarding valid records', () => {
  const store = new Map<string, string>();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    key: () => null,
    get length() { return store.size; },
  } as Storage;
  try {
    const valid = { id: 'ref-valid', importedFrom: ['MANUAL'], tags: [], collections: [], attachments: [], annotations: [], verification: 'DETECTED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store.set('evidence-appraisal-reference-hub-v1', JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), records: [valid, { id: '' }] }));
    assert.equal(loadReferenceLibrary([]).length, 1);
    assert.ok(store.has('evidence-appraisal-reference-hub-quarantine-v1'));
  } finally {
    globalThis.localStorage = previous;
  }
});
