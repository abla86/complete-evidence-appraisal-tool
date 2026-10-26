import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotService } from '../src/services/snapshotService';
import { MASTER_INSTRUMENTS_REGISTRY } from '../src/data/masterRegistry';

test('snapshot fingerprint is a real SHA-256 digest and changes with assessment content', async () => {
  const instrument = MASTER_INSTRUMENTS_REGISTRY[0];
  assert.ok(instrument, 'test requires at least one registered instrument');

  const base = {
    id: 'test-study',
    doi: '10.0000/example',
    title: 'Example study',
    design: 'RCT',
    documentHash: 'doc-hash',
    items: [{ questionId: 1, answer: 'Yes', rationale: 'Supported by page 4' }],
  };

  const first = await SnapshotService.generateLockHash(base, instrument);
  const same = await SnapshotService.generateLockHash(base, instrument);
  const changed = await SnapshotService.generateLockHash({
    ...base,
    items: [{ questionId: 1, answer: 'No', rationale: 'Different assessment' }],
  }, instrument);

  assert.match(first, /^SHA256:[0-9a-f]{64}$/);
  assert.equal(first, same, 'same canonical input must produce the same fingerprint');
  assert.notEqual(first, changed, 'changed answers must change the fingerprint');
});
