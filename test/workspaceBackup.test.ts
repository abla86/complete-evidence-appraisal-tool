import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { createWorkspaceBackup, readWorkspaceBackup, restoreWorkspaceBackup } from '../src/services/workspaceBackupService';
import { isAppStorageKey, LICENSE_STORAGE_KEY } from '../src/services/appStorage';

const data = {
  evidence_appraisal_articles_vault_v2: JSON.stringify([{ id: 'art-1', title: 'Øverhaug – kvalitativ studie' }]),
  'evidence-appraisal-appraisal-sessions-v1': JSON.stringify([{ id: 's1', locked: true }]),
  [LICENSE_STORAGE_KEY]: 'EAT1.secret.licence',
  'some-other-app': '"not ours"',
};

class MemoryStorage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

test('backup zip round-trips app data and excludes the licence and foreign keys', async () => {
  const bytes = await createWorkspaceBackup(data, '1.0.0');
  const { manifest, data: restored } = await readWorkspaceBackup(bytes);
  assert.equal(manifest.entries.length, 2);
  assert.deepEqual(Object.keys(restored).sort(), ['evidence-appraisal-appraisal-sessions-v1', 'evidence_appraisal_articles_vault_v2']);
  assert.equal(restored.evidence_appraisal_articles_vault_v2, data.evidence_appraisal_articles_vault_v2);
});

test('a modified entry is detected by its SHA-256 checksum', async () => {
  const zip = await JSZip.loadAsync(await createWorkspaceBackup(data, '1.0.0'));
  const file = Object.keys(zip.files).find(name => name.startsWith('data/') && !zip.files[name].dir)!;
  zip.file(file, '[]');
  await assert.rejects(readWorkspaceBackup(await zip.generateAsync({ type: 'uint8array' })), /Kontrollsum/);
});

test('a zip without manifest or with foreign keys is refused', async () => {
  const empty = new JSZip(); empty.file('x.txt', 'hei');
  await assert.rejects(readWorkspaceBackup(await empty.generateAsync({ type: 'uint8array' })), /manifest/);
  const evil = new JSZip();
  evil.file('manifest.json', JSON.stringify({ format: 'evidence-appraisal-workspace-backup', formatVersion: 1, createdAt: '', appVersion: '', entries: [{ key: LICENSE_STORAGE_KEY, file: 'a', sha256: '', bytes: 0 }] }));
  await assert.rejects(readWorkspaceBackup(await evil.generateAsync({ type: 'uint8array' })), /Ugyldig datanøkkel/);
  await assert.rejects(readWorkspaceBackup(new Uint8Array([1, 2, 3])), /zip/);
});

test('restore replaces only app data and keeps the licence and other apps untouched', () => {
  const store = new MemoryStorage();
  store.setItem('evidence_appraisal_old_v1', 'old');
  store.setItem(LICENSE_STORAGE_KEY, 'licence');
  store.setItem('some-other-app', 'x');
  restoreWorkspaceBackup({ 'evidence-appraisal-reference-hub-v1': '[]' }, store as unknown as Storage, ['evidence_appraisal_old_v1', LICENSE_STORAGE_KEY, 'some-other-app']);
  assert.equal(store.getItem('evidence_appraisal_old_v1'), null);
  assert.equal(store.getItem('evidence-appraisal-reference-hub-v1'), '[]');
  assert.equal(store.getItem(LICENSE_STORAGE_KEY), 'licence');
  assert.equal(store.getItem('some-other-app'), 'x');
  assert.equal(isAppStorageKey('some-other-app'), false);
});
