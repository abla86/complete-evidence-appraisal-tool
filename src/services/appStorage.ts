/**
 * Single definition of which browser-storage keys belong to this application.
 * The offline edition runs from file://, where every local HTML file may share one
 * storage origin, so we never touch keys outside these prefixes.
 */
const APP_KEY_PREFIXES = [
  'evidence_appraisal',
  'evidence-appraisal',
  'complete-evidence-appraisal-tool',
  'evidence-suite',
  'jbi_research_group_workspace',
] as const;

/** Licence keys are personal entitlements and are excluded from workspace backups. */
export const LICENSE_STORAGE_KEY = 'evidence-appraisal-license-v1';

export function isAppStorageKey(key: string): boolean {
  return APP_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
}

function storage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function listAppStorageKeys(): string[] {
  const store = storage();
  if (!store) return [];
  const keys: string[] = [];
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key && isAppStorageKey(key) && key !== LICENSE_STORAGE_KEY) keys.push(key);
  }
  return keys.sort();
}

export function readAppStorage(): Record<string, string> {
  const store = storage();
  const out: Record<string, string> = {};
  if (!store) return out;
  for (const key of listAppStorageKeys()) {
    const value = store.getItem(key);
    if (value !== null) out[key] = value;
  }
  return out;
}

/** Removes all workspace data for this app only (the licence key is kept unless requested). */
export function clearAppStorage(options: { includeLicense?: boolean } = {}): void {
  const store = storage();
  if (!store) return;
  for (const key of listAppStorageKeys()) store.removeItem(key);
  if (options.includeLicense) store.removeItem(LICENSE_STORAGE_KEY);
  try { sessionStorage.clear(); } catch { /* sessionStorage may be unavailable */ }
}
