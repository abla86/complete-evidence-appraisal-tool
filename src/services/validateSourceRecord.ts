import { SOURCE_RECORD_SCHEMA_VERSION } from '../domain/sourceRecord';

export interface SourceRecordValidationResult {
  ok: boolean;
  errors: string[];
}

const URI_RE = /^https?:\/\/[^\s]+$/i;
const UUID_V4_RE = /^[a-z0-9]{8}-[a-z0-9]{4}-4[a-z0-9]{3}-[89ab][a-z0-9]{3}-[a-z0-9]{12}$/i;
const DOI_RE = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i;

function objectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateSourceRecord(record: unknown): SourceRecordValidationResult {
  const errors: string[] = [];
  if (!objectLike(record)) return { ok: false, errors: ['not-an-object'] };

  if (record.schemaVersion !== SOURCE_RECORD_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be "${SOURCE_RECORD_SCHEMA_VERSION}"`);
  }
  if (typeof record.recordId !== 'string' || !UUID_V4_RE.test(record.recordId)) {
    errors.push('recordId must be UUIDv4');
  }

  const source = record.source;
  if (!objectLike(source)) {
    errors.push('source section is required');
  } else {
    if (typeof source.url !== 'string' || !URI_RE.test(source.url)) errors.push('source.url must be an absolute http(s) URL');
    if (typeof source.capturedAt !== 'string' || Number.isNaN(Date.parse(source.capturedAt))) errors.push('source.capturedAt must be ISO date-time');
  }

  const metadata = record.metadata;
  if (!objectLike(metadata)) {
    errors.push('metadata section is required');
  } else {
    if (!['COMPLETE', 'INCOMPLETE', 'UNVERIFIABLE'].includes(String(metadata.status))) errors.push('invalid metadata.status');
    if (!Array.isArray(metadata.missingFields)) errors.push('metadata.missingFields must be an array');
    if (!Array.isArray(metadata.detectedFrom)) errors.push('metadata.detectedFrom must be an array');
  }

  const identifiers = record.identifiers;
  if (!objectLike(identifiers) || !Object.hasOwn(identifiers, 'doi')) {
    errors.push('identifiers.doi is required');
  } else if (identifiers.doi !== null) {
    if (!objectLike(identifiers.doi)) {
      errors.push('identifiers.doi must be object or null');
    } else {
      const normalizedDoi = identifiers.doi.normalized;
      const doiIsValid = typeof normalizedDoi === 'string' && DOI_RE.test(normalizedDoi);
      if (!doiIsValid) errors.push('identifiers.doi.normalized must be a valid DOI');
      if (typeof identifiers.doi.formatValid !== 'boolean') errors.push('identifiers.doi.formatValid must be boolean');
      if (typeof identifiers.doi.formatValid === 'boolean' && identifiers.doi.formatValid !== doiIsValid) {
        errors.push('identifiers.doi.formatValid does not match normalized DOI syntax');
      }
    }
  }

  const draft = record.referenceDraft;
  if (!objectLike(draft)) {
    errors.push('referenceDraft section is required');
  } else {
    if (!['complete', 'incomplete', 'unverifiable'].includes(String(draft.status))) errors.push('invalid referenceDraft.status');
    if (draft.status === 'complete' && typeof draft.apa7 !== 'string') errors.push('complete reference requires non-null apa7 string');
    if (draft.note !== 'Draft – detected metadata, not verified against source') errors.push('referenceDraft.note must preserve non-verification warning');
  }

  const privacy = record.privacy;
  if (!objectLike(privacy)) {
    errors.push('privacy section is required');
  } else {
    if (privacy.localOnly !== true) errors.push('privacy.localOnly must be true at intake');
    if (!Array.isArray(privacy.externalHosts)) errors.push('privacy.externalHosts must be an array');
    if (!Array.isArray(privacy.trackingHosts)) errors.push('privacy.trackingHosts must be an array');
    if (!Array.isArray(privacy.signals)) errors.push('privacy.signals must be an array');
  }

  const provenance = record.provenance;
  if (!objectLike(provenance)) {
    errors.push('provenance section is required');
  } else {
    if (provenance.collectedLocally !== true) errors.push('provenance.collectedLocally must be true');
    if (provenance.externalRequestsMade !== false) errors.push('provenance.externalRequestsMade must be false');
  }

  return { ok: errors.length === 0, errors };
}
