import { createHash, randomUUID } from 'node:crypto';
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

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort());
}

function hashEntry(entry: Omit<AuditEntry, 'entryHash'>): string {
  return createHash('sha256').update(canonicalJson(entry)).digest('hex');
}

export class AuditTrailService {
  private readonly entries: AuditEntry[] = [];

  append(input: {
    actor: Actor;
    action: string;
    subject: { entityType: string; id: string };
    detail?: Record<string, unknown>;
  }): AuditEntry {
    const base = {
      entryId: randomUUID(),
      timestamp: new Date().toISOString(),
      actor: input.actor,
      action: input.action,
      subject: input.subject,
      detail: input.detail ?? {},
      previousEntryHash: this.entries.at(-1)?.entryHash ?? null,
    } satisfies Omit<AuditEntry, 'entryHash'>;

    const entry: AuditEntry = { ...base, entryHash: hashEntry(base) };
    this.entries.push(entry);
    return Object.freeze(entry);
  }

  list(): readonly AuditEntry[] {
    return this.entries.map((entry) => ({ ...entry, detail: { ...entry.detail } }));
  }

  verify(): { valid: boolean; firstInvalidIndex: number | null } {
    let previousHash: string | null = null;
    for (let i = 0; i < this.entries.length; i += 1) {
      const entry = this.entries[i];
      const { entryHash, ...base } = entry;
      if (base.previousEntryHash !== previousHash || hashEntry(base) !== entryHash) {
        return { valid: false, firstInvalidIndex: i };
      }
      previousHash = entryHash;
    }
    return { valid: true, firstInvalidIndex: null };
  }
}
