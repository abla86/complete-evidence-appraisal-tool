import { strict as assert } from 'node:assert';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createReferenceRecord } from '../src/services/referenceHubService';

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'reference-hub-'));
process.env.REFERENCE_HUB_DATA_DIR = tempRoot;

const { loadReferenceHub, saveReferenceHub } = await import('../src/services/referenceHubServerStore');

try {
  const record = createReferenceRecord({
    id: 'ref-server-test',
    kind: 'JOURNAL_ARTICLE',
    title: 'Server persisted reference',
    authors: 'Test Author',
    year: 2026,
    importedFrom: ['MANUAL'],
  });

  const saved = await saveReferenceHub('user-1', [record]);
  assert.equal(saved.length, 1);

  const restored = await loadReferenceHub('user-1');
  assert.equal(restored.length, 1);
  assert.equal(restored[0].id, record.id);
  assert.deepEqual(restored[0].sourceRecordIds, []);
  assert.deepEqual(restored[0].articleIds, []);

  await saveReferenceHub('user-1', [record, { ...record, id: 'ref-invalid', title: '' }]);
  const deduplicated = await loadReferenceHub('user-1');
  assert.equal(deduplicated.length, 2);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
