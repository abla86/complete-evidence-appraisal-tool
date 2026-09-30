import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { SearchQueryRecord } from './evidenceIntelligenceService';
import type { SourceRecord } from '../domain/sourceRecord';
import { validateSourceRecord } from './validateSourceRecord';

const ROOT = path.resolve(process.env.RESEARCH_ARTIFACTS_DATA_DIR || path.join(process.cwd(), 'data', 'research-artifacts'));

function userFile(userId: string): string {
  const safeId = crypto.createHash('sha256').update(userId).digest('hex');
  return path.join(ROOT, safeId + '.json');
}

function validSearchRecord(value: unknown): value is SearchQueryRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<SearchQueryRecord>;
  return typeof item.id === 'string' && item.id.trim() !== ''
    && typeof item.query === 'string'
    && typeof item.database === 'string'
    && typeof item.dateSearched === 'string'
    && typeof item.resultsCount === 'number'
    && Array.isArray(item.results);
}

function normalizeSearch(records: unknown[]): SearchQueryRecord[] {
  const byId = new Map<string, SearchQueryRecord>();
  for (const value of records) if (validSearchRecord(value)) byId.set(value.id, value);
  return [...byId.values()].slice(0, 200);
}

function normalizeSources(records: unknown[]): SourceRecord[] {
  const byId = new Map<string, SourceRecord>();
  for (const value of records) if (validateSourceRecord(value).ok) byId.set((value as SourceRecord).recordId, value as SourceRecord);
  return [...byId.values()];
}

export async function loadResearchArtifacts(userId: string): Promise<{ searchRecords: SearchQueryRecord[]; sourceRecords: SourceRecord[] }> {
  try {
    const raw = await fs.readFile(userFile(userId), 'utf8');
    const parsed = JSON.parse(raw) as { searchRecords?: unknown[]; sourceRecords?: unknown[] };
    return {
      searchRecords: normalizeSearch(Array.isArray(parsed.searchRecords) ? parsed.searchRecords : []),
      sourceRecords: normalizeSources(Array.isArray(parsed.sourceRecords) ? parsed.sourceRecords : []),
    };
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return { searchRecords: [], sourceRecords: [] };
    throw error;
  }
}

export async function saveResearchArtifacts(
  userId: string,
  artifacts: { searchRecords: SearchQueryRecord[]; sourceRecords: SourceRecord[] },
): Promise<{ searchRecords: SearchQueryRecord[]; sourceRecords: SourceRecord[] }> {
  const normalized = {
    searchRecords: normalizeSearch(artifacts.searchRecords),
    sourceRecords: normalizeSources(artifacts.sourceRecords),
  };
  await fs.mkdir(ROOT, { recursive: true });
  const file = userFile(userId);
  const temporary = file + '.tmp';
  await fs.writeFile(temporary, JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), ...normalized }, null, 2), { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporary, file);
  return normalized;
}
