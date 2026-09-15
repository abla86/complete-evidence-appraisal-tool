import { describe, expect, it } from 'vitest';
import { analyseTraceCases, compareSequence, parseCsv } from './implementationTrace';

describe('implementation trace analysis', () => {
  it('parses quoted CSV fields containing commas', () => {
    const cases = parseCsv('CaseId,Timestamp,Activity,PerformedBy\nC1,2026-01-01 08:00:00,"Assessment, initial",Nurse');
    expect(cases.C1[0].activity).toBe('Assessment, initial');
  });

  it('detects missing, unexpected, order and duplicate activities', () => {
    const result = compareSequence(['Assessment', 'Intervention', 'FollowUp'], [
      'Intervention', 'Assessment', 'Intervention', 'Documentation'
    ]);
    expect(result.missing).toEqual(['FollowUp']);
    expect(result.unexpected).toEqual(['Documentation']);
    expect(result.orderViolations).toEqual(['Intervention → Assessment']);
    expect(result.duplicateExpected).toEqual(['Intervention']);
    expect(result.structurallyPass).toBe(false);
  });

  it('accepts a complete sequence as structurally compliant', () => {
    const result = compareSequence(['Assessment', 'Intervention', 'FollowUp'], ['Assessment', 'Intervention', 'FollowUp']);
    expect(result.presenceRate).toBe(100);
    expect(result.sequenceOk).toBe(true);
    expect(result.structurallyPass).toBe(true);
  });

  it('sorts events chronologically before analysis', () => {
    const results = analyseTraceCases(['Assessment', 'Intervention'], {
      C1: [
        { timestamp: '2026-01-01 09:00:00', activity: 'Intervention', performedBy: 'Nurse' },
        { timestamp: '2026-01-01 08:00:00', activity: 'Assessment', performedBy: 'Nurse' }
      ]
    });
    expect(results[0].actual).toEqual(['Assessment', 'Intervention']);
    expect(results[0].structurallyPass).toBe(true);
  });
});
