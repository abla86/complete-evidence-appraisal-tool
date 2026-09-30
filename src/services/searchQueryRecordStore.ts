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

export function updateSearchQuerySelection(recordId: string, selectedCount: number): SearchQueryRecord[] {
  const current = loadSearchQueryRecords();
  const next = current.map(record => record.id === recordId ? { ...record, selectedCount: Math.max(0, selectedCount) } : record);
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function saveSearchQueryRecord(record: SearchQueryRecord): SearchQueryRecord[] {
  const current = loadSearchQueryRecords();
  const next = [record, ...current.filter(item => item.id !== record.id)].slice(0, 200);
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
