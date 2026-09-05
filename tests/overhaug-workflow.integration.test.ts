import assert from 'node:assert/strict';
import test from 'node:test';
import { ImportExportService } from '../src/services/importExportService';
import { DocumentParserService } from '../src/services/documentParserService';
import { MethodIntegrityGate } from '../src/services/methodIntegrityGate';
import { JBI_QUESTIONS } from '../src/data/jbiData';
import { MASTER_INSTRUMENTS_REGISTRY } from '../src/data/masterRegistry';

const DOI = '10.1186/s12875-024-02269-9';
const AUTHORS = 'Oda Martine Steinsdatter Øverhaug", Johanna Laue², Svein Arild Vis³ and Mette Bech Risør¹,⁴';

test('Øverhaug metadata extraction preserves title, authors, DOI and qualitative design candidate', () => {
  const text = `There's a will, but not a way': Norwegian GPs' experiences of collaboration with child welfare services - a grounded theory study
${AUTHORS}
BMC Primary Care
2024
doi:${DOI}
grounded theory`;
  const metadata = DocumentParserService.extractMetadata(text, 'Øverhaug2024_Norwegian GP experiences.pdf');
  assert.equal(metadata.title, text.split('\n')[0]);
  assert.equal(metadata.authors, 'Oda Martine Steinsdatter Øverhaug; Johanna Laue; Svein Arild Vis; Mette Bech Risør');
  assert.equal(metadata.year, 2024);
  assert.equal(metadata.journal, 'BMC Primary Care');
  assert.equal(metadata.doi, DOI);
  assert.equal(metadata.studyDesignDetected, 'Kvalitativ studie (Grounded Theory / Fenomenologi / Tematisk)');
  assert.equal(metadata.recommendedInstrumentId, 'jbi-qualitative-2017');
});

test('new import remains instrument-neutral until the qualitative candidate is explicitly verified', () => {
  const article = ImportExportService.createDefaultArticle({
    title: 'Øverhaug et al. study',
    authors: 'Oda Martine Steinsdatter Øverhaug; Johanna Laue; Svein Arild Vis; Mette Bech Risør',
    year: 2024,
    journal: 'BMC Primary Care',
    doi: DOI,
    design: '',
    sourceName: 'test',
  });
  assert.equal(article.instrumentId, undefined);
  assert.equal(article.instrumentVersion, undefined);
  assert.equal(article.design, 'Ukjent / uavklart – krever studiedesignklassifisering');
});

test('MethodIntegrityGate accepts a complete registered AMSTAR-2 fixture', () => {
  const instrument = MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === 'amstar-2');
  assert.ok(instrument);
  const items = Array.from({ length: instrument.itemCount }, (_, i) => ({
    questionId: i + 1,
    status: instrument.allowedAnswers[0],
    justification: 'Verified test rationale',
  }));
  const result = MethodIntegrityGate.validateAppraisal({
    id: 'amstar-gate',
    title: 'Systematic review fixture',
    shortCitation: 'Fixture, 2026',
    instrumentId: instrument.id,
    instrumentVersion: instrument.version,
    items,
    overallVerdict: 'Inkluder',
  } as any);
  assert.equal(result.passed, true);
});
