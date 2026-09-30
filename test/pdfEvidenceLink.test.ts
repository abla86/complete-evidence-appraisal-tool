import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEvidenceFromPdfAnnotation,
  createPdfEvidenceAnnotation,
  linkPdfAnnotationToEvidence,
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
