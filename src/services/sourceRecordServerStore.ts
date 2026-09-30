import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { SourceRecord } from '../domain/sourceRecord';
import { validateSourceRecord } from './validateSourceRecord';

const ROOT = path.resolve(process.env.SOURCE_RECORD_DATA_DIR || path.join(process.cwd(), 'data', 'source-records'));
function userFile(userId: string): string { return path.join(ROOT, crypto.createHash('sha256').update(userId).digest('hex') + '.json'); }
function normalize(records: unknown[]): SourceRecord[] {
  const byId = new Map<string, SourceRecord>();
  for (const value of records) if (validateSourceRecord(value).ok) byId.set((value as SourceRecord).recordId, value as SourceRecord);
  return [...byId.values()];
}
export async function loadSourceRecords(userId: string): Promise<SourceRecord[]> {
  try { const raw = await fs.readFile(userFile(userId), 'utf8'); const parsed = JSON.parse(raw) as unknown; return Array.isArray(parsed) ? normalize(parsed) : []; }
  catch (error: unknown) { if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return []; throw error; }
}
export async function saveSourceRecords(userId: string, records: SourceRecord[]): Promise<SourceRecord[]> {
  const normalized = normalize(records);
  await fs.mkdir(ROOT, { recursive: true });
  const file = userFile(userId), temporary = file + '.tmp';
  await fs.writeFile(temporary, JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), records: normalized }, null, 2), { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporary, file);
  return normalized;
}
