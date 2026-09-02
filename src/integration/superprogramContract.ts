export const SUPERPROGRAM_CONTRACT_VERSION = '1.0.0' as const;

export type AuditAction =
  | 'SOURCE_RECORD_INTAKE'
  | 'RECORD_LINKED_TO_BATCH'
  | 'SCREENING_STATE_CHANGED'
  | 'RECORD_ATTACHED_TO_PICO'
  | 'REFERENCE_VERIFIED'
  | 'APPRAISAL_SCORED'
  | 'EXPORT_GENERATED'
  | 'MERGE_RECORDS'
  | 'ERROR_RECORDED';

export interface SuperprogramFailure {
  ok: false;
  code: string;
  message: string;
  recoverable: boolean;
}

export interface SuperprogramSuccess<T> {
  ok: true;
  value: T;
}

export type SuperprogramResult<T> = SuperprogramSuccess<T> | SuperprogramFailure;

export interface SourceWorkflowLink {
  recordId: string;
  screeningBatchId: string;
  picoEntityId?: string;
}

export interface SuperprogramModuleStatus {
  id: string;
  enabled: boolean;
  healthy: boolean;
  failureMode: 'isolated' | 'blocking' | 'unknown';
}

export const SUPERPROGRAM_PRINCIPLES = Object.freeze({
  detectedIsNotVerified: true,
  privacySignalsAreHeuristic: true,
  accessibilitySignalsAreHeuristic: true,
  explicitHumanVerificationRequired: true,
  auditEveryWorkflowMutation: true,
  importDoesNotCountAsScreened: true,
});
