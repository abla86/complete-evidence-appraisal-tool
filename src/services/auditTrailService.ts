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

export type AuditTrailListener = (entry: AuditEntry) => void;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('web-crypto-unavailable');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashEntry(entry: Omit<AuditEntry, 'entryHash'>): Promise<string> {
  return sha256Hex(stableStringify(entry));
}

function createEntryId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export class AuditTrailService {
  private readonly entries: AuditEntry[] = [];
  private readonly listeners = new Set<AuditTrailListener>();

  subscribe(listener: AuditTrailListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async append(input: {
    actor: Actor;
    action: string;
    subject: { entityType: string; id: string };
    detail?: Record<string, unknown>;
  }): Promise<AuditEntry> {
    const base = {
      entryId: createEntryId(),
      timestamp: new Date().toISOString(),
      actor: input.actor,
      action: input.action,
      subject: input.subject,
      detail: input.detail ?? {},
      previousEntryHash: this.entries.at(-1)?.entryHash ?? null,
    } satisfies Omit<AuditEntry, 'entryHash'>;

    const entry: AuditEntry = { ...base, entryHash: await hashEntry(base) };
    this.entries.push(entry);
    for (const listener of this.listeners) listener(entry);
    return entry;
  }

  list(): readonly AuditEntry[] {
    return this.entries.map(entry => ({ ...entry, detail: { ...entry.detail }, actor: { ...entry.actor }, subject: { ...entry.subject } }));
  }

  filter(action: string): readonly AuditEntry[] {
    return this.list().filter(entry => entry.action === action);
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

export function createAuditTrail(): AuditTrailService {
  return new AuditTrailService();
}

const defaultAuditTrail = createAuditTrail();

export async function appendAuditEntry(input: Parameters<AuditTrailService['append']>[0]): Promise<AuditEntry> {
  return defaultAuditTrail.append(input);
}

export function getAuditTrail(): readonly AuditEntry[] {
  return defaultAuditTrail.list();
}

export function filterAuditTrail(action: string): readonly AuditEntry[] {
  return defaultAuditTrail.filter(action);
}

export function subscribeAuditTrail(listener: AuditTrailListener): () => void {
  return defaultAuditTrail.subscribe(listener);
}
