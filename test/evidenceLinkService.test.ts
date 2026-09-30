import test from 'node:test';
import assert from 'node:assert/strict';
import { createPdfEvidenceAnnotation } from '../src/services/evidenceLinkService';

test('PDF evidence annotation requires a page, quote and valid coordinates', () => {
  const annotation = createPdfEvidenceAnnotation({
    sourceRecordId: 'src-1',
    page: 4,
    quote: 'Exact source wording',
    coordinates: [{ x: 10, y: 20, width: 100, height: 12 }],
    createdBy: 'reviewer-1',
    researcherVerified: false,
  });
  assert.equal(annotation.page, 4);
  assert.equal(annotation.quote, 'Exact source wording');
  assert.equal(annotation.coordinates[0].width, 100);
});

test('PDF evidence annotation rejects invalid page and coordinates', () => {
  assert.throws(() => createPdfEvidenceAnnotation({
    sourceRecordId: 'src-1',
    page: 0,
    quote: 'Quote',
    coordinates: [{ x: 0, y: 0, width: 10, height: 10 }],
    createdBy: 'reviewer-1',
    researcherVerified: false,
  }), /page/);

  assert.throws(() => createPdfEvidenceAnnotation({
    sourceRecordId: 'src-1',
    page: 1,
    quote: 'Quote',
    coordinates: [{ x: 0, y: 0, width: 0, height: 10 }],
    createdBy: 'reviewer-1',
    researcherVerified: false,
  }), /coordinates/);
});
