import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { AuditTrailService } from '../src/services/auditTrailService';
import { intakeSourceRecord } from '../src/services/sourceIntakeService';
import type { SourceRecord } from '../src/domain/sourceRecord';
import { validateSourceRecord } from '../src/services/validateSourceRecord';

function fixture(): SourceRecord {
  const now = '2026-09-02T18:00:00.000Z';
  return {
    schemaVersion: '1.0.0',
    recordId: '00000000-0000-4000-8000-000000000001',
    source: { url: 'https://example.org/article', capturedAt: now },
    metadata: {
      sourceUrl: 'https://example.org/article', title: 'Test article', authors: ['Doe, J.'], publicationDate: '2026',
      journal: 'Example Journal', volume: '1', issue: '1', detectedAt: now, detectedFrom: ['manual'], status: 'COMPLETE', missingFields: [],
    },
    identifiers: { doi: { normalized: '10.1000/test', formatValid: true, raw: '10.1000/test', resolverUrl: 'https://doi.org/10.1000/test' } },
    referenceDraft: { apa7: 'Doe, J. (2026). Test article. Example Journal.', status: 'complete', note: 'Draft – detected metadata, not verified against source' },
    legalReference: null,
    privacy: { sourceUrl: 'https://example.org/article', analyzedAt: now, externalResourceCount: 0, externalHosts: [], trackingIndicatorCount: 0, trackingHosts: [], signals: [], localOnlyAnalysis: true, localOnly: true },
    provenance: { tool: 'source-workflow-test', toolVersion: '1.0.0', collectedLocally: true, externalRequestsMade: false, collectedAt: now },
  };
}

const actor = { id: 'reviewer-1', role: 'reviewer' as const };

describe('Reference verification semantics', () => {
  test('intake does not turn a draft reference into a verified reference', async () => {
    const audit = new AuditTrailService();
    let stored: SourceRecord | undefined;
    const result = await intakeSourceRecord(fixture(), actor, {
      getRecord: () => stored,
      saveRecord: record => { stored = record; },
    }, audit);

    assert.equal(result.accepted, true);
    assert.equal(result.record.referenceDraft.status, 'complete');
    assert.equal(audit.list()[0].detail.doiFormatValid, true);
    assert.equal(audit.list()[0].action, 'SOURCE_RECORD_INTAKE');
    assert.equal(audit.list()[0].detail.referenceVerified, false);
    assert.equal(validateSourceRecord(result.record).ok, true);
  });
});
