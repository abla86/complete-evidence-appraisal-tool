import test from 'node:test';
import assert from 'node:assert/strict';
import { createReferenceRecord } from './referenceHubService';
import { resolveReferenceForSource } from './evidenceIdentityService';

test('explicit SourceRecord linkage resolves without stable identifier', () => {
  const reference = createReferenceRecord({ id: 'reference-1', title: 'Example', authors: 'Example A', year: 2026, sourceRecordIds: ['source-9'] });
  assert.equal(resolveReferenceForSource({ recordId: 'source-9' }, [reference])?.id, 'reference-1');
});

test('equal reference and SourceRecord IDs are not an implicit link', () => {
  const reference = createReferenceRecord({ id: 'same-id', title: 'Example', authors: 'Example A', year: 2026 });
  assert.equal(resolveReferenceForSource({ recordId: 'same-id' }, [reference]), null);
});

test('DOI remains a stable identity match', () => {
  const reference = createReferenceRecord({ id: 'reference-2', title: 'Example DOI', authors: 'Example B', year: 2026, doi: '10.1234/example' });
  assert.equal(resolveReferenceForSource({ recordId: 'source-10', identifiers: { doi: 'https://doi.org/10.1234/example' } }, [reference])?.id, 'reference-2');
});


