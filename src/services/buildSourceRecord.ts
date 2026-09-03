import type { PrivacyInspectionResult, ResearchMetadataRecord } from '../shared/moduleContracts';
import { SOURCE_RECORD_SCHEMA_VERSION, createRecordId, type SourceRecord } from '../domain/sourceRecord';

export interface BuildSourceRecordInput {
  meta: ResearchMetadataRecord;
  privacyResult: PrivacyInspectionResult;
  lawText: string | null;
  toolVersion: string;
}

function buildReferenceDraft(meta: ResearchMetadataRecord): SourceRecord['referenceDraft'] {
  const hasMinimumMetadata = Boolean(meta.title && meta.sourceUrl);
  const authorText = meta.authors?.filter(Boolean).join(', ');
  const year = meta.publicationDate;

  const apa7 = hasMinimumMetadata
    ? [
        authorText || 'Ukjent forfatter',
        year ? `(${year}).` : undefined,
        meta.title ? `${meta.title}.` : undefined,
        meta.journal,
        meta.doi ? `https://doi.org/${meta.doi.replace(/^https?:\/\/doi\.org\//i, '')}` : undefined,
      ]
        .filter(Boolean)
        .join(' ')
    : null;

  return {
    apa7,
    status: hasMinimumMetadata ? 'complete' : 'incomplete',
    note: 'Draft – detected metadata, not verified against source',
  };
}

function buildDoi(meta: ResearchMetadataRecord): SourceRecord['identifiers']['doi'] {
  if (!meta.doi?.trim()) return null;
  const normalized = meta.doi.trim().replace(/^https?:\/\/doi\.org\//i, '');
  const formatValid = /^10\.\d{4,9}\/[\-._;()/:A-Z0-9]+$/i.test(normalized);
  return {
    normalized,
    formatValid,
    raw: meta.doi,
    resolverUrl: `https://doi.org/${normalized}`,
  };
}

function buildMetadata(meta: ResearchMetadataRecord): SourceRecord['metadata'] {
  const missingFields: string[] = [];
  if (!meta.title) missingFields.push('title');
  if (!meta.authors?.length) missingFields.push('authors');
  if (!meta.publicationDate) missingFields.push('publicationDate');
  if (!meta.journal) missingFields.push('journal');

  return {
    ...meta,
    status: missingFields.length === 0 ? 'COMPLETE' : 'INCOMPLETE',
    missingFields,
  };
}

function buildLegalReference(lawText: string | null): SourceRecord['legalReference'] {
  const text = lawText?.trim();
  if (!text) return null;

  return {
    type: 'lov',
    officialId: '',
    shortTitle: '',
    paragraph: null,
    citation: text,
  };
}

export function buildSourceRecord(input: BuildSourceRecordInput): SourceRecord {
  const capturedAt = new Date().toISOString();
  const metadata = buildMetadata(input.meta);

  return {
    schemaVersion: SOURCE_RECORD_SCHEMA_VERSION,
    recordId: createRecordId(),
    source: {
      url: input.meta.sourceUrl,
      capturedAt,
    },
    metadata,
    identifiers: {
      doi: buildDoi(input.meta),
    },
    referenceDraft: buildReferenceDraft(input.meta),
    legalReference: buildLegalReference(input.lawText),
    privacy: {
      ...input.privacyResult,
      localOnly: true,
    },
    provenance: {
      tool: 'source-record-gateway',
      toolVersion: input.toolVersion,
      collectedLocally: true,
      externalRequestsMade: false,
      collectedAt: capturedAt,
    },
  };
}
