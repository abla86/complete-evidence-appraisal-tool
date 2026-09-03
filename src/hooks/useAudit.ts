import { useCallback } from 'react';
import { appendAuditEntry } from '../services/auditTrailService';
import type { Actor } from '../services/sourceIntakeService';

export function useAudit(actor: Actor) {
  return useCallback((action: string, subject: { entityType: string; id: string }, detail: Record<string, unknown> = {}) => {
    return appendAuditEntry({ actor, action, subject, detail });
  }, [actor.id, actor.role]);
}
