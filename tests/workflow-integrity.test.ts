import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCanonicalSourceLink } from '../src/services/canonicalSourceLinkService.ts';
import { validatePRISMAFlow } from '../src/services/prismaFlowValidationService.ts';
import { evaluateReportingAssessment } from '../src/services/reportingGuidelineService.ts';

test('canonical source link never equates unrelated ids automatically',()=>{
 const result=resolveCanonicalSourceLink({referenceId:'ref-1',sourceRecordId:'src-1',reference:{doi:'10.1234/example'},sourceRecord:{doi:'10.9999/other'}});
 assert.equal(result.match,'MANUAL_REQUIRED');
});

test('canonical source link accepts matching DOI',()=>{
 const result=resolveCanonicalSourceLink({referenceId:'ref-1',sourceRecordId:'src-1',reference:{doi:'https://doi.org/10.1234/example'},sourceRecord:{doi:'10.1234/example'}});
 assert.equal(result.match,'STABLE_IDENTIFIER');
});

test('PRISMA flow rejects inconsistent counts',()=>{
 const result=validatePRISMAFlow({identification:{recordsFromDatabases:100,recordsFromOtherSources:10,totalIdentified:100,duplicatesRemoved:5},screening:{recordsScreened:95,recordsExcluded:20},eligibility:{fullTextsAssessed:75,fullTextsExcluded:[],},included:{studiesFinalSynthesis:5,studiesQualityAssessment:5}});
 assert.equal(result.valid,false); assert.ok(result.errors.length>0);
});

test('reporting assessment is not a quality score',()=>{
 const result=evaluateReportingAssessment('prisma-2020','2020',[{id:'1',label:'Search strategy',required:true,status:'COMPLETE'}]);
 assert.equal(result.ready,true); assert.equal(result.completionPercent,100); assert.equal('score' in result,false);
});
