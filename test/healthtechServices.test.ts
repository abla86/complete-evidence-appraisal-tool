import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFhirBundle,parseObservation,parseCondition} from '../src/services/fhirAdapterService';
import {deIdentifyHealthcareText,isValidNorwegianNationalId} from '../src/services/normenPrivacyEngine';
import {lookupTerminology,mapTerminology} from '../src/services/nordicTerminologyService';

test('FHIR bundle maps core clinical resource types',()=>{
 const d=parseFhirBundle({resourceType:'Bundle',entry:[
  {resource:{resourceType:'DocumentReference',id:'d1',status:'current',description:'Study'}},
  {resource:{resourceType:'Observation',id:'o1',status:'final',code:{text:'Blood pressure'},valueQuantity:{value:120,unit:'mmHg'}}},
  {resource:{resourceType:'Condition',id:'c1',code:{text:'Hypertension'}}}
 ]});
 assert.equal(d.documentReferences[0].id,'d1');assert.equal(d.observations[0].value,'120');assert.equal(d.conditions[0].code,'Hypertension');
});
test('FHIR individual parsers preserve identifiers',()=>{
 assert.equal(parseObservation({resourceType:'Observation',id:'o'}).id,'o');
 assert.equal(parseCondition({resourceType:'Condition',id:'c'}).id,'c');
});
test('Norwegian national identifier validator rejects malformed input',()=>{assert.equal(isValidNorwegianNationalId('12345678901'),false);assert.equal(isValidNorwegianNationalId('123'),false);});
test('Normen engine produces client-side audit evidence',async()=>{
 const r=await deIdentifyHealthcareText('Pasient 12345678901 har HPR 1234567.',{replaceNames:true});
 assert.match(r.deIdentifiedText,/FNR_REDACTED/);assert.match(r.deIdentifiedText,/HPR-\[REDACTED\]/);assert.equal(r.audit.algorithm,'SHA-256');assert.equal(r.audit.clientOnly,true);assert.equal(r.audit.inputDigest.length,64);
});
test('Terminology lookup finds supported ATC concept',()=>{assert.equal(lookupTerminology('N06DA02','ATC')[0]?.display,'Donepezil');});
test('Terminology mapping is bidirectionally inspectable',()=>{const mapped=mapTerminology('ATC','N06DA02','FEST');assert.equal(mapped[0]?.system,'FEST');assert.equal(mapped[0]?.mapsTo?.[0]?.system,'ATC');});
