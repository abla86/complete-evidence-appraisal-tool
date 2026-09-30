import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSourceRecord } from '../src/services/buildSourceRecord';

test('search-imported SourceRecord records external retrieval provenance', () => {
  const sourceUrl = 'https://doi.org/10.1234/example';
  const record = buildSourceRecord({
    meta: {
      sourceUrl,
      title: 'Example',
      authors: ['Doe, J.'],
      publicationDate: '2025-01-01',
      journal: 'Example Journal',
      doi: '10.1234/example',
      detectedAt: new Date().toISOString(),
      detectedFrom: ['manual'],
    },
    privacyResult: {
      sourceUrl,
      analyzedAt: new Date().toISOString(),
      externalResourceCount: 0,
      externalHosts: [],
      trackingIndicatorCount: 0,
      trackingHosts: [],
      signals: [],
      localOnlyAnalysis: true,
      localOnly: true,
    },
    lawText: null,
    toolVersion: 'research-search',
    externalRequestsMade: true,
  });

  assert.equal(record.provenance.externalRequestsMade, true);
  assert.equal(record.provenance.collectedLocally, false);
  assert.equal(record.provenance.tool, 'source-record-gateway');
});
