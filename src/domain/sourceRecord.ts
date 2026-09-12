import type { AccessibilityInspectionResult, PrivacyInspectionResult, ResearchMetadataRecord } from '../shared/moduleContracts';

export const SOURCE_RECORD_SCHEMA_VERSION = '1.0.0' as const;

export type SourceRecordReferenceStatus = 'complete' | 'incomplete' | 'unverifiable';

export interface SourceRecord {
  schemaVersion: typeof SOURCE_RECORD_SCHEMA_VERSION;
  recordId: string;
  source: {
    url: string;
    capturedAt: string;
  };
  metadata: ResearchMetadataRecord & {
    status: 'COMPLETE' | 'INCOMPLETE' | 'UNVERIFIABLE';
    missingFields: string[];
  };
  identifiers: {
    doi: {
      normalized: string;
      formatValid: boolean;
      raw?: string;
      resolverUrl?: string;
    } | null;
  };
  referenceDraft: {
    apa7: string | null;
    status: SourceRecordReferenceStatus;
    note: 'Draft – detected metadata, not verified against source';
  };
  legalReference: {
    type: 'lov' | 'forskrift';
    officialId: string;
    shortTitle: string;
    paragraph?: string | null;
    citation: string;
    lovdataUrl?: string;
  } | null;
  privacy: PrivacyInspectionResult & { localOnly: true };
  accessibility?: AccessibilityInspectionResult;
  provenance: {
    tool: string;
    toolVersion: string;
    collectedLocally: true;
    externalRequestsMade: false;
    collectedAt: string;
  };
  intake?: {
    receivedAt: string;
    receivedFrom: string;
    screeningState: 'unassigned' | 'awaiting-review' | 'reviewed' | 'excluded' | 'included';
    screeningBatchId?: string;
  };
}

export function createRecordId(): string {
  return crypto.randomUUID();
}
