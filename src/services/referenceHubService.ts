/**
 * Unified Reference Hub
 *
 * One internal canonical reference boundary. External managers (EndNote,
 * Zotero, Mendeley, Paperpile) are interoperability formats, never parallel
 * engines. Verification remains an explicit lifecycle transition.
 */

import { createReference, type SharedReferenceInput, type SharedReferenceKind } from './sharedReferenceEngine.ts';

export type ReferenceImportFormat = 'RIS' | 'BIBTEX' | 'ENDNOTE_XML' | 'CSL_JSON' | 'CSV' | 'JSON' | 'DOI' | 'PMID' | 'ISBN' | 'MANUAL';
export type ReferenceAttachmentKind = 'PDF' | 'SUPPLEMENT' | 'WEB_CAPTURE' | 'DATASET' | 'OTHER';
export type ReferenceVerificationState = 'DETECTED' | 'VALIDATION_REQUIRED' | 'VALIDATED' | 'RETRACTED' | 'INVALID';

export interface ReferenceAttachment {
  id: string;
  kind: ReferenceAttachmentKind;
  name: string;
  mimeType?: string;
  sha256?: string;
  sourceUrl?: string;
  pageCount?: number;
  addedAt: string;
}

export interface ReferenceAnnotation {
  id: string;
  attachmentId?: string;
  page?: number;
  quote?: string;
  note?: string;
  color?: string;
  tags?: string[];
  createdAt: string;
  createdBy?: string;
}

export interface ReferenceRecord extends SharedReferenceInput {
  id: string;
  citeKey?: string;
  importedFrom: ReferenceImportFormat[];
  tags: string[];
  collections: string[];
  favorite?: boolean;
  attachments: ReferenceAttachment[];
  annotations: ReferenceAnnotation[];
  createdAt: string;
  updatedAt: string;
  duplicateOf?: string;
  sourceRecordIds?: string[];
  verification: ReferenceVerificationState;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationAuthority?: string;
  retraction?: {
    detected: boolean;
    source: string;
    checkedAt: string;
    details?: string;
    correction?: boolean;
    expressionOfConcern?: boolean;
  };
  history?: ReferenceVersion[];
}

export interface ReferenceVersion {
  version: number;
  changedAt: string;
  changedBy: string;
  reason?: string;
  snapshot: Omit<ReferenceRecord, 'history'>;
}

export interface DuplicateCandidate {
  recordId: string;
  candidateId: string;
  reason: 'DOI' | 'PMID' | 'ISBN' | 'TITLE' | 'AUTHOR_YEAR_TITLE';
  confidence: number;
  action: 'REVIEW' | 'KEEP_DISTINCT' | 'MERGE';
}

export interface ReferenceHubSnapshot {
  records: ReferenceRecord[];
  duplicateCandidates: DuplicateCandidate[];
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

function normalizeIdentifier(value?: string): string {
  return stableText(value).replace(/[^\p{L}\p{N}]+/gu, '');
}

function titleKey(record: Pick<ReferenceRecord, 'title'>): string {
  return normalizeIdentifier(record.title);
}

function authorYearTitleKey(record: Pick<ReferenceRecord, 'title' | 'authors' | 'year'>): string {
  return `${normalizeIdentifier(record.authors)}|${record.year ?? ''}|${titleKey(record)}`;
}

function recordVerification(record: ReferenceRecord): ReferenceVerificationState {
  const result = createReference(record);
  if (result.status === 'INVALID') return 'INVALID';
  if (record.retraction?.detected) return 'RETRACTED';
  if (record.verifiedBy && record.verifiedAt) return 'VALIDATED';
  return 'VALIDATION_REQUIRED';
}

export function createReferenceRecord(input: SharedReferenceInput & {
  id: string;
  citeKey?: string;
  importedFrom?: ReferenceImportFormat[];
  tags?: string[];
  collections?: string[];
  favorite?: boolean;
  attachments?: ReferenceAttachment[];
  annotations?: ReferenceAnnotation[];
  verification?: ReferenceVerificationState;
  retraction?: ReferenceRecord['retraction'];
}): ReferenceRecord {
  const timestamp = now();
  const record: ReferenceRecord = {
    ...input,
    id: input.id,
    citeKey: input.citeKey,
    importedFrom: input.importedFrom ?? ['MANUAL'],
    tags: input.tags ?? [],
    collections: input.collections ?? [],
    favorite: input.favorite ?? false,
    attachments: input.attachments ?? [],
    annotations: input.annotations ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    verification: 'DETECTED',
    retraction: input.retraction,
  };

  record.verification = input.verification ?? recordVerification(record);
  return record;
}

export function updateReferenceRecord(
  record: ReferenceRecord,
  patch: Partial<SharedReferenceInput> & {
    citeKey?: string;
    tags?: string[];
    collections?: string[];
    favorite?: boolean;
    attachments?: ReferenceAttachment[];
    annotations?: ReferenceAnnotation[];
    verifiedBy?: string;
    verifiedAt?: string;
    verificationAuthority?: string;
    retraction?: ReferenceRecord['retraction'];
  },
  changedBy = 'current-user',
  reason?: string,
): ReferenceRecord {
  const previousSnapshot = { ...record, history: undefined } as Omit<ReferenceRecord, 'history'>;
  const nextVersion = (record.history?.length ?? 0) + 1;
  const updatedBase: ReferenceRecord = {
    ...record,
    ...patch,
    id: record.id,
    importedFrom: record.importedFrom,
    tags: patch.tags ?? record.tags,
    collections: patch.collections ?? record.collections,
    favorite: patch.favorite ?? record.favorite,
    attachments: patch.attachments ?? record.attachments,
    annotations: patch.annotations ?? record.annotations,
    createdAt: record.createdAt,
    updatedAt: now(),
    verification: record.verification,
  };

  const updated: ReferenceRecord = {
    ...updatedBase,
    verification: recordVerification(updatedBase),
    history: [
      ...(record.history ?? []),
      { version: nextVersion, changedAt: now(), changedBy, reason, snapshot: previousSnapshot },
    ],
  };
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
        result.push({ recordId: a.id, candidateId: b.id, reason: 'DOI', confidence: 1, action: 'REVIEW' });
        continue;
      }
      const aPmid = normalizeIdentifier(a.pmid);
      const bPmid = normalizeIdentifier(b.pmid);
      if (aPmid && bPmid && aPmid === bPmid) {
        result.push({ recordId: a.id, candidateId: b.id, reason: 'PMID', confidence: 1, action: 'REVIEW' });
        continue;
      }
      const aIsbn = normalizeIdentifier(a.isbn);
      const bIsbn = normalizeIdentifier(b.isbn);
      if (aIsbn && bIsbn && aIsbn === bIsbn) {
        result.push({ recordId: a.id, candidateId: b.id, reason: 'ISBN', confidence: 1, action: 'REVIEW' });
        continue;
      }
      if (titleKey(a) && titleKey(a) === titleKey(b)) {
        result.push({ recordId: a.id, candidateId: b.id, reason: 'TITLE', confidence: 0.95, action: 'REVIEW' });
        continue;
      }
      if (authorYearTitleKey(a) && authorYearTitleKey(a) === authorYearTitleKey(b)) {
        result.push({ recordId: a.id, candidateId: b.id, reason: 'AUTHOR_YEAR_TITLE', confidence: 0.9, action: 'REVIEW' });
      }
    }
  }
  return result;
}

export function markDuplicateDistinct(candidate: DuplicateCandidate): DuplicateCandidate {
  return { ...candidate, action: 'KEEP_DISTINCT' };
}

/** Explicit researcher action. This does not imply that the external authority was checked. */
export function markReferenceVerified(
  record: ReferenceRecord,
  verifiedBy: string,
  verifiedAt = now(),
  authority = 'researcher-confirmed',
): ReferenceRecord {
  return {
    ...updateReferenceRecord(record, { verifiedBy, verifiedAt, verificationAuthority: authority }, verifiedBy, 'Explicit verification'),
    verification: record.retraction?.detected ? 'RETRACTED' : 'VALIDATED',
  };
}

export function createHubSnapshot(records: ReferenceRecord[]): ReferenceHubSnapshot {
  return { records: [...records], duplicateCandidates: detectDuplicateCandidates(records) };
}

export const REFERENCE_COMPATIBILITY_CAPABILITIES = {
  EndNote: ['ENDNOTE_XML', 'RIS', 'custom styles', 'reference updates'],
  Zotero: ['RIS', 'BIBTEX', 'CSL_JSON', 'PDF', 'annotations', 'collections'],
  Mendeley: ['RIS', 'BIBTEX', 'PDF', 'annotations', 'groups'],
  Paperpile: ['RIS', 'BIBTEX', 'PDF', 'collections', 'annotations'],
  Word: ['in-text citations', 'bibliography'],
  GoogleDocs: ['in-text citations', 'bibliography'],
  LibreOffice: ['in-text citations', 'bibliography'],
  LaTeX: ['BibTeX', 'citation keys'],
} as const;

export const SUPPORTED_REFERENCE_KINDS: SharedReferenceKind[] = [
  'JOURNAL_ARTICLE', 'BOOK', 'REPORT', 'WEBPAGE', 'LAW', 'REGULATION',
  'NOU', 'PROPOSITION', 'TREATY', 'GUIDELINE', 'THESIS', 'OTHER'
];

