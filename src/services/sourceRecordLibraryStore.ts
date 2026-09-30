import type { SourceRecord } from '../domain/sourceRecord';
import { validateSourceRecord } from './validateSourceRecord';

const STORAGE_KEY = 'evidence-appraisal-source-records-v1';

export function loadSourceRecordLibrary(): SourceRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is SourceRecord => validateSourceRecord(item).ok);
  } catch {
    return [];
  }
}

export function upsertSourceRecord(record: SourceRecord): SourceRecord[] {
  const validation = validateSourceRecord(record);
  if (!validation.ok) throw new Error(`Invalid SourceRecord: ${validation.errors.join('; ')}`);
  const current = loadSourceRecordLibrary();
  const next = [record, ...current.filter(item => item.recordId !== record.recordId)];
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
