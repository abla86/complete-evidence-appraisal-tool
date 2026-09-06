import type { SourceRecord } from '../domain/sourceRecord';
import { validateSourceRecord } from './validateSourceRecord';
import { intakeSourceRecord, type Actor, type AuditWriter, type IntakeStore } from './sourceIntakeService';

export async function importSourceRecordJson(
  json: string,
  actor: Actor,
  store: IntakeStore,
  audit: AuditWriter,
) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { accepted: false as const, reason: 'invalid-json' as const, errors: ['JSON could not be parsed'] };
  }

  const validation = validateSourceRecord(parsed);
  if (!validation.ok) {
    return { accepted: false as const, reason: 'schema-violation' as const, errors: validation.errors };
  }

  return intakeSourceRecord(parsed as SourceRecord, actor, store, audit);
}


