import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyseTraceCases, compareSequence, parseCsv } from './implementationTrace';

describe('implementation trace analysis', () => {
  it('parses quoted CSV fields containing commas', () => {
    const cases = parseCsv('CaseId,Timestamp,Activity,PerformedBy\nC1,2026-01-01 08:00:00,"Assessment, initial",Nurse');
    assert.equal(cases.C1[0].activity, 'Assessment, initial');
  });

  it('detects missing, unexpected, order and duplicate activities', () => {
    const result = compareSequence(['Assessment', 'Intervention', 'FollowUp'], [
      'Intervention', 'Assessment', 'Intervention', 'Documentation'
    ]);
    assert.deepEqual(result.missing, ['FollowUp']);
    assert.deepEqual(result.unexpected, ['Documentation']);
    assert.deepEqual(result.orderViolations, ['Intervention → Assessment']);
    assert.deepEqual(result.duplicateExpected, ['Intervention']);
    assert.equal(result.structurallyPass, false);
  });

  it('accepts a complete sequence as structurally compliant', () => {
    const result = compareSequence(['Assessment', 'Intervention', 'FollowUp'], ['Assessment', 'Intervention', 'FollowUp']);
    assert.equal(result.presenceRate, 100);
    assert.equal(result.sequenceOk, true);
    assert.equal(result.structurallyPass, true);
  });

  it('sorts events chronologically before analysis', () => {
    const results = analyseTraceCases(['Assessment', 'Intervention'], {
      C1: [
        { timestamp: '2026-01-01 09:00:00', activity: 'Intervention', performedBy: 'Nurse' },
        { timestamp: '2026-01-01 08:00:00', activity: 'Assessment', performedBy: 'Nurse' }
      ]
    });
    assert.deepEqual(results[0].actual, ['Assessment', 'Intervention']);
    assert.equal(results[0].structurallyPass, true);
  });
});
