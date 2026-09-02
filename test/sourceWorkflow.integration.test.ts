import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { intakeSourceRecord, linkRecordToScreeningBatch, transitionScreeningState, attachReviewedRecordToPico } from '../src/services/sourceIntakeService';
import { AuditTrailService } from '../src/services/auditTrailService';
import { validateSourceRecord } from '../src/services/validateSourceRecord';
import type { SourceRecord } from '../src/domain/sourceRecord';

const actor = { id: 'reviewer-1', role: 'reviewer' as const };

function fixture(): SourceRecord {
  return {
    schemaVersion: '1.0.0',
    recordId: '00000000-0000-4000-8000-000000000001',
    source: { url: 'https://example.org/article', capturedAt: '2026-09-02T17:30:00.000Z' },
    metadata: {
      sourceUrl: 'https://example.org/article',
      detectedAt: '2026-09-02T17:30:00.000Z',
      detectedFrom: ['citation-meta'],
      status: 'COMPLETE',
      missingFields: [],
      title: 'Effekt av tiltak X',
      authors: ['Hansen, Kari', 'Olsen, Per A.'],
      publicationDate: '2023/05/12',
      journal: 'Norsk Tidsskrift for Forskning',
      volume: '12',
      issue: '3',
      firstPage: '45',
      lastPage: '58',
      doi: '10.1000/abc.123',
      issn: '1234-5678',
    },
    identifiers: {
      doi: {
        normalized: '10.1000/abc.123',
        formatValid: true,
        raw: 'https://doi.org/10.1000/abc.123',
        resolverUrl: 'https://doi.org/10.1000/abc.123',
      },
    },
    referenceDraft: {
      apa7: 'Hansen, K., & Olsen, P. A. (2023). Effekt av tiltak X. Norsk Tidsskrift for Forskning, 12(3), 45–58. https://doi.org/10.1000/abc.123',
      status: 'complete',
      note: 'Draft – detected metadata, not verified against source',
    },
    legalReference: null,
    privacy: {
      sourceUrl: 'https://example.org/article',
      analyzedAt: '2026-09-02T17:30:00.000Z',
      externalResourceCount: 0,
      externalHosts: [],
      trackingIndicatorCount: 0,
      trackingHosts: [],
      signals: [],
      localOnlyAnalysis: true,
      localOnly: true,
    },
    provenance: {
      tool: 'research-privacy-inspector',
      toolVersion: '0.3.0',
      collectedLocally: true,
      externalRequestsMade: false,
      collectedAt: '2026-09-02T17:30:00.000Z',
    },
  };
}

describe('SourceRecord → intake → PRISMA/PICO linkage', () => {
  test('rejects malformed source records before intake', () => {
    const audit = new AuditTrailService();
    const result = intakeSourceRecord({} as SourceRecord, actor, { getRecord: () => undefined, saveRecord() {} }, audit);
    assert.equal(result.accepted, false);
    assert.equal(result.reason, 'schema-violation');
    assert.equal(audit.list().length, 0);
  });

  test('records each workflow transition as a separate audit event', () => {
    const audit = new AuditTrailService();
    let stored: SourceRecord | undefined;
    const store = {
      getRecord: (id: string) => stored?.recordId === id ? stored : undefined,
      saveRecord: (record: SourceRecord) => { stored = record; },
    };

    const intake = intakeSourceRecord(fixture(), actor, store, audit);
    assert.equal(intake.accepted, true);
    stored = intake.record;

    const linked = linkRecordToScreeningBatch(stored, 'batch-001', actor, audit);
    assert.equal(linked.linked, true);
    stored = linked.record;

    const reviewed = transitionScreeningState(stored, 'reviewed', actor, audit, 'dual-review complete');
    assert.equal(reviewed.transitioned, true);
    stored = reviewed.record;

    const attached = attachReviewedRecordToPico(stored, 'pico-001', actor, audit);
    assert.equal(attached.attached, true);

    assert.equal(audit.list().length, 4);
    assert.equal(audit.verify().valid, true);
    assert.deepEqual(audit.list().map((entry) => entry.action), [
      'SOURCE_RECORD_INTAKE',
      'RECORD_LINKED_TO_BATCH',
      'SCREENING_STATE_CHANGED',
      'RECORD_ATTACHED_TO_PICO',
    ]);
  });
});


describe('Reference verification semantics', () => {
  test('intake does not turn a draft reference into a verified reference', () => {
    const audit = new AuditTrailService();
    let stored: SourceRecord | undefined;
    const result = intakeSourceRecord(fixture(), actor, {
      getRecord: () => stored,
      saveRecord: (record) => { stored = record; },
    }, audit);
    assert.equal(result.accepted, true);
    assert.equal(result.record.referenceDraft.status, 'complete');
    assert.equal(audit.list()[0].detail.doiFormatValid, true);
    assert.equal(audit.list()[0].action, 'SOURCE_RECORD_INTAKE');
    assert.notEqual(audit.list()[0].detail, undefined);
    assert.equal(validateSourceRecord(result.record).ok, true);
  });
});
