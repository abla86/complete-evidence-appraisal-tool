import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEvidenceFromPdfAnnotation,
  createPdfEvidenceAnnotation,
  linkPdfAnnotationToEvidence,
  linkPdfAnnotationToClaim,
} from '../src/services/evidenceLinkService';

test('PDF annotation becomes page-aware EvidenceExtraction and keeps source identity', () => {
  const annotation = createPdfEvidenceAnnotation({
    sourceRecordId: 'source-123',
    page: 7,
    quote: 'The intervention improved adherence.',
    coordinates: [{ x: 0.1, y: 0.2, width: 0.5, height: 0.03 }],
    createdBy: 'researcher-1',
    researcherVerified: false,
  });

  const evidence = createEvidenceFromPdfAnnotation(annotation, 'researcher-1');
  assert.equal(evidence.sourceRecordId, 'source-123');
  assert.equal(evidence.excerpt, annotation.quote);
  assert.deepEqual(evidence.location, { page: '7' });
  assert.equal(evidence.researcherVerified, false);

  const linked = linkPdfAnnotationToEvidence(annotation, evidence);
  assert.equal(linked.evidenceId, evidence.id);
});

test('PDF annotation/evidence linkage rejects mismatched source records', () => {
  const annotation = createPdfEvidenceAnnotation({
    sourceRecordId: 'source-a',
    page: 2,
    quote: 'Exact quote',
    createdBy: 'researcher-1',
    researcherVerified: false,
  });
  const evidence = createEvidenceFromPdfAnnotation(
    { ...annotation, sourceRecordId: 'source-b' },
    'researcher-1',
  );

  assert.throws(
    () => linkPdfAnnotationToEvidence(annotation, evidence),
    /same SourceRecord/,
  );
});

test('PDF annotation can be linked through EvidenceExtraction to an AcademicClaim', async () => {
  const annotation = createPdfEvidenceAnnotation({
    sourceRecordId: 'source-claim',
    page: 4,
    quote: 'The intervention improved adherence.',
    createdBy: 'researcher-1',
    researcherVerified: false,
  });
  const evidence = createEvidenceFromPdfAnnotation(annotation, 'researcher-1');
  const claim = {
    id: 'claim-1',
    text: 'The intervention improved adherence.',
    supportingEvidenceIds: [],
    contradictoryEvidenceIds: [],
    status: 'NEEDS_REVIEW' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'researcher-1',
  };
  const context = { evidence: [evidence], claims: [claim], pdfLinks: [] };
  const { AuditTrailService } = await import('../src/services/auditTrailService');
  const audit = new AuditTrailService();
  const linked = linkPdfAnnotationToClaim(annotation, evidence, claim, context, audit);
  assert.equal(linked.evidenceId, evidence.id);
  assert.equal(linked.claimId, claim.id);
  assert.deepEqual(claim.supportingEvidenceIds, [evidence.id]);
  assert.deepEqual(evidence.linkedClaims, [claim.id]);
});
