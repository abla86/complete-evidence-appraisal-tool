import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectPrivacy } from '../src/services/privacyInspector';
import { inspectAccessibility } from '../src/services/accessibilityInspector';
import { createApa7JournalReference } from '../src/services/sharedReferenceEngine';

test('privacy module follows shared contract and is local-only', () => {
  const result = inspectPrivacy({
    sourceUrl: 'https://example.test/article',
    externalUrls: [
      'https://cdn.example.org/app.js',
      'https://www.google-analytics.com/analytics.js',
      'https://cdn.example.org/app.js',
    ],
    analyzedAt: '2026-09-02T18:00:00.000Z',
  });

  assert.equal(result.sourceUrl, 'https://example.test/article');
  assert.equal(result.externalResourceCount, 3);
  assert.equal(result.trackingIndicatorCount, 1);
  assert.deepEqual(result.trackingHosts, ['www.google-analytics.com']);
  assert.equal(result.localOnlyAnalysis, true);
});

test('accessibility module emits signals without claiming conformance', () => {
  const result = inspectAccessibility({
    sourceUrl: 'https://example.test/article',
    images: [
      { hasAlt: false, alt: '' },
      { hasAlt: true, alt: '' },
      { hasAlt: true, alt: 'Figure 1' },
    ],
    buttons: [
      { text: '' },
      { ariaLabel: 'Analyze' },
    ],
    h1Count: 2,
    mainLandmarkCount: 1,
    headingCount: 7,
    analyzedAt: '2026-09-02T18:01:00.000Z',
  });

  assert.equal(result.missingAlt, 1);
  assert.equal(result.emptyAlt, 1);
  assert.equal(result.unnamedButtons, 1);
  assert.equal(result.checksAreSignals, true);
});

test('reference engine remains the single formatting boundary', () => {
  const result = createApa7JournalReference({
    authors: 'Hansen, K.; Olsen, P. A.',
    year: 2023,
    title: 'Effekt av tiltak X',
    journal: 'Norsk Tidsskrift for Forskning',
    volume: '12',
    issue: '3',
    pages: '45–58',
    doi: 'https://doi.org/10.1000/abc.123',
  });

  assert.equal(result.status, 'VALIDATION_REQUIRED');
  assert.equal(result.verified, false);
  assert.match(result.draft, /10\.1000\/abc\.123/);
});
