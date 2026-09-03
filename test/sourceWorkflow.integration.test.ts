import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { AuditTrailService } from '../src/services/auditTrailService';
import { intakeSourceRecord } from '../src/services/sourceIntakeService';
import type { SourceRecord } from '../src/domain/sourceRecord';
import { validateSourceRecord } from '../src/services/validateSourceRecord';

// The remaining workflow tests in this file intentionally verify that intake
// keeps reference provenance separate from source verification. Imported or
// structurally complete metadata is not equivalent to external verification.

declare const fixture: () => SourceRecord;
declare const actor: { id: string; role: 'reviewer' | 'admin' | 'system' };

describe('Reference verification semantics', () => {
  test('intake does not turn a draft reference into a verified reference', async () => {
    const audit = new AuditTrailService();
    let stored: SourceRecord | undefined;
    const result = await intakeSourceRecord(
      fixture(),
      actor,
      {
        getRecord: () => stored,
        saveRecord: record => { stored = record; },
      },
      audit,
    );

    assert.equal(result.accepted, true);
    assert.equal(result.record.referenceDraft.status, 'complete');
    assert.equal(audit.list()[0].detail.doiFormatValid, true);
    assert.equal(audit.list()[0].action, 'SOURCE_RECORD_INTAKE');
    assert.equal(audit.list()[0].detail.referenceVerified, false);
    assert.equal(validateSourceRecord(result.record).ok, true);
  });
});
