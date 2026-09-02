/**
 * Unified Reference Hub
 *
 * One reference-management surface for the Evidence Appraisal superprogram.
 * EndNote, Zotero, Mendeley and Paperpile are compatibility targets, not
 * parallel reference engines. The hub owns one canonical record model and
 * delegates structural validation to the existing shared integrity boundary.
 */

import { createReference, type SharedReferenceInput, type SharedReferenceKind } from './sharedReferenceEngine.ts';

export type ReferenceImportFormat = 'RIS' | 'BIBTEX' | 'ENDNOTE_XML' | 'CSL_JSON' | 'CSV' | 'JSON' | 'MANUAL';
export type ReferenceAttachmentKind = 'PDF' | 'SUPPLEMENT' | 'WEB_CAPTURE' | 'OTHER';
export type ReferenceVerificationState = 'DETECTED' | 'VALIDATION_REQUIRED' | 'VALIDATED' | 'INVALID';

export interface ReferenceAttachment {
  id: string;
  kind: ReferenceAttachmentKind;
  name: string;
  mimeType?: string;
  sha256?: string;
  sourceUrl?: string;
  addedAt: string;
}

export interface ReferenceAnnotation {
  id: string;
  page?: string;
  quote?: string;
  note?: string;
  color?: string;
  createdAt: string;
}

export interface ReferenceRecord extends SharedReferenceInput {
  id: string;
  citeKey?: string;
  importedFrom: ReferenceImportFormat[];
  tags: string[];
  collections: string[];
  attachments: ReferenceAttachment[];
  annotations: ReferenceAnnotation[];
  createdAt: string;
  updatedAt: string;
  duplicateOf?: string;
  verification: ReferenceVerificationState;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface DuplicateCandidate {
  recordId: string;
  candidateId: string;
  reason: 'DOI' | 'TITLE' | 'IDENTIFIER';
  confidence: number;
}

export interface ReferenceHubSnapshot {
  records: ReferenceRecord[];
  duplicateCandidates: DuplicateCandidate[];
}

export interface ReferenceImportResult {
  records: ReferenceRecord[];
  warnings: string[];
  errors: string[];
}

function now(): string {
  return new Date().toISOString();
}

function stableText(value?: string): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeDoi(value?: string): string {
  return stableText(value)
    .replace(/^doi:\s*/i, '')
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/[.,;:)]+$/, '');
}

function titleKey(record: Pick<ReferenceRecord, 'title'>): string {
  return stableText(record.title).replace(/[^\p{L}\p{N}]+/gu, '');
}

function recordVerification(record: ReferenceRecord): ReferenceVerificationState {
  const result = createReference(record);
  if (result.status === 'INVALID') return 'INVALID';
  if (record.verifiedBy && record.verifiedAt) return 'VALIDATED';
  return 'VALIDATION_REQUIRED';
}

export function createReferenceRecord(input: SharedReferenceInput & {
  id: string;
  importedFrom?: ReferenceImportFormat[];
  tags?: string[];
  collections?: string[];
  attachments?: ReferenceAttachment[];
  annotations?: ReferenceAnnotation[];
}): ReferenceRecord {
  const timestamp = now();
  const record: ReferenceRecord = {
    ...input,
    id: input.id,
    importedFrom: input.importedFrom ?? ['MANUAL'],
    tags: input.tags ?? [],
    collections: input.collections ?? [],
    attachments: input.attachments ?? [],
    annotations: input.annotations ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    verification: 'DETECTED'
  };

  record.verification = recordVerification(record);
  return record;
}

export function updateReferenceRecord(
  record: ReferenceRecord,
  patch: Partial<SharedReferenceInput> & {
    tags?: string[];
    collections?: string[];
    attachments?: ReferenceAttachment[];
    annotations?: ReferenceAnnotation[];
    verifiedBy?: string;
    verifiedAt?: string;
  }
): ReferenceRecord {
  const updated: ReferenceRecord = {
    ...record,
    ...patch,
    id: record.id,
    importedFrom: record.importedFrom,
    tags: patch.tags ?? record.tags,
    collections: patch.collections ?? record.collections,
    attachments: patch.attachments ?? record.attachments,
    annotations: patch.annotations ?? record.annotations,
    createdAt: record.createdAt,
    updatedAt: now(),
    verification: record.verification
  };

  updated.verification = recordVerification(updated);
  return updated;
}

export function detectDuplicateCandidates(records: ReferenceRecord[]): DuplicateCandidate[] {
  const result: DuplicateCandidate[] = [];

  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const a = records[i];
      const b = records[j];
      const aDoi = normalizeDoi(a.doi);
      const bDoi = normalizeDoi(b.doi);

      if (aDoi && bDoi && aDoi === bDoi) {
        result.push({ recordId: a.id, candidateId: b.id, reason: 'DOI', confidence: 1 });
        continue;
      }

      const aTitle = titleKey(a);
      const bTitle = titleKey(b);
      if (aTitle && bTitle && aTitle === bTitle) {
        result.push({ recordId: a.id, candidateId: b.id, reason: 'TITLE', confidence: 0.95 });
      }
    }
  }

  return result;
}

/**
 * Explicit verification action. Detection/formatting never upgrades a record.
 */
export function markReferenceVerified(record: ReferenceRecord, verifiedBy: string, verifiedAt = now()): ReferenceRecord {
  const verified = updateReferenceRecord(record, { verifiedBy, verifiedAt });
  return { ...verified, verification: verifiedVerification(verified) };
}

function verifiedVerification(record: ReferenceRecord): ReferenceVerificationState {
  const result = createReference(record);
  return result.status === 'VALIDATED' ? 'VALIDATED' : result.status === 'INVALID' ? 'INVALID' : 'VALIDATION_REQUIRED';
}

export function createHubSnapshot(records: ReferenceRecord[]): ReferenceHubSnapshot {
  return {
    records: [...records],
    duplicateCandidates: detectDuplicateCandidates(records)
  };
}

export const REFERENCE_COMPATIBILITY_CAPABILITIES = {
  EndNote: ['ENDNOTE_XML', 'RIS', 'custom styles', 'reference updates'],
  Zotero: ['RIS', 'BIBTEX', 'CSL_JSON', 'PDF', 'annotations', 'collections'],
  Mendeley: ['RIS', 'BIBTEX', 'PDF', 'annotations', 'groups'],
  Paperpile: ['RIS', 'BIBTEX', 'PDF', 'collections', 'annotations'],
  Word: ['in-text citations', 'bibliography'],
  GoogleDocs: ['in-text citations', 'bibliography'],
  LibreOffice: ['in-text citations', 'bibliography']
} as const;

export const SUPPORTED_REFERENCE_KINDS: SharedReferenceKind[] = [
  'JOURNAL_ARTICLE', 'BOOK', 'REPORT', 'WEBPAGE', 'LAW', 'REGULATION',
  'NOU', 'PROPOSITION', 'TREATY', 'GUIDELINE', 'THESIS', 'OTHER'
];
