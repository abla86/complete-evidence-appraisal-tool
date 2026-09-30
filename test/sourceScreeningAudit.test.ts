import assert from 'node:assert/strict';
import test from 'node:test';
import { transitionScreeningState } from '../src/services/sourceIntakeService';
import { createScreeningDecisionFromSourceRecord, applySourceRecordScreeningToWorkflow } from '../src/services/researchWorkflowBridge';
import { createResearchWorkflowFromText } from '../src/services/researchWorkflowService';
import type { SourceRecord } from '../src/domain/sourceRecord';

const record = {
  schemaVersion: '1.0.0',
  recordId: 'record-550e8400-e29b-41d4-a716-446655440000',
  source: { url: 'https://example.org/article', capturedAt: new Date().toISOString() },
  metadata: {
    sourceUrl: 'https://example.org/article', title: 'Example', authors: ['Doe'], publicationDate: '2025-01-01',
    journal: 'Journal', detectedAt: new Date().toISOString(), detectedFrom: ['manual'],
    status: 'COMPLETE', missingFields: [],
  },
  identifiers: { doi: null },
  referenceDraft: { apa7: 'Doe (2025). Example.', status: 'complete', note: 'Draft – detected metadata, not verified against source' },
  legalReference: null,
  privacy: { sourceUrl: 'https://example.org/article', analyzedAt: new Date().toISOString(), externalResourceCount: 0, externalHosts: [], trackingIndicatorCount: 0, trackingHosts: [], signals: [], localOnlyAnalysis: true, localOnly: true },
  provenance: { tool: 'test', toolVersion: '1', collectedLocally: true, externalRequestsMade: false, collectedAt: new Date().toISOString() },
  intake: { receivedAt: new Date().toISOString(), receivedFrom: 'test', screeningState: 'awaiting-review' },
} satisfies SourceRecord;

const audit = { append() {} };
const actor = { id: 'reviewer-1', role: 'reviewer' as const };

test('screening exclusion requires a documented reason', async () => {
  const result = await transitionScreeningState(record, 'excluded', actor, audit);
  assert.equal(result.transitioned, false);
  assert.equal(result.reason, 'exclusion-reason-required');
});

test('included screening requires explicit full-text inclusion', async () => {
  const result = await transitionScreeningState(record, 'included', actor, audit, 'Eligible after review');
  assert.equal(result.transitioned, false);
  assert.equal(result.reason, 'full-text-inclusion-required');
});

test('included screening records reviewer, decision and full-text provenance', async () => {
  const result = await transitionScreeningState(
    record,
    'reviewed',
    actor,
    audit,
    'Title/abstract eligible',
    { fullTextDecision: 'include' },
  );
  assert.equal(result.transitioned, true);
  assert.equal(result.record?.intake?.reviewerId, 'reviewer-1');
  assert.equal(result.record?.intake?.screeningDecision, 'uncertain');
  assert.equal(result.record?.intake?.fullTextDecision, 'include');
});


test('SourceRecord screening maps into canonical research workflow decision', () => {
  const included = structuredClone(record);
  included.intake = {
    ...included.intake,
    reviewerId: 'reviewer-1',
    screeningDecision: 'include',
    screeningReason: 'Meets eligibility criteria.',
    fullTextDecision: 'include',
  };
  const decision = createScreeningDecisionFromSourceRecord({ record: included, studyId: 'study-1' });
  assert.equal(decision.studyId, 'study-1');
  assert.equal(decision.reviewerId, 'reviewer-1');
  assert.equal(decision.decision, 'include');
  assert.equal(decision.eligibilityDecision, 'include');
});

test('SourceRecord cannot bypass explicit full-text inclusion', () => {
  const included = structuredClone(record);
  included.intake = {
    ...included.intake,
    reviewerId: 'reviewer-1',
    screeningDecision: 'include',
    screeningReason: 'Meets eligibility criteria.',
    fullTextDecision: 'pending',
  };
  assert.throws(
    () => createScreeningDecisionFromSourceRecord({ record: included }),
    /explicit full-text inclusion/,
  );
});


test('SourceRecord screening updates the canonical research workflow', () => {
  const included = structuredClone(record);
  included.intake = {
    ...included.intake,
    reviewerId: 'reviewer-1',
    screeningDecision: 'include',
    screeningReason: 'Meets eligibility criteria.',
    fullTextDecision: 'include',
  };
  const workflow = createResearchWorkflowFromText(
    'Methods: qualitative study. Participants described their experiences.',
    'study.txt',
    'study-1',
  );
  const updated = applySourceRecordScreeningToWorkflow(workflow, included);
  assert.equal(updated.screening.length, 1);
  assert.equal(updated.screening[0].studyId, 'study-1');
  assert.equal(updated.screening[0].decision, 'INCLUDED');
  assert.equal(updated.screening[0].reviewerId, 'reviewer-1');
});
