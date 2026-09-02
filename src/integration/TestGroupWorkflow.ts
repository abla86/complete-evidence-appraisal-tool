import { validateSourceRecord } from '../services/validateSourceRecord';
import { createSourceRecordIntakeAdapter } from '../services/sourceRecordIntakeAdapter';
import { createScreeningStateMachine } from '../services/sourceIntakeService';
import { createAuditTrail } from '../services/auditTrailService';

export type TestGroupActor = { id: string; role: 'reviewer' | 'admin' | 'system' };

export interface TestGroupWorkflowResult {
  ok: boolean;
  stage: 'validation' | 'intake' | 'screening' | 'pico';
  record?: unknown;
  errors?: string[];
}

/**
 * Reference implementation for the complete SourceRecord workflow.
 * UI should call the individual stages; this helper exists for integration tests
 * and deterministic manual testing, not as a hidden "magic add source" action.
 */
export function validateImportedSourceRecord(input: unknown): TestGroupWorkflowResult {
  const result = validateSourceRecord(input);
  return result.ok
    ? { ok: true, stage: 'intake', record: input }
    : { ok: false, stage: 'validation', errors: result.errors };
}

export function createTestGroupWorkflow(actor: TestGroupActor) {
  const audit = createAuditTrail();
  const intake = createSourceRecordIntakeAdapter({ audit, actor });
  const screening = createScreeningStateMachine({ audit, actor });

  return {
    audit,
    intake,
    screening,
    async attachToPico(record: any, picoEntityId: string) {
      if (record?.intake?.screeningState !== 'reviewed') {
        return { ok: false, reason: 'not-reviewed' } as const;
      }
      const result = await audit.append(
        'RECORD_ATTACHED_TO_PICO',
        actor,
        { entityType: 'source_record', id: record.recordId },
        { picoEntityId, referenceVerified: false },
      );
      record.intake.screeningState = 'attached';
      return { ok: true, auditEntryId: result.entryId } as const;
    },
  };
}
