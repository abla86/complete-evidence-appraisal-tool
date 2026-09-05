import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAuthorList, normalizeDoi, DocumentParserService } from '../src/services/documentParserService.ts';
import { MethodIntegrityGate } from '../src/services/methodIntegrityGate.ts';
import { MASTER_INSTRUMENTS_REGISTRY } from '../src/data/masterRegistry.ts';
const DOI='10.1186/s12875-024-02269-9';
const AUTHORS='Oda Martine Steinsdatter Øverhaug", Johanna Laue², Svein Arild Vis³ and Mette Bech Risør¹,⁴';
test('Øverhaug DOI and Unicode author parsing',()=>{assert.equal(normalizeDoi('https://doi.org/'+DOI),DOI);assert.deepEqual(parseAuthorList(AUTHORS),['Oda Martine Steinsdatter Øverhaug','Johanna Laue','Svein Arild Vis','Mette Bech Risør']);});
test('Øverhaug metadata extraction',()=>{const text=`There's a will, but not a way': Norwegian GPs' experiences of collaboration with child welfare services - a grounded theory study
${AUTHORS}
BMC Primary Care
2024
doi:${DOI}
grounded theory`;const m=DocumentParserService.extractMetadata(text,'Øverhaug2024_Norwegian GP experiences.pdf');assert.equal(m.title,text.split('\n')[0]);assert.equal(m.authors,'Oda Martine Steinsdatter Øverhaug; Johanna Laue; Svein Arild Vis; Mette Bech Risør');assert.equal(m.year,2024);assert.equal(m.journal,'BMC Primary Care');assert.equal(m.doi,DOI);});
test('MethodIntegrityGate accepts complete registered instrument fixture',()=>{const instrument=MASTER_INSTRUMENTS_REGISTRY.find(i=>i.id==='amstar-2');assert.ok(instrument);const items=Array.from({length:instrument.itemCount},(_,i)=>({questionId:i+1,status:instrument.allowedAnswers[0],justification:'Verified test rationale'}));const result=MethodIntegrityGate.validateAppraisal({id:'overhaug-gate',title:'Øverhaug et al. (2024)',shortCitation:'Øverhaug et al., 2024',instrumentId:instrument.id,instrumentVersion:instrument.version,items,overallVerdict:'Inkluder'} as any);assert.equal(result.passed,true);});
