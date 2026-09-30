import type { SearchQueryRecord } from './evidenceIntelligenceService';
import type { SourceRecord } from '../domain/sourceRecord';
import { loadSearchQueryRecords } from './searchQueryRecordStore';
import { loadSourceRecordLibrary } from './sourceRecordLibraryStore';

export async function loadResearchArtifactsFromServer(): Promise<{ searchRecords: SearchQueryRecord[]; sourceRecords: SourceRecord[] } | null> {
  try {
    const response = await fetch('/api/research-artifacts', { credentials: 'include' });
    if (!response.ok) return null;
    const payload = await response.json() as { success?: boolean; searchRecords?: SearchQueryRecord[]; sourceRecords?: SourceRecord[] };
    if (!payload.success || !Array.isArray(payload.searchRecords) || !Array.isArray(payload.sourceRecords)) return null;
    return { searchRecords: payload.searchRecords, sourceRecords: payload.sourceRecords };
  } catch {
    return null;
  }
}

export async function syncResearchArtifactsToServer(): Promise<boolean> {
  try {
    const response = await fetch('/api/research-artifacts', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchRecords: loadSearchQueryRecords(), sourceRecords: loadSourceRecordLibrary() }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
