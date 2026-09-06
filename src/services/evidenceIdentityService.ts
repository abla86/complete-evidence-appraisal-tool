import type { ReferenceRecord } from './referenceHubService';

export interface SourceIdentityLike {
  recordId: string;
  identifiers?: { doi?: string; pmid?: string; pmcid?: string; isbn?: string; issn?: string };
  metadata?: { fields?: Record<string, unknown> };
  referenceDraft?: { doi?: string | null };
}

function norm(value?: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/^https?:\/\/doi\.org\//, '').replace(/^doi:\s*/i, '');
}

function fields(source: SourceIdentityLike) {
  const raw = source.metadata?.fields ?? {};
  return {
    doi: norm(source.identifiers?.doi ?? source.referenceDraft?.doi ?? raw.doi),
    pmid: norm(source.identifiers?.pmid ?? raw.pmid),
    pmcid: norm(source.identifiers?.pmcid ?? raw.pmcid ?? raw.pubmedCentralId),
    isbn: norm(source.identifiers?.isbn ?? raw.isbn),
    issn: norm(source.identifiers?.issn ?? raw.issn),
  };
}

export function resolveReferenceForSource(source: SourceIdentityLike, references: ReferenceRecord[]): ReferenceRecord | null {
  const ids = fields(source);
  const explicit = references.find(reference =>
    reference.sourceRecordIds?.includes(source.recordId)
  );
  if (explicit) return explicit;
  return references.find(reference =>
    (ids.doi && norm(reference.doi) === ids.doi) ||
    (ids.pmid && norm(reference.pmid) === ids.pmid) ||
    (ids.pmcid && norm(reference.pmcid) === ids.pmcid) ||
    (ids.isbn && norm(reference.isbn) === ids.isbn) ||
    (ids.issn && norm(reference.issn) === ids.issn)
  ) ?? null;
}

export function sameReference(a: ReferenceRecord, b: ReferenceRecord): boolean {
  const identifiers = ['doi', 'pmid', 'pmcid', 'isbn', 'issn'] as const;
  return identifiers.some(key => {
    const left = norm(a[key]);
    const right = norm(b[key]);
    return Boolean(left && right && left === right);
  }) || a.id === b.id;
}

