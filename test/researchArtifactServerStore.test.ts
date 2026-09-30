import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createReferenceRecord } from '../src/services/referenceHubService';
import { createRecordId } from '../src/domain/sourceRecord';

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'research-artifacts-'));
process.env.RESEARCH_ARTIFACTS_DATA_DIR = tempRoot;

const { saveResearchArtifacts, loadResearchArtifacts } = await import('../src/services/researchArtifactServerStore');

try {
  const source = {
    schemaVersion: '1.0.0' as const,
    recordId: createRecordId(),
    source: { url: 'https://example.org/article', capturedAt: new Date().toISOString() },
    metadata: { title: 'Test', authors: ['Author'], publicationDate: '2026-01-01', journal: 'Journal', status: 'COMPLETE' as const, missingFields: [] },
    identifiers: { doi: null },
    referenceDraft: { apa7: 'Author (2026). Test.', status: 'complete' as const, note: 'Draft – detected metadata, not verified against source' as const },
    legalReference: null,
    privacy: { localOnly: true, analyzedAt: new Date().toISOString(), sourceUrl: 'https://example.org/article', externalResourceCount: 0, externalHosts: [], trackingIndicatorCount: 0, trackingHosts: [], signals: [] },
    provenance: { tool: 'test', toolVersion: '1', collectedLocally: false, externalRequestsMade: true, collectedAt: new Date().toISOString() },
  };

  const reference = createReferenceRecord({
    id: 'ref-search-test',
    kind: 'JOURNAL_ARTICLE',
    title: 'Test',
    authors: 'Author',
    importedFrom: ['MANUAL'],
  });
  const search = {
    id: 'search-1',
    database: 'TestDB',
    query: 'test',
    dateSearched: new Date().toISOString(),
    filters: {},
    resultsCount: 1,
    selectedCount: 1,
    results: [],
  };

  await saveResearchArtifacts('user-1', { searchRecords: [search], sourceRecords: [source] });
  const restored = await loadResearchArtifacts('user-1');
  assert.equal(restored.searchRecords.length, 1);
  assert.equal(restored.sourceRecords[0].recordId, source.recordId);
  assert.equal(restored.sourceRecords[0].provenance.externalRequestsMade, true);
  void reference;
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
