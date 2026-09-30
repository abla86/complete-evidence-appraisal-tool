import type { ReferenceRecord } from './referenceHubService';

const STORAGE_KEY = 'evidence-appraisal-reference-hub-v1';
const QUARANTINE_KEY = 'evidence-appraisal-reference-hub-quarantine-v1';
const VALID_VERIFICATION_STATES = new Set(['DETECTED', 'VALIDATION_REQUIRED', 'VALIDATED', 'RETRACTED', 'INVALID']);

export interface ReferenceLibrarySnapshot {
  schemaVersion: 1;
  updatedAt: string;
  records: ReferenceRecord[];
}

export interface ReferenceLibraryQuarantine {
  schemaVersion: 1;
  quarantinedAt: string;
  records: unknown[];
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function validateStoredReferenceRecord(value: unknown): value is ReferenceRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<ReferenceRecord>;
  if (typeof record.id !== 'string' || !record.id.trim()) return false;
  if (!Array.isArray(record.importedFrom) || !Array.isArray(record.tags) || !Array.isArray(record.collections)) return false;
  if (!Array.isArray(record.attachments) || !Array.isArray(record.annotations)) return false;
  if (!VALID_VERIFICATION_STATES.has(String(record.verification))) return false;
  if (!isIsoDate(record.createdAt) || !isIsoDate(record.updatedAt)) return false;
  if (record.sourceRecordIds !== undefined && !Array.isArray(record.sourceRecordIds)) return false;
  if (record.articleIds !== undefined && !Array.isArray(record.articleIds)) return false;
  return true;
}

function normalizeStoredReferenceRecord(record: ReferenceRecord): ReferenceRecord {
  return {
    ...record,
    sourceRecordIds: Array.isArray(record.sourceRecordIds) ? [...new Set(record.sourceRecordIds.filter(id => typeof id === 'string'))] : [],
    articleIds: Array.isArray(record.articleIds) ? [...new Set(record.articleIds.filter(id => typeof id === 'string'))] : [],
    importedFrom: [...new Set(record.importedFrom)],
    tags: [...new Set(record.tags)],
    collections: [...new Set(record.collections)],
    attachments: Array.isArray(record.attachments) ? record.attachments : [],
    annotations: Array.isArray(record.annotations) ? record.annotations : [],
  };
}

function quarantineInvalidRecords(records: unknown[]): void {
  if (typeof localStorage === 'undefined' || records.length === 0) return;
  const snapshot: ReferenceLibraryQuarantine = { schemaVersion: 1, quarantinedAt: new Date().toISOString(), records };
  try { localStorage.setItem(QUARANTINE_KEY, JSON.stringify(snapshot)); } catch { /* storage quota must not block valid records */ }
}

export function loadReferenceLibrary(fallback: ReferenceRecord[] = []): ReferenceRecord[] {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ReferenceLibrarySnapshot>;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.records)) return fallback;
    const valid: ReferenceRecord[] = [];
    const invalid: unknown[] = [];
    for (const record of parsed.records) {
      if (validateStoredReferenceRecord(record)) valid.push(normalizeStoredReferenceRecord(record));
      else invalid.push(record);
    }
    quarantineInvalidRecords(invalid);
    return valid;
  } catch {
    return fallback;
  }
}

export function saveReferenceLibrary(records: ReferenceRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  const snapshot: ReferenceLibrarySnapshot = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    records: records.map(normalizeStoredReferenceRecord),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearReferenceLibrary(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}


