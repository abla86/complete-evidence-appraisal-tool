import test from 'node:test';
import assert from 'node:assert/strict';
import { ImportExportService } from './importExportService';

test('newly imported articles remain instrument-neutral until study design is verified', () => {
  const article = ImportExportService.createDefaultArticle({
    title: 'Imported study',
    authors: 'Doe, Jane',
    year: 2026,
    journal: 'Example Journal',
    doi: '10.1000/example'
  });
  assert.equal(article.instrumentId, undefined);
  assert.equal(article.instrumentVersion, undefined);
  assert.equal(article.design, 'Ukjent / uavklart – krever studiedesignklassifisering');
  assert.deepEqual(article.items, []);
  assert.equal(article.doiUrl, 'https://doi.org/10.1000/example');
  assert.equal(article.sourceUrl, '');
});

test('imported metadata is not fabricated as a qualitative design or interview method', () => {
  const result = ImportExportService.parseImport(
    'title,author,year,journal,doi\nA study,Doe Jane,2026,Example Journal,10.1000/example',
    'references.csv'
  );
  return result.then(imported => {
    assert.equal(imported.newArticles.length, 1);
    const article = imported.newArticles[0];
    assert.equal(article.instrumentId, undefined);
    assert.equal(article.design, 'Ukjent / uavklart – krever studiedesignklassifisering');
    assert.equal(article.dataCollection, 'Ikke oppgitt');
    assert.equal(article.participants, 'Ikke oppgitt');
    assert.equal(article.analyticMethod, 'Ikke oppgitt');
    assert.deepEqual(article.items, []);
  });
});
