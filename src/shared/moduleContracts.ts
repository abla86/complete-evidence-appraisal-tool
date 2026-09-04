import type { SuperprogramFailure, SuperprogramResult, SuperprogramSuccess } from '../integration/superprogramContract';

export type IntegrationModuleId =
  | 'REFERENCE_ENGINE'
  | 'PRIVACY_INSPECTOR'
  | 'METADATA_INSPECTOR'
  | 'ACCESSIBILITY_INSPECTOR'
  | 'DOCUMENT_EVIDENCE'
  | 'RESEARCH_WORKFLOW';

export interface ResearchMetadataRecord {
  sourceUrl: string;
  title?: string;
  authors?: string[];
  publicationDate?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  firstPage?: string;
  lastPage?: string;
  doi?: string;
  issn?: string;
  description?: string;
  detectedAt: string;
  detectedFrom: Array<'citation-meta' | 'open-graph' | 'schema-org' | 'document' | 'manual'>;
  fields?: Record<string, unknown>;
}

export interface PrivacyInspectionResult {
  sourceUrl: string;
  analyzedAt: string;
  externalResourceCount: number;
  externalHosts: string[];
  trackingIndicatorCount: number;
  trackingHosts: string[];
  signals: Array<{
    host: string;
    category: 'external-resource' | 'tracking-indicator';
    evidence: string;
  }>;
  localOnlyAnalysis: true;
  localOnly: true;
}

export interface AccessibilityInspectionResult {
  sourceUrl: string;
  analyzedAt: string;
  missingAlt: number;
  emptyAlt: number;
  unnamedButtons: number;
  h1Count: number;
  mainLandmarkCount: number;
  headingCount: number;
  checksAreSignals: true;
}

export interface EvidenceModuleResult {
  moduleId: IntegrationModuleId;
  schemaVersion: '1.0';
  metadata?: ResearchMetadataRecord;
  privacy?: PrivacyInspectionResult;
  accessibility?: AccessibilityInspectionResult;
}

export const MODULE_CONTRACTS = Object.freeze({
  REFERENCE_ENGINE: { schemaVersion: '1.0', sourceOfTruth: 'reference-engine' },
  PRIVACY_INSPECTOR: { schemaVersion: '1.0', sourceOfTruth: 'privacy-inspector' },
  METADATA_INSPECTOR: { schemaVersion: '1.0', sourceOfTruth: 'metadata-inspector' },
  ACCESSIBILITY_INSPECTOR: { schemaVersion: '1.0', sourceOfTruth: 'accessibility-inspector' },
  DOCUMENT_EVIDENCE: { schemaVersion: '1.0', sourceOfTruth: 'evidence-traceability' },
  RESEARCH_WORKFLOW: { schemaVersion: '1.0', sourceOfTruth: 'research-workflow' },
});


/**
 * Standalone/integrated module boundary.
 *
 * A module must be usable independently through its public contract and must
 * not require the superprogram UI or state store. When integrated, failures
 * are isolated unless the contract explicitly declares a blocking dependency.
 */
export interface StandaloneModuleContract<I, O> {
  readonly moduleId: IntegrationModuleId;
  readonly contractVersion: '1.0';
  readonly standalone: true;
  readonly integrated: true;
  readonly failureMode: 'isolated' | 'blocking';
  execute(input: I): Promise<SuperprogramResult<O>>;
}

export interface ModuleHealth {
  moduleId: IntegrationModuleId;
  contractVersion: '1.0';
  standalone: true;
  integrated: true;
  healthy: boolean;
  checkedAt: string;
  details?: string[];
}

export function moduleFailure(
  code: string,
  message: string,
  recoverable = true
): SuperprogramFailure {
  return { ok: false, code, message, recoverable };
}

export function moduleSuccess<T>(value: T): SuperprogramSuccess<T> {
  return { ok: true, value };
}
