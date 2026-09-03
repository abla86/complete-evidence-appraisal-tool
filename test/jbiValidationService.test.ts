import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JbiQualitativeValidationService
} from '../src/services/jbiValidationService.ts';
import type { AssessmentStatus, JBIEvaluationItem } from '../src/types.ts';

test('normalizes canonical assessment statuses', () => {
  assert.equal(JbiQualitativeValidationService.normalizeStatus('yes'), 'Ja');
  assert.equal(JbiQualitativeValidationService.normalizeStatus('NO'), 'Nei');
  assert.equal(JbiQualitativeValidationService.normalizeStatus('unclear'), 'Uklart');
  assert.equal(JbiQualitativeValidationService.normalizeStatus('N/A'), 'Ikke relevant');
});

test('computeScore is deterministic for a complete JBI assessment', () => {
  const statuses: AssessmentStatus[] = [
    'Ja','Ja','Ja','Ja','Ja',
    'Ja','Ja','Ja','Ja','Ja'
  ];
  const items: JBIEvaluationItem[] = statuses.map((status, index) => ({
    questionId: index + 1,
    status,
    justification: 'Dokumentert i studien.',
  }));

  const result = JbiQualitativeValidationService.computeScore(items, 10);

  assert.deepEqual(result, {
    ja: 10,
    nei: 0,
    uklart: 0,
    ikkeRelevant: 0,
    total: 10,
    answered: 10,
    unanswered: 0,
    completenessPercent: 100,
    jaScorePercent: 100,
    applicableTotal: 10,
    applicableJaPercent: 100
  });
});

test('Cohen kappa returns 1 for identical ratings', () => {
  const items: JBIEvaluationItem[] = Array.from({ length: 10 }, (_, index) => ({
    questionId: index + 1,
    status: index < 5 ? 'Ja' : 'Nei',
    justification: 'Dokumentert i studien.',
  }));

  const result = JbiQualitativeValidationService.calculateInterRaterAgreement(items, items);

  assert.equal(result.totalItems, 10);
  assert.equal(result.agreedCount, 10);
  assert.equal(result.disagreedCount, 0);
  assert.equal(result.percentAgreement, 100);
  assert.equal(result.cohensKappa, 1);
});
