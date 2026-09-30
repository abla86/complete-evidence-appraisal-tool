import type { SearchQueryRecord } from './evidenceIntelligenceService';

const STORAGE_KEY = 'evidence-appraisal-search-records-v1';

export function loadSearchQueryRecords(): SearchQueryRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as SearchQueryRecord[] : [];
  } catch {
    return [];
  }
}

export function saveSearchQueryRecord(record: SearchQueryRecord): SearchQueryRecord[] {
  const current = loadSearchQueryRecords();
  const next = [record, ...current.filter(item => item.id !== record.id)].slice(0, 200);
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
