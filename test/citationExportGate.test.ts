import assert from 'node:assert/strict';
import test from 'node:test';
import { createReferenceRecord } from '../src/services/referenceHubService';
import type { AcademicClaim, EvidenceExtraction } from '../src/domain/academicEvidence';
import { evaluateCitationExportGate } from '../src/services/citationExportGate';

const now = new Date().toISOString();

function claim(status: AcademicClaim['status'] = 'SUPPORTED'): AcademicClaim {
  return {
    id: 'claim-1',
    text: 'Studien rapporterer dette.',
    supportingEvidenceIds: ['e1'],
    contradictoryEvidenceIds: [],
    status,
    createdAt: now,
    updatedAt: now,
    authorId: 'u1',
  };
}

const evidence: EvidenceExtraction[] = [{
  id: 'e1',
  sourceRecordId: 'r1',
  excerpt: 'Exact source passage.',
  location: { page: '10' },
  evidenceType: 'QUOTE',
  extractedBy: 'u1',
  extractedAt: now,
  linkedClaims: ['claim-1'],
  researcherVerified: true,
}];

const reference = createReferenceRecord({
  id: 'r1',
  kind: 'JOURNAL_ARTICLE',
  title: 'Example title',
  authors: 'Example, A.',
  year: 2024,
  journal: 'Example Journal',
  importedFrom: ['MANUAL'],
  tags: [],
  collections: [],
});

test('export gate blocks an unverified reference', () => {
  const result = evaluateCitationExportGate([claim()], evidence, [reference]);
  assert.equal(result.allowed, false);
  assert.ok(result.blockingReasons.some(reason => reason.includes('ikke bibliografisk verifisert')));
});

test('export gate allows a supported claim with verified reference', () => {
  const verified = {
    ...reference,
    verifiedBy: 'u1',
    verifiedAt: now,
    verification: 'VALIDATED' as const,
  };
  const result = evaluateCitationExportGate([claim()], evidence, [verified]);
  assert.equal(result.allowed, true);
  assert.equal(result.blockingReasons.length, 0);
});

test('export gate blocks contradictory claims', () => {
  const result = evaluateCitationExportGate([claim('CONTRADICTED')], evidence, [reference]);
  assert.equal(result.allowed, false);
});
