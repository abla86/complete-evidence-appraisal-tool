import assert from 'node:assert/strict';
import test from 'node:test';
import { ImportExportService } from '../src/services/importExportService';
import { DocumentParserService } from '../src/services/documentParserService';
import { MethodIntegrityGate } from '../src/services/methodIntegrityGate';
import { JBI_QUESTIONS } from '../src/data/jbiData';

const doi='10.1186/s12875-024-02269-9';
const sourceText=`There's a will, but not a way': Norwegian GPs' experiences of collaboration with child welfare services - a grounded theory study
Oda Martine Steinsdatter Øverhaug", Johanna Laue², Svein Arild Vis³ and Mette Bech Risør¹,⁴
BMC Primary Care
2024
doi:${doi}
grounded theory`;

test('Øverhaug DOI and metadata enter qualitative JBI workflow only after explicit verification',()=>{
  const metadata=DocumentParserService.extractMetadata(sourceText,'Øverhaug2024_Norwegian GP experiences.pdf');
  assert.equal(metadata.doi,doi);
  assert.match(metadata.authors,/Øverhaug/);
  assert.equal(metadata.year,2024);
  assert.equal(metadata.journal,'BMC Primary Care');
  assert.equal(metadata.studyDesignDetected,'Kvalitativ studie (Grounded Theory / Fenomenologi / Tematisk)');
  assert.equal(metadata.recommendedInstrumentId,'jbi-qualitative-2017');

  const article=ImportExportService.createDefaultArticle({
    title:metadata.title,
    authors:metadata.authors,
    year:metadata.year,
    journal:metadata.journal,
    doi:metadata.doi,
    design:'',
    sourceName:'test'
  });

  assert.equal(article.instrumentId,undefined);
  assert.equal(article.instrumentVersion,undefined);

  const verifiedArticle={
    ...article,
    instrumentId:metadata.recommendedInstrumentId,
    instrumentVersion:'2017',
    design:metadata.studyDesignDetected,
    items:JBI_QUESTIONS.map(q=>({questionId:q.id,status:'Ja',justification:'Verified test rationale'})),
  };
  const result=MethodIntegrityGate.validateAppraisal(verifiedArticle);
  assert.equal(result.passed,true);
});
