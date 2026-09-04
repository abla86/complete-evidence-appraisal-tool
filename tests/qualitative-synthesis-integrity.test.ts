import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSynthesis } from '../src/services/synthesisIntegrityService.ts';

const appraisal={id:'a1',studyId:'s1',locked:true};
const evidence={id:'e1',sourceRecordId:'src1'} as any;
const claim={id:'c1',supportingEvidenceIds:['e1']} as any;

test('qualitative synthesis requires a finding and evidence provenance',()=>{
 const result=validateSynthesis({
  id:'syn1',type:'META_AGGREGATION',question:'Q',createdBy:'r',createdAt:'2026-09-04',locked:false,includedStudyIds:['s1'],
  inputs:[{id:'i1',studyId:'s1',appraisalSessionId:'a1',evidenceIds:[],outcomeOrFinding:'',eligible:true}]
 },[appraisal],[evidence],[claim]);
 assert.equal(result.valid,false);
 assert.ok(result.blockers.some(x=>x.includes('outcome/finding')));
 assert.ok(result.blockers.some(x=>x.includes('minst én evidenskilde')));
});
