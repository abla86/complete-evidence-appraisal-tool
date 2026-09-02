export interface ProjectAuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  detail: Record<string, unknown>;
}

export function appendProjectAuditEvent(input: Omit<ProjectAuditEvent, 'id' | 'timestamp'>): ProjectAuditEvent {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...input,
  };
}
