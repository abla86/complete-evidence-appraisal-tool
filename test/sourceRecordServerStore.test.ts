import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRecordId } from '../src/domain/sourceRecord';

function fixture() {
  return {
    schemaVersion: '1.0.0',
    recordId: createRecordId(),
    source: { url: 'https://example.test/article', capturedAt: new Date().toISOString() },
    metadata: { status: 'COMPLETE', missingFields: [], fields: { title: 'Test article' } },
    identifiers: { doi: null },
    referenceDraft: { apa7: null, status: 'incomplete', note: 'Draft – detected metadata, not verified against source' },
    legalReference: null,
    privacy: { localOnly: true, piiDetected: false, sensitiveDataDetected: false, recommendations: [] },
    provenance: { tool: 'test', toolVersion: '1', collectedLocally: true, externalRequestsMade: false, collectedAt: new Date().toISOString() },
  };
}

test('SourceRecord server store isolates users and preserves validated records', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'source-record-store-'));
  process.env.SOURCE_RECORD_DATA_DIR = root;
  const { loadSourceRecords, saveSourceRecords } = await import('../src/services/sourceRecordServerStore');
  const record = fixture();
  await saveSourceRecords('user-a', [record]);
  assert.equal((await loadSourceRecords('user-a')).length, 1);
  assert.equal((await loadSourceRecords('user-b')).length, 0);
  const files = await import('node:fs/promises').then(fs => fs.readdir(root));
  assert.equal(files.length, 1);
  const raw = await readFile(path.join(root, files[0]), 'utf8');
  assert.match(raw, /schemaVersion/);
});
