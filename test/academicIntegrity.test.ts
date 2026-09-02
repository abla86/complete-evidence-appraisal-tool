import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAcademicIntegrity } from '../src/domain/academicEvidence';
import { runCitationAudit } from '../src/services/citationAuditService';
import { createReferenceRecord } from '../src/services/referenceHubService';

test('blocks unsupported claims', () => {
  const report = evaluateAcademicIntegrity([
    {
      id: 'c1', text: 'Studien viser en effekt.', supportingEvidenceIds: [], contradictoryEvidenceIds: [],
      status: 'UNVERIFIED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), authorId: 'u1'
    }
  ], [], new Set());
  assert.equal(report.canExport, false);
  assert.ok(report.issues.some(issue => issue.code === 'UNSUPPORTED_CLAIM'));
});

test('citation audit requires verified source and researcher-checked evidence', () => {
  const reference = createReferenceRecord({
    id: 'r1', kind: 'JOURNAL_ARTICLE', title: 'Example title', authors: 'Example, A.', year: 2024,
    journal: 'Example Journal', importedFrom: ['MANUAL'], tags: [], collections: []
  });
  const evidence = [{
    id: 'e1', sourceRecordId: 'r1', excerpt: 'Exact source text.', location: { page: '10' },
    evidenceType: 'QUOTE' as const, extractedBy: 'u1', extractedAt: new Date().toISOString(), linkedClaims: ['c1'], researcherVerified: true
  }];
  const claim = {
    id: 'c1', text: 'Studien rapporterer dette.', supportingEvidenceIds: ['e1'], contradictoryEvidenceIds: [],
    status: 'SUPPORTED' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), authorId: 'u1'
  };
  const blocked = runCitationAudit([claim], evidence, [reference]);
  assert.equal(blocked.canExport, false);
  const verified = { ...reference, verifiedBy: 'u1', verifiedAt: new Date().toISOString(), verification: 'VALIDATED' as const };
  const allowed = runCitationAudit([claim], evidence, [verified]);
  assert.equal(allowed.canExport, true);
});
