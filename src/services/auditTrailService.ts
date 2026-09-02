import type { Actor } from './sourceIntakeService';

export interface AuditEntry {
  entryId: string;
  timestamp: string;
  actor: Actor;
  action: string;
  subject: { entityType: string; id: string };
  detail: Record<string, unknown>;
  previousEntryHash: string | null;
  entryHash: string;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('web-crypto-unavailable');
  const data = new TextEncoder().encode(value);
  const digest = await subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashEntry(entry: Omit<AuditEntry, 'entryHash'>): Promise<string> {
  return sha256Hex(stableStringify(entry));
}

export class AuditTrailService {
  private readonly entries: AuditEntry[] = [];

  async append(input: {
    actor: Actor;
    action: string;
    subject: { entityType: string; id: string };
    detail?: Record<string, unknown>;
  }): Promise<AuditEntry> {
    const base = {
      entryId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      actor: input.actor,
      action: input.action,
      subject: input.subject,
      detail: input.detail ?? {},
      previousEntryHash: this.entries.at(-1)?.entryHash ?? null,
    } satisfies Omit<AuditEntry, 'entryHash'>;

    const entry: AuditEntry = { ...base, entryHash: await hashEntry(base) };
    this.entries.push(entry);
    return entry;
  }

  list(): readonly AuditEntry[] {
    return this.entries.map((entry) => ({ ...entry, detail: { ...entry.detail } }));
  }

  async verify(): Promise<{ valid: boolean; firstInvalidIndex: number | null }> {
    let previousHash: string | null = null;
    for (let i = 0; i < this.entries.length; i += 1) {
      const entry = this.entries[i];
      const { entryHash, ...base } = entry;
      if (base.previousEntryHash !== previousHash || await hashEntry(base) !== entryHash) {
        return { valid: false, firstInvalidIndex: i };
      }
      previousHash = entryHash;
    }
    return { valid: true, firstInvalidIndex: null };
  }
}
