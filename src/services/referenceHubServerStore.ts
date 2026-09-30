import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ReferenceRecord } from './referenceHubService';

const ROOT = path.resolve(process.env.REFERENCE_HUB_DATA_DIR || path.join(process.cwd(), 'data', 'reference-hub'));

function userFile(userId: string): string {
  const safeId = crypto.createHash('sha256').update(userId).digest('hex');
  return path.join(ROOT, safeId + '.json');
}

function validRecord(value: unknown): value is ReferenceRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Partial<ReferenceRecord>;
  return typeof record.id === 'string'
    && record.id.trim() !== ''
    && typeof record.title === 'string'
    && Array.isArray(record.importedFrom)
    && Array.isArray(record.tags)
    && Array.isArray(record.collections)
    && Array.isArray(record.attachments)
    && Array.isArray(record.annotations)
    && typeof record.verification === 'string'
    && typeof record.createdAt === 'string'
    && typeof record.updatedAt === 'string';
}

function normalize(records: unknown[]): ReferenceRecord[] {
  const byId = new Map<string, ReferenceRecord>();
  for (const value of records) {
    if (!validRecord(value)) continue;
    byId.set(value.id, {
      ...value,
      sourceRecordIds: Array.isArray(value.sourceRecordIds) ? [...new Set(value.sourceRecordIds)] : [],
      articleIds: Array.isArray(value.articleIds) ? [...new Set(value.articleIds)] : [],
    });
  }
  return [...byId.values()];
}

export async function loadReferenceHub(userId: string): Promise<ReferenceRecord[]> {
  const file = userFile(userId);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? normalize(parsed) : [];
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
    throw error;
  }
}

export async function saveReferenceHub(userId: string, records: ReferenceRecord[]): Promise<ReferenceRecord[]> {
  const normalized = normalize(records);
  await fs.mkdir(ROOT, { recursive: true });
  const file = userFile(userId);
  const temporary = file + '.tmp';
  await fs.writeFile(temporary, JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), records: normalized }, null, 2), { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporary, file);
  return normalized;
}
