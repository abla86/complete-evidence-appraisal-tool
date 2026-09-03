import { appendAuditEntry, type AuditEntry } from './auditTrailService';
import type { Actor } from './sourceIntakeService';

export interface ProjectAuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  detail: Record<string, unknown>;
}

export async function appendProjectAuditEvent(
  input: Omit<ProjectAuditEvent, 'id' | 'timestamp'>,
): Promise<ProjectAuditEvent> {
  const actor: Actor = { id: input.actorId.trim(), role: 'reviewer' };
  if (!actor.id) throw new Error('actorId is required.');

  const entry: AuditEntry = await appendAuditEntry({
    actor,
    action: input.action,
    subject: { entityType: input.subjectType, id: input.subjectId },
    detail: input.detail,
  });

  return {
    id: entry.entryId,
    timestamp: entry.timestamp,
    actorId: entry.actor.id,
    action: entry.action,
    subjectType: entry.subject.entityType,
    subjectId: entry.subject.id,
    detail: entry.detail,
  };
}
