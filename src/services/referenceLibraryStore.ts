import type { ReferenceRecord } from './referenceHubService';

const STORAGE_KEY = 'evidence-appraisal-reference-hub-v1';

const LOCAL_RESEARCH_PERSISTENCE_ENABLED =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_ENABLE_LOCAL_RESEARCH_PERSISTENCE === 'true';

export interface ReferenceLibrarySnapshot {
  schemaVersion: 1;
  updatedAt: string;
  records: ReferenceRecord[];
}

export function loadReferenceLibrary(fallback: ReferenceRecord[] = []): ReferenceRecord[] {
  if (typeof localStorage === 'undefined' || !LOCAL_RESEARCH_PERSISTENCE_ENABLED) return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ReferenceLibrarySnapshot>;
    return Array.isArray(parsed.records) ? parsed.records : fallback;
  } catch {
    return fallback;
  }
}

export function saveReferenceLibrary(records: ReferenceRecord[]): void {
  if (typeof localStorage === 'undefined' || !LOCAL_RESEARCH_PERSISTENCE_ENABLED) return;
  const snapshot: ReferenceLibrarySnapshot = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    records,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearReferenceLibrary(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}


