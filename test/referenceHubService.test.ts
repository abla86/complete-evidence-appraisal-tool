import { describe, expect, test } from 'vitest';
import {
  createHubSnapshot,
  createReferenceRecord,
  detectDuplicateCandidates,
  markReferenceVerified,
  updateReferenceRecord,
} from '../src/services/referenceHubService';

describe('Unified Reference Hub', () => {
  test('creates one canonical reference record and keeps it unverified by default', () => {
    const record = createReferenceRecord({
      id: 'ref-1',
      kind: 'JOURNAL_ARTICLE',
      authors: 'Hansen, Kari',
      year: 2026,
      title: 'Evidence workflow',
      journal: 'Research Journal',
      doi: '10.1234/example.2026',
    });

    expect(record.verification).toBe('VALIDATION_REQUIRED');
    expect(record.importedFrom).toEqual(['MANUAL']);
    expect(record.attachments).toEqual([]);
    expect(record.annotations).toEqual([]);
  });

  test('detects DOI duplicates without deleting records', () => {
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
    expect(snapshot.records).toHaveLength(2);
    expect(snapshot.duplicateCandidates).toEqual([
      { recordId: 'ref-a', candidateId: 'ref-b', reason: 'DOI', confidence: 1 },
    ]);
  });

  test('explicit verification is the only path to VALIDATED', () => {
    const record = createReferenceRecord({
      id: 'ref-v',
      kind: 'JOURNAL_ARTICLE',
      authors: 'Hansen, Kari',
      year: 2026,
      title: 'Verified paper',
      journal: 'Research Journal',
      doi: '10.1234/example.2026',
    });

    expect(record.verification).toBe('VALIDATION_REQUIRED');
    const updated = markReferenceVerified(record, 'reviewer-1', '2026-09-02T18:00:00.000Z');
    expect(updated.verification).toBe('VALIDATED');
    expect(updated.verifiedBy).toBe('reviewer-1');
  });

  test('editing a reference re-runs structural validation', () => {
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
    expect(invalid.verification).toBe('INVALID');
  });

  test('duplicate detector is a pure comparison function', () => {
    const records = [
      createReferenceRecord({ id: 'one', kind: 'BOOK', authors: 'A', year: 2026, title: 'Book A', publisher: 'P' }),
      createReferenceRecord({ id: 'two', kind: 'BOOK', authors: 'A', year: 2026, title: 'Book A', publisher: 'P' }),
    ];
    expect(detectDuplicateCandidates(records)).toHaveLength(1);
  });
});
