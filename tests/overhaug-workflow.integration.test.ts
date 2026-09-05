import assert from 'node:assert/strict';
import test from 'node:test';
import { ImportExportService } from '../src/services/importExportService';
import { MethodIntegrityGate } from '../src/services/methodIntegrityGate';
import { JBI_QUESTIONS } from '../src/data/jbiData';
const doi='10.1186/s12875-024-02269-9';
test('Øverhaug DOI maps to qualitative JBI workflow',()=>{const article=ImportExportService.createDefaultArticle({title:'identifisert',authors:'Forfattere ikke entydig identifisert',year:2026,journal:'',doi,design:'',sourceName:'test'});assert.equal(article.instrumentId,'jbi-qualitative-2017');assert.equal(article.instrumentVersion,'2017');assert.equal(article.year,2024);assert.equal(article.journal,'BMC Primary Care');assert.match(article.authors,/Øverhaug/);assert.equal(article.design,'Kvalitativ studie (Grounded Theory)');assert.equal(article.dataCollection,'10 semi-strukturerte intervjuer');assert.equal(article.participants,'10 fastleger (allmennleger) i Norge');article.items=JBI_QUESTIONS.map(q=>({questionId:q.id,status:'Uklart',justification:''}));const result=MethodIntegrityGate.validateAppraisal(article);assert.equal(result.passed,true);});
