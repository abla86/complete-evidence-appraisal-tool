import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSourceRecord } from '../src/services/validateSourceRecord';
import { SOURCE_RECORD_SCHEMA_VERSION } from '../src/domain/sourceRecord';

function validRecord() {
  return {
    schemaVersion: SOURCE_RECORD_SCHEMA_VERSION,
    recordId: '00000000-0000-4000-8000-000000000001',
    source: { url: 'https://example.org', capturedAt: '2026-09-02T18:00:00.000Z' },
    metadata: {
      sourceUrl: 'https://example.org',
      detectedAt: '2026-09-02T18:00:00.000Z',
      detectedFrom: ['citation-meta'],
      status: 'COMPLETE',
      missingFields: [],
      title: 'Example',
      authors: ['Doe, J.'],
      journal: 'Example Journal'
    },
    identifiers: { doi: null },
    referenceDraft: {
      apa7: 'Doe, J. (2025). Example. Example Journal.',
      status: 'complete',
      note: 'Draft – detected metadata, not verified against source'
    },
    legalReference: null,
    privacy: {
      sourceUrl: 'https://example.org',
      analyzedAt: '2026-09-02T18:00:00.000Z',
      externalResourceCount: 0,
      externalHosts: [],
      trackingIndicatorCount: 0,
      trackingHosts: [],
      signals: [],
      localOnlyAnalysis: true,
      localOnly: true
    },
    provenance: {
      tool: 'research-privacy-inspector',
      toolVersion: '0.3.0',
      collectedLocally: true,
      externalRequestsMade: false,
      collectedAt: '2026-09-02T18:00:00.000Z'
    }
  };
}

test('accepts a valid SourceRecord', () => {
  const result = validateSourceRecord(validRecord());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('rejects unknown schema version', () => {
  const record = validRecord();
  record.schemaVersion = '9.9.9';
  const result = validateSourceRecord(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('schemaVersion')));
});

test('rejects verified privacy state at intake', () => {
  const record = validRecord();
  record.privacy.localOnly = false;
  const result = validateSourceRecord(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('localOnly')));
});

test('rejects verified-reference note removal', () => {
  const record = validRecord();
  record.referenceDraft.note = 'Verified';
  const result = validateSourceRecord(record);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.includes('referenceDraft.note')));
});
