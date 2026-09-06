import type { SourceRecord } from '../domain/sourceRecord';
import { createRecordId } from '../domain/sourceRecord';
import { validateSourceRecord } from './validateSourceRecord';

export type ScreeningState = NonNullable<SourceRecord['intake']>['screeningState'];

export interface Actor {
  id: string;
  role: 'reviewer' | 'admin' | 'system';
}

export interface IntakeStore {
  getRecord(id: string): SourceRecord | undefined;
  saveRecord(record: SourceRecord): void;
}

export interface AuditWriter {
  append(input: {
    actor: Actor;
    action: string;
    subject: { entityType: string; id: string };
    detail?: Record<string, unknown>;
  }): void | Promise<unknown>;
}

export async function intakeSourceRecord(
  record: SourceRecord,
  actor: Actor,
  store: IntakeStore,
  audit: AuditWriter,
) {
  const validation = validateSourceRecord(record);
  if (!validation.ok) {
    return { accepted: false as const, reason: 'schema-violation' as const, errors: validation.errors };
  }

  const receivedAt = new Date().toISOString();
  const post: SourceRecord = {
    ...record,
    recordId: createRecordId(),
    intake: {
      receivedAt,
      receivedFrom: record.provenance.tool,
      screeningState: 'unassigned',
    },
  };

  store.saveRecord(post);
  await audit.append({
    actor,
    action: 'SOURCE_RECORD_INTAKE',
    subject: { entityType: 'source_record', id: post.recordId },
    detail: {
      generator: record.provenance.tool,
      generatorVersion: record.provenance.toolVersion,
      metadataStatus: record.metadata.status,
      doiFormatValid: record.identifiers?.doi ? record.identifiers.doi.formatValid === true : null,
      referenceVerified: false,
    },
  });

  return { accepted: true as const, record: post };
}

const allowedTransitions: Record<ScreeningState, ScreeningState[]> = {
  unassigned: ['awaiting-review'],
  'awaiting-review': ['reviewed', 'excluded'],
  reviewed: ['included', 'excluded', 'awaiting-review'],
  included: [],
  excluded: ['awaiting-review'],
};

export async function linkRecordToScreeningBatch(
  record: SourceRecord,
  batchId: string,
  actor: Actor,
  audit: AuditWriter,
) {
  const current = record.intake?.screeningState ?? 'unassigned';
  if (!allowedTransitions[current].includes('awaiting-review')) {
    return { linked: false as const, reason: 'invalid-state', currentState: current };
  }

  const next = {
    ...record,
    intake: {
      ...(record.intake ?? {
        receivedAt: new Date().toISOString(),
        receivedFrom: record.provenance.tool,
      }),
      screeningState: 'awaiting-review' as const,
      screeningBatchId: batchId,
    },
  };

  await audit.append({
    actor,
    action: 'RECORD_LINKED_TO_BATCH',
    subject: { entityType: 'source_record', id: record.recordId },
    detail: { batchId, previousState: current, nextState: 'awaiting-review' },
  });

  return { linked: true as const, record: next };
}

export async function transitionScreeningState(
  record: SourceRecord,
  nextState: ScreeningState,
  actor: Actor,
  audit: AuditWriter,
  reason?: string,
) {
  const current = record.intake?.screeningState ?? 'unassigned';
  if (!allowedTransitions[current].includes(nextState)) {
    return { transitioned: false as const, reason: 'invalid-transition', currentState: current };
  }

  const updated = {
    ...record,
    intake: {
      ...(record.intake ?? {
        receivedAt: new Date().toISOString(),
        receivedFrom: record.provenance.tool,
      }),
      screeningState: nextState,
    },
  };

  await audit.append({
    actor,
    action: 'SCREENING_STATE_CHANGED',
    subject: { entityType: 'source_record', id: record.recordId },
    detail: { previousState: current, nextState, reason: reason ?? null },
  });

  return { transitioned: true as const, record: updated };
}

export async function attachReviewedRecordToPico(
  record: SourceRecord,
  picoEntityId: string,
  actor: Actor,
  audit: AuditWriter,
) {
  const state = record.intake?.screeningState ?? 'unassigned';
  if (state !== 'reviewed') {
    return { attached: false as const, reason: 'not-reviewed' as const };
  }

  await audit.append({
    actor,
    action: 'RECORD_ATTACHED_TO_PICO',
    subject: { entityType: 'source_record', id: record.recordId },
    detail: {
      picoEntityId,
      referenceDraftStatus: record.referenceDraft.status,
      referenceVerified: false,
    },
  });

  return { attached: true as const, picoEntityId };
}


