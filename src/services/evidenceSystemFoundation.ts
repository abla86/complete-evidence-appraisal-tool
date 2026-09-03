import { AuditTrailService, type AuditEntry } from './auditTrailService';
import { RbacService, type UserRole } from './rbacService';
import { createId as sharedCreateId } from '../utils/id';

export type EvidenceModule =
  | 'project' | 'research' | 'search' | 'reference-hub' | 'fulltext' | 'screening'
  | 'pico' | 'appraisal' | 'dual-review' | 'adjudication' | 'extraction'
  | 'synthesis' | 'grade' | 'cerqual' | 'prisma' | 'writing' | 'export'
  | 'implementation' | 'instrument-registry' | 'meta-research';

export type EvidencePayload = Record<string, unknown>;

export interface EvidenceEvent<TPayload extends EvidencePayload = EvidencePayload> {
  id: string;
  type: string;
  module: EvidenceModule;
  actor: string;
  payload: TPayload;
  timestamp: string;
  stateVersion: number;
  correlationId: string;
}

export interface EvidenceHandoff {
  id: string;
  fromModule: EvidenceModule;
  toModule: EvidenceModule;
  fromRole: string;
  toRole: string;
  context: Record<string, unknown>;
  timestamp: string;
  reason: string;
  correlationId: string;
}

export interface AuthorityScope {
  role: UserRole | string;
  allowedActions: string[];
  can: (action: string) => boolean;
}

export interface EvidenceStateSnapshot {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
  correlationId: string;
}

function uid(prefix: string): string {
  return sharedCreateId(prefix);
}

function toAuditRole(actor: string): 'reviewer' | 'admin' | 'system' {
  if (actor === 'system') return 'system';
  if (actor.toLowerCase().includes('admin')) return 'admin';
  return 'reviewer';
}

export class EvidenceStateService {
  private readonly data = new Map<string, unknown>();
  private readonly eventLog: EvidenceEvent[] = [];
  private readonly stateId = uid('state');
  private readonly createdAt = new Date().toISOString();
  private updatedAt = this.createdAt;
  private version = 0;

  constructor(private readonly correlationId = uid('correlation')) {}

  get<T = unknown>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  set<T>(key: string, value: T, actor: string, reason: string, module: EvidenceModule): EvidenceEvent {
    if (!actor.trim()) throw new Error('State-endring krever aktør.');
    if (!reason.trim()) throw new Error('State-endring krever begrunnelse.');

    this.data.set(key, value);
    this.version += 1;
    this.updatedAt = new Date().toISOString();

    const event: EvidenceEvent = {
      id: uid('evt'),
      type: 'state.updated',
      module,
      actor,
      payload: { key, value, reason },
      timestamp: this.updatedAt,
      stateVersion: this.version,
      correlationId: this.correlationId,
    };
    this.eventLog.push(event);
    return event;
  }

  snapshot(): EvidenceStateSnapshot {
    return {
      id: this.stateId,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      data: Object.fromEntries(this.data.entries()),
      correlationId: this.correlationId,
    };
  }

  events(): readonly EvidenceEvent[] {
    return this.eventLog.map(event => ({ ...event, payload: { ...event.payload } }));
  }
}

export class EvidenceFoundation {
  public readonly state: EvidenceStateService;

  constructor(
    private readonly auditTrail = new AuditTrailService(),
    correlationId?: string,
  ) {
    this.state = new EvidenceStateService(correlationId);
  }

  authority(role: UserRole | string, allowedActions: readonly string[]): AuthorityScope {
    const safeRole = role || 'read_only';
    const registered = RbacService.getAvailableRoles().some(item => item.id === safeRole);
    return {
      role: registered ? safeRole : role,
      allowedActions: [...allowedActions],
      can: (action: string) => allowedActions.includes(action),
    };
  }

  async emit<TPayload extends EvidencePayload>(
    event: Omit<EvidenceEvent<TPayload>, 'id' | 'timestamp' | 'stateVersion'>,
  ): Promise<EvidenceEvent<TPayload>> {
    const enriched: EvidenceEvent<TPayload> = {
      ...event,
      id: uid('evt'),
      timestamp: new Date().toISOString(),
      stateVersion: this.state.snapshot().version,
    };

    await this.auditTrail.append({
      actor: { id: enriched.actor, role: toAuditRole(enriched.actor) },
      action: enriched.type,
      subject: { entityType: enriched.module, id: enriched.correlationId },
      detail: {
        payload: enriched.payload,
        stateVersion: enriched.stateVersion,
      },
    });
    return enriched;
  }

  async handoff(input: Omit<EvidenceHandoff, 'id' | 'timestamp'>): Promise<EvidenceHandoff> {
    const handoff: EvidenceHandoff = {
      ...input,
      id: uid('handoff'),
      timestamp: new Date().toISOString(),
    };

    await this.auditTrail.append({
      actor: { id: input.fromRole, role: toAuditRole(input.fromRole) },
      action: 'EVIDENCE_HANDOFF',
      subject: { entityType: input.fromModule, id: input.correlationId },
      detail: { ...handoff },
    });

    return handoff;
  }
}

export type { AuditEntry };
