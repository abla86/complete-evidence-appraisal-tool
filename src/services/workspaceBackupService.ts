import JSZip from 'jszip';
import { isAppStorageKey, LICENSE_STORAGE_KEY } from './appStorage';

/**
 * Workspace backup as a .zip: lets a user download all local data (articles, appraisals,
 * references, audit log, source records) and upload it again on another device or browser.
 * Every entry carries a SHA-256 checksum that is verified on import.
 */

export const BACKUP_FORMAT = 'evidence-appraisal-workspace-backup';
export const BACKUP_FORMAT_VERSION = 1;
const MAX_BACKUP_BYTES = 200 * 1024 * 1024;

export interface BackupManifest {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  createdAt: string;
  appVersion: string;
  entries: Array<{ key: string; file: string; sha256: string; bytes: number }>;
}

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Nettleseren mangler Web Crypto og kan ikke kontrollere sikkerhetskopien.');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

const fileNameForKey = (key: string, index: number) => `data/${String(index).padStart(3, '0')}-${key.replace(/[^a-zA-Z0-9._-]/g, '_')}.json`;

export async function createWorkspaceBackup(data: Record<string, string>, appVersion: string): Promise<Uint8Array> {
  const zip = new JSZip();
  const keys = Object.keys(data).filter(key => isAppStorageKey(key) && key !== LICENSE_STORAGE_KEY).sort();
  const entries: BackupManifest['entries'] = [];
  for (const [index, key] of keys.entries()) {
    const value = data[key];
    const file = fileNameForKey(key, index);
    zip.file(file, value);
    entries.push({ key, file, sha256: await sha256Hex(value), bytes: new TextEncoder().encode(value).byteLength });
  }
  const manifest: BackupManifest = { format: BACKUP_FORMAT, formatVersion: BACKUP_FORMAT_VERSION, createdAt: new Date().toISOString(), appVersion, entries };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('LES-MEG.txt', 'Sikkerhetskopi fra Evidence Appraisal Tool.\nLast den opp igjen via «Sikkerhetskopi (zip)» i appen. Filen kan inneholde forskningsdata og personopplysninger du har registrert: oppbevar den sikkert.\n');
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function readWorkspaceBackup(bytes: ArrayBuffer | Uint8Array): Promise<{ manifest: BackupManifest; data: Record<string, string> }> {
  const size = bytes instanceof Uint8Array ? bytes.byteLength : bytes.byteLength;
  if (size > MAX_BACKUP_BYTES) throw new Error('Sikkerhetskopien er for stor.');
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error('Filen er ikke en gyldig zip-fil.'); }
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Zip-filen mangler manifest.json og er ikke en sikkerhetskopi fra dette verktøyet.');
  let manifest: BackupManifest;
  try { manifest = JSON.parse(await manifestFile.async('string')) as BackupManifest; } catch { throw new Error('manifest.json kan ikke leses.'); }
  if (manifest.format !== BACKUP_FORMAT || !Array.isArray(manifest.entries)) throw new Error('Ukjent sikkerhetskopiformat.');
  if (manifest.formatVersion > BACKUP_FORMAT_VERSION) throw new Error('Sikkerhetskopien er laget av en nyere versjon. Oppdater appen først.');
  const data: Record<string, string> = {};
  for (const entry of manifest.entries) {
    if (typeof entry?.key !== 'string' || !isAppStorageKey(entry.key) || entry.key === LICENSE_STORAGE_KEY) throw new Error(`Ugyldig datanøkkel i sikkerhetskopien: ${String(entry?.key)}`);
    const file = zip.file(entry.file);
    if (!file) throw new Error(`Mangler fil i sikkerhetskopien: ${entry.file}`);
    const value = await file.async('string');
    if (await sha256Hex(value) !== entry.sha256) throw new Error(`Kontrollsum stemmer ikke for ${entry.key}. Filen kan være skadet eller endret.`);
    try { JSON.parse(value); } catch { throw new Error(`Innholdet for ${entry.key} er ikke gyldig JSON.`); }
    data[entry.key] = value;
  }
  return { manifest, data };
}

/** Replaces the workspace with the backup contents (app keys only; the licence is left untouched). */
export function restoreWorkspaceBackup(data: Record<string, string>, store: Storage, existingKeys: string[]): void {
  for (const key of existingKeys) if (isAppStorageKey(key) && key !== LICENSE_STORAGE_KEY) store.removeItem(key);
  for (const [key, value] of Object.entries(data)) {
    if (!isAppStorageKey(key) || key === LICENSE_STORAGE_KEY) continue;
    store.setItem(key, value);
  }
}
