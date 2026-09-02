export type ReferenceSourceSystem =
  | 'manual' | 'endnote' | 'zotero' | 'mendeley' | 'paperpile' | 'ris'
  | 'bibtex' | 'csl-json' | 'crossref' | 'pubmed' | 'openalex' | 'doi' | 'other';

export type ReferenceStatus = 'DRAFT' | 'VALIDATION_REQUIRED' | 'VALIDATED' | 'RETRACTED' | 'INVALID';
export type AttachmentKind = 'PDF' | 'SUPPLEMENT' | 'DATASET' | 'OTHER';

export interface ReferenceAttachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  mimeType: string;
  sha256?: string;
  sourceUrl?: string;
  pageCount?: number;
}

export interface ReferenceAnnotation {
  id: string;
  attachmentId: string;
  page?: number;
  quote?: string;
  note: string;
  color?: string;
  tags?: string[];
  createdAt: string;
  createdBy: string;
}

export interface ReferenceRecord {
  id: string;
  type: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  articleNumber?: string;
  publisher?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  isbn?: string;
  issn?: string;
  url?: string;
  abstract?: string;
  language?: string;
  tags: string[];
  collections: string[];
  sourceSystems: ReferenceSourceSystem[];
  status: ReferenceStatus;
  verification?: { verifiedBy: string; verifiedAt: string; authority: string };
  retraction?: { detected: boolean; source: string; checkedAt: string; details?: string };
  attachments: ReferenceAttachment[];
  annotations: ReferenceAnnotation[];
  citationKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceDuplicateCandidate {
  referenceId: string;
  candidateId: string;
  reason: 'DOI' | 'PMID' | 'ISBN' | 'TITLE_SIMILARITY' | 'AUTHOR_YEAR_TITLE';
  confidence: number;
  action: 'REVIEW' | 'KEEP_DISTINCT' | 'MERGE';
}

export interface ReferenceImportResult {
  references: ReferenceRecord[];
  duplicateCandidates: ReferenceDuplicateCandidate[];
  warnings: string[];
  errors: string[];
  sourceSystem: ReferenceSourceSystem;
}

export const REFERENCE_INTEROPERABILITY = {
  import: ['EndNote XML', 'RIS', 'BibTeX', 'CSL JSON', 'CSV', 'JSON', 'DOI', 'PMID', 'ISBN', 'PDF'],
  export: ['EndNote XML', 'RIS', 'BibTeX', 'CSL JSON', 'CSV', 'JSON'],
  citation: ['APA 7', 'Vancouver/NLM', 'Harvard', 'Chicago', 'MLA 9', 'IEEE', 'CSL journal styles'],
  writing: ['Microsoft Word', 'Google Docs', 'LibreOffice', 'LaTeX'],
} as const;
