import { validateSourceRecord } from '../services/validateSourceRecord';
import {
  intakeSourceRecord,
  linkRecordToScreeningBatch,
  transitionScreeningState,
  attachReviewedRecordToPico,
  type Actor,
  type IntakeStore,
  type AuditWriter,
} from '../services/sourceIntakeService';
import type { SourceRecord } from '../domain/sourceRecord';

export type TestGroupActor = Actor;

export interface TestGroupWorkflowResult {
  ok: boolean;
  stage: 'validation' | 'intake' | 'screening' | 'pico';
  record?: SourceRecord;
  errors?: string[];
}

export function validateImportedSourceRecord(input: unknown): TestGroupWorkflowResult {
  const result = validateSourceRecord(input);
  return result.ok
    ? { ok: true, stage: 'intake', record: input as SourceRecord }
    : { ok: false, stage: 'validation', errors: result.errors };
}

/**
 * Explicit stage-by-stage harness used by integration tests and manual QA.
 * It deliberately does not provide a hidden "add source" shortcut.
 */
export function createTestGroupWorkflow(
  actor: TestGroupActor,
  store: IntakeStore,
  audit: AuditWriter,
) {
  return {
    import(record: SourceRecord) {
      return intakeSourceRecord(record, actor, store, audit);
    },
    link(record: SourceRecord, batchId: string) {
      return linkRecordToScreeningBatch(record, batchId, actor, audit);
    },
    review(record: SourceRecord, reason?: string) {
      return transitionScreeningState(record, 'reviewed', actor, audit, reason);
    },
    exclude(record: SourceRecord, reason: string) {
      return transitionScreeningState(record, 'excluded', actor, audit, reason);
    },
    attach(record: SourceRecord, picoEntityId: string) {
      return attachReviewedRecordToPico(record, picoEntityId, actor, audit);
    },
  };
}
