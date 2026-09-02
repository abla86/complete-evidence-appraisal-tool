import type { ReferenceRecord as DomainReferenceRecord } from '../domain/referenceHub';
import type { ReferenceRecord as ServiceReferenceRecord } from './referenceHubService';

/** Converts the older service model to the richer domain Reference Hub model. */
export function toDomainReference(record: ServiceReferenceRecord): DomainReferenceRecord {
  return {
    id: record.id,
    type: String(record.kind || 'OTHER'),
    title: record.title || '',
    authors: record.authors ? [record.authors] : [],
    year: typeof record.year === 'number' ? record.year : undefined,
    journal: record.journal,
    volume: record.volume ? String(record.volume) : undefined,
    issue: record.issue ? String(record.issue) : undefined,
    pages: record.pages,
    articleNumber: record.articleNumber,
    publisher: record.publisher,
    doi: record.doi,
    url: record.url,
    tags: record.tags ?? [],
    collections: record.collections ?? [],
    sourceSystems: ['manual'],
    status: record.verification === 'VALIDATED' ? 'VALIDATED' : record.verification === 'INVALID' ? 'INVALID' : 'VALIDATION_REQUIRED',
    verification: record.verifiedBy && record.verifiedAt ? {
      verifiedBy: record.verifiedBy,
      verifiedAt: record.verifiedAt,
      authority: 'explicit researcher confirmation',
    } : undefined,
    attachments: (record.attachments ?? []).map(a => ({
      id: a.id,
      kind: a.kind === 'PDF' ? 'PDF' : a.kind === 'SUPPLEMENT' ? 'SUPPLEMENT' : 'OTHER',
      name: a.name,
      mimeType: a.mimeType ?? 'application/octet-stream',
      sha256: a.sha256,
      sourceUrl: a.sourceUrl,
    })),
    annotations: (record.annotations ?? []).map(a => ({
      id: a.id,
      attachmentId: record.attachments.find(att => att.id === a.id)?.id ?? '',
      page: a.page ? Number(a.page) || undefined : undefined,
      quote: a.quote,
      note: a.note ?? '',
      color: a.color,
      createdAt: a.createdAt,
      createdBy: record.verifiedBy ?? 'current-user',
    })),
    citationKey: record.citeKey,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
