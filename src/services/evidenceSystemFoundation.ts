import { AuditTrailService, type AuditEntry } from './auditTrailService';
import { RbacService, type UserRole } from './rbacService';

export type EvidenceModule =
  | 'project' | 'search' | 'reference-hub' | 'fulltext' | 'screening'
  | 'pico' | 'appraisal' | 'dual-review' | 'adjudication' | 'extraction'
  | 'synthesis' | 'grade' | 'cerqual' | 'prisma' | 'writing' | 'export'
  | 'implementation' | 'instrument-registry' | 'meta-research';

export interface EvidenceEvent<TPayload = Record<string, unknown>> {
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
  allowedActions: readonly string[];
  can(action: string): boolean;
}

export interface ImprovementSuggestion {
  id: string;
  module: EvidenceModule;
  suggestion: string;
  generatedBy: 'AI' | 'system' | 'human';
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  evidence?: string[];
  createdAt: string;
}

export interface EvidenceStateSnapshot {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  data: Record<string, unknown>;
  correlationId: string;
}

export interface EvidenceStateStore {
  get<T = unknown>(key: string): T | undefined;
  set<T>(key: string, value: T, actor: string, reason: string, module: EvidenceModule): EvidenceEvent;
  snapshot(): EvidenceStateSnapshot;
  events(): readonly EvidenceEvent[];
}

function uid(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

function toAuditRole(actor: string): UserRole {
  if (actor === 'admin' || actor === 'lead_reviewer' || actor === 'reviewer' || actor === 'adjudicator') return actor;
  return 'reviewer';
}

export class EvidenceStateService implements EvidenceStateStore {
  private readonly stateId: string;
  private version = 1;
  private readonly createdAt = new Date().toISOString();
  private updatedAt = this.createdAt;
  private readonly data = new Map<string, unknown>();
  private readonly eventLog: EvidenceEvent[] = [];
  private readonly correlationId: string;

  constructor(correlationId = uid('run')) {
    this.stateId = uid('state');
    this.correlationId = correlationId;
  }

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
      payload: { key, value, reason } as Record<string, unknown> as T,
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

  async emit<TPayload extends Record<string, unknown>>(
    event: Omit<EvidenceEvent<TPayload>, 'id' | 'timestamp' | 'stateVersion'>,
  ): Promise<EvidenceEvent<TPayload>> {
    const enriched: EvidenceEvent<TPayload> = {
      ...event,
      id: uid('evt'),
      timestamp: new Date().toISOString(),
      stateVersion: this.state.snapshot().version,
    };

    await this.auditTrail.append({
      actor: { id: enriched.actor, name: enriched.actor, role: toAuditRole(enriched.actor) },
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
    await this.emit({
      type: 'workflow.handoff',
      module: input.fromModule,
      actor: input.fromRole,
      payload: handoff,
      correlationId: input.correlationId,
    });
    return handoff;
  }

  async recordImprovement(suggestion: Omit<ImprovementSuggestion, 'id' | 'createdAt'>): Promise<ImprovementSuggestion> {
    const item: ImprovementSuggestion = {
      ...suggestion,
      id: uid('improve'),
      createdAt: new Date().toISOString(),
    };
    await this.emit({
      type: 'improvement.suggested',
      module: suggestion.module,
      actor: suggestion.generatedBy,
      payload: item,
      correlationId: this.state.snapshot().correlationId,
    });
    return item;
  }

  async verifyAuditIntegrity(): Promise<{ valid: boolean; firstInvalidIndex: number | null; entries: readonly AuditEntry[] }> {
    const result = await this.auditTrail.verify();
    return {
      valid: result.valid,
      firstInvalidIndex: result.firstInvalidIndex,
      entries: this.auditTrail.list(),
    };
  }
}

export function canRolePerformAction(role: UserRole | string, action: string): boolean {
  const knownRole = ['admin', 'lead_reviewer', 'reviewer', 'adjudicator'].includes(role)
    ? role as UserRole
    : undefined;
  return knownRole ? RbacService.checkPermission(knownRole, action as never) : false;
}
