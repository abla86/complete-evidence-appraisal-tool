import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createHubSnapshot,
  createReferenceRecord,
  detectDuplicateCandidates,
  markReferenceVerified,
  updateReferenceRecord,
} from '../src/services/referenceHubService.ts';

describe('Unified Reference Hub', () => {
  it('creates one canonical reference record and keeps it unverified by default', () => {
    const record = createReferenceRecord({
      id: 'ref-1',
      kind: 'JOURNAL_ARTICLE',
      authors: 'Hansen, Kari',
      year: 2026,
      title: 'Evidence workflow',
      journal: 'Research Journal',
      doi: '10.1234/example.2026',
    });

    assert.equal(record.verification, 'VALIDATION_REQUIRED');
    assert.deepEqual(record.importedFrom, ['MANUAL']);
    assert.deepEqual(record.attachments, []);
    assert.deepEqual(record.annotations, []);
  });

  it('detects DOI duplicates without deleting records', () => {
    const a = createReferenceRecord({
      id: 'ref-a',
      kind: 'JOURNAL_ARTICLE',
      authors: 'A',
      year: 2026,
      title: 'Same paper',
      journal: 'Journal',
      doi: '10.1234/ABC.1',
    });
    const b = createReferenceRecord({
      id: 'ref-b',
      kind: 'JOURNAL_ARTICLE',
      authors: 'A',
      year: 2026,
      title: 'Same paper duplicate',
      journal: 'Journal',
      doi: 'https://doi.org/10.1234/ABC.1',
    });

    const snapshot = createHubSnapshot([a, b]);
    assert.equal(snapshot.records.length, 2);
    assert.deepEqual(snapshot.duplicateCandidates, [
      { recordId: 'ref-a', candidateId: 'ref-b', reason: 'DOI', confidence: 1 },
    ]);
  });

  it('explicit verification is the only path to VALIDATED', () => {
    const record = createReferenceRecord({
      id: 'ref-v',
      kind: 'JOURNAL_ARTICLE',
      authors: 'Hansen, Kari',
      year: 2026,
      title: 'Verified paper',
      journal: 'Research Journal',
      doi: '10.1234/example.2026',
    });

    assert.equal(record.verification, 'VALIDATION_REQUIRED');
    const updated = markReferenceVerified(record, 'reviewer-1', '2026-09-02T18:00:00.000Z');
    assert.equal(updated.verification, 'VALIDATED');
    assert.equal(updated.verifiedBy, 'reviewer-1');
  });

  it('editing a reference re-runs structural validation', () => {
    const record = createReferenceRecord({
      id: 'ref-edit',
      kind: 'JOURNAL_ARTICLE',
      authors: 'Hansen, Kari',
      year: 2026,
      title: 'Editable paper',
      journal: 'Research Journal',
      doi: '10.1234/example.2026',
    });

    const invalid = updateReferenceRecord(record, { doi: 'not-a-doi' });
    assert.equal(invalid.verification, 'INVALID');
  });

  it('duplicate detector is a pure comparison function', () => {
    const records = [
      createReferenceRecord({ id: 'one', kind: 'BOOK', authors: 'A', year: 2026, title: 'Book A', publisher: 'P' }),
      createReferenceRecord({ id: 'two', kind: 'BOOK', authors: 'A', year: 2026, title: 'Book A', publisher: 'P' }),
    ];
    assert.equal(detectDuplicateCandidates(records).length, 1);
  });
});
