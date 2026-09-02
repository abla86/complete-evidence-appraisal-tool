import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApa7JournalReference, createNorwegianLawReference } from '../src/services/sharedReferenceEngine';

const collectorResult = {
  sourceUrl: 'https://academic.oup.com/jamia/article/30/1/12/6762341',
  title: 'Artificial intelligence in evidence synthesis and systematic reviews',
  authors: 'Marshall, I. J. & Wallace, B. C.',
  journal: 'Journal of the American Medical Informatics Association',
  year: 2023,
  volume: '30',
  issue: '1',
  pages: '12–21',
  doi: 'https://doi.org/10.1093/jamia/ocac198',
};

test('integrasjonstest: collector-output gir strukturelt komplett APA 7-utkast', () => {
  const result = createApa7JournalReference({
    authors: collectorResult.authors,
    year: collectorResult.year,
    title: collectorResult.title,
    journal: collectorResult.journal,
    volume: collectorResult.volume,
    issue: collectorResult.issue,
    pages: collectorResult.pages,
    doi: collectorResult.doi,
  });

  assert.equal(result.status, 'VALIDATION_REQUIRED');
  assert.equal(result.verified, false);
  assert.equal(result.canUseAsVerifiedReference, false);
  assert.deepEqual(result.missingFields, []);
  assert.match(result.draft, /Artificial intelligence in evidence synthesis and systematic reviews/);
  assert.match(result.draft, /10\.1093\/jamia\/ocac198/);
});

test('integrasjonstest: manglende metadata gir eksplisitt mangelliste', () => {
  const result = createApa7JournalReference({
    authors: 'Nordmann, O.',
    title: 'Foreløpig observasjonsstudie',
    year: undefined,
    journal: undefined,
    doi: '10.5555/preprint.999',
  });

  assert.equal(result.status, 'INVALID');
  assert.equal(result.canUseAsVerifiedReference, false);
  assert.ok(result.missingFields.includes('år'));
  assert.ok(result.missingFields.includes('tidsskrift'));
});

test('integrasjonstest: norsk lov håndteres gjennom felles referansegrense', () => {
  const result = createNorwegianLawReference({
    shortTitle: 'Helsepersonelloven',
    year: 1999,
    officialTitle: 'Lov om helsepersonell m.v.',
    dateCode: 'LOV-1999-07-02-64',
    websiteName: 'Lovdata',
    url: 'https://lovdata.no/lov/1999-07-02-64',
    section: '§ 21',
  });

  assert.equal(result.status, 'VALIDATION_REQUIRED');
  assert.equal(result.verified, false);
  assert.match(result.draft, /Helsepersonelloven/);
  assert.match(result.draft, /LOV-1999-07-02-64/);
});
