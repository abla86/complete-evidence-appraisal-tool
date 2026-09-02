import assert from 'node:assert/strict';
import test from 'node:test';
import { validateReference } from '../src/services/referenceIntegrityService.ts';

test('validates Norwegian law using APA 7 Norwegian practice', () => {
  const result = validateReference({
    kind: 'LAW',
    shortTitle: 'Helsepersonelloven',
    year: 1999,
    officialTitle: 'Lov om helsepersonell m.v.',
    dateCode: 'LOV-1999-07-02-64',
    websiteName: 'Lovdata',
    url: 'https://lovdata.no/lov/1999-07-02-64'
  });

  assert.equal(result.status, 'VALIDATION_REQUIRED');
  assert.equal(result.canUseAsVerifiedReference, false);
  assert.equal(
    result.reference,
    'Helsepersonelloven. (1999). Lov om helsepersonell m.v. (LOV-1999-07-02-64). Lovdata. https://lovdata.no/lov/1999-07-02-64'
  );
  assert.equal(result.inTextParenthetical, '(Helsepersonelloven, 1999)');
});

test('adds section to in-text legal citation', () => {
  const result = validateReference({
    kind: 'REGULATION',
    shortTitle: 'Psykisk helsevernforskriften',
    year: 2011,
    officialTitle: 'Forskrift om etablering og gjennomføring av psykisk helsevern m.m.',
    dateCode: 'FOR-2011-12-16-1258',
    websiteName: 'Lovdata',
    url: 'https://lovdata.no/forskrift/2011-12-16-1258',
    section: '§ 2'
  });

  assert.equal(result.inTextParenthetical, '(Psykisk helsevernforskriften, 2011, § 2)');
});

test('fails closed when required legal metadata is missing', () => {
  const result = validateReference({
    kind: 'LAW',
    shortTitle: 'Opplæringslova',
    year: 2023,
    officialTitle: 'Lov om grunnskoleopplæringa og den vidaregåande opplæringa'
  });

  assert.equal(result.status, 'INVALID');
  assert.equal(result.canUseAsVerifiedReference, false);
  assert.ok(result.errors.some(e => e.includes('datokode')));
  assert.ok(result.errors.some(e => e.includes('nettsted')));
  assert.ok(result.errors.some(e => e.includes('URL')));
});

test('does not claim that valid syntax proves source truth', () => {
  const result = validateReference({
    kind: 'JOURNAL_ARTICLE',
    authors: 'Doe, J.',
    year: 2025,
    title: 'A study',
    journal: 'Example Journal',
    volume: 1,
    issue: 2,
    pages: '1-10',
    doi: '10.1234/example.1'
  });

  assert.equal(result.status, 'VALIDATION_REQUIRED');
  assert.equal(result.canUseAsVerifiedReference, false);
});

test('explicit verification requires verifier identity and timestamp', () => {
  const result = validateReference({
    kind: 'JOURNAL_ARTICLE',
    authors: 'Doe, J.',
    year: 2025,
    title: 'A study',
    journal: 'Example Journal',
    doi: '10.1234/example.1',
    verifiedBy: 'reviewer-1',
    verifiedAt: '2026-09-02T18:00:00.000Z'
  });

  assert.equal(result.status, 'VALIDATED');
  assert.equal(result.canUseAsVerifiedReference, true);
});
