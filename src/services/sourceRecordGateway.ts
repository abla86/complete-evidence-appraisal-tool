import { buildSourceRecord } from './buildSourceRecord';
import type { ResearchMetadataRecord, PrivacyInspectionResult } from '../shared/moduleContracts';

export interface SourceRecordGatewayInput {
  metadata: ResearchMetadataRecord;
  privacy: PrivacyInspectionResult;
  lawText?: string | null;
  toolVersion?: string;
}

export function createSourceRecord(input: SourceRecordGatewayInput) {
  return buildSourceRecord({
    meta: input.metadata,
    privacyResult: input.privacy,
    lawText: input.lawText ?? null,
    toolVersion: input.toolVersion ?? '1.0.0',
  });
}

