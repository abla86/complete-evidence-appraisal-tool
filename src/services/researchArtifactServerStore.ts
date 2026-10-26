import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { SearchQueryRecord } from './evidenceIntelligenceService';
import type { SourceRecord } from '../domain/sourceRecord';
import { validateSourceRecord } from './validateSourceRecord';

const ROOT = path.resolve(process.env.RESEARCH_ARTIFACTS_DATA_DIR || path.join(process.cwd(), 'data', 'research-artifacts'));
const writeQueues = new Map<string, Promise<void>>();

function userFile(userId: string): string {
  const safeId = crypto.createHash('sha256').update(userId).digest('hex');
  return path.join(ROOT, safeId + '.json');
}

function validSearchRecord(value: unknown): value is SearchQueryRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<SearchQueryRecord>;
  return typeof item.id === 'string' && item.id.trim() !== ''
    && typeof item.searchString === 'string'
    && typeof item.database === 'string'
    && typeof item.dateSearched === 'string'
    && typeof item.totalResults === 'number'
    && Array.isArray(item.records);
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
  await fs.mkdir(ROOT, { recursive: true, mode: 0o700 });
  const file = userFile(userId);
  const previous = writeQueues.get(userId) ?? Promise.resolve();
  const operation = previous.catch(() => undefined).then(async () => {
    // Unique temp files prevent concurrent requests for one user from clobbering
    // each other's temporary file before the atomic rename.
    const temporary = `${file}.${crypto.randomUUID()}.tmp`;
    const payload = JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), ...normalized }, null, 2);
    await fs.writeFile(temporary, payload, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    try {
      await fs.rename(temporary, file);
      await fs.chmod(file, 0o600);
    } catch (error) {
      await fs.rm(temporary, { force: true }).catch(() => undefined);
      throw error;
    }
  });
  writeQueues.set(userId, operation);
  try {
    await operation;
  } finally {
    if (writeQueues.get(userId) === operation) writeQueues.delete(userId);
  }
  return normalized;
}
