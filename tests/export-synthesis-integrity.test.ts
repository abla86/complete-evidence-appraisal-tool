import test from 'node:test';
import assert from 'node:assert/strict';
import { assertProjectExportIntegrity } from '../src/services/projectExportService.ts';
import { validateSynthesis } from '../src/services/synthesisIntegrityService.ts';

const evidence = [{ id:'e1', sourceRecordId:'src1', researcherVerified:true, referenceId:'r1', excerpt:'finding' }] as any;
const claim = { id:'c1', text:'Claim', status:'SUPPORTED', supportingEvidenceIds:['e1'] } as any;

test('export integrity accepts a fully locked, provenance-complete package', () => {
  assert.doesNotThrow(() => assertProjectExportIntegrity({
    projectId:'p1', exportedAt:new Date().toISOString(),
    appraisal:[{id:'a1',studyId:'p1',locked:true} as any],
    quality:[{id:'q1',appraisalSessionId:'a1',locked:true} as any],
    claims:[claim], evidence, references:[{id:'r1',title:'Ref'} as any],
    synthesis:[{id:'s1',locked:true} as any], prisma:{} as any, audit:[]
  }));
});

test('export integrity blocks unverified evidence', () => {
  assert.throws(() => assertProjectExportIntegrity({
    projectId:'p1', exportedAt:new Date().toISOString(),
    appraisal:[{id:'a1',studyId:'p1',locked:true} as any],
    quality:[], claims:[claim], evidence:[{...evidence[0],researcherVerified:false}],
    references:[{id:'r1',title:'Ref'} as any], synthesis:[], prisma:{} as any, audit:[]
  }), /not researcher verified/);
});

test('synthesis validation blocks an unlocked appraisal and preserves provenance', () => {
  const result = validateSynthesis(
    {id:'s1',type:'NARRATIVE',question:'Q',inputs:[{id:'i1',studyId:'study1',appraisalSessionId:'a1',evidenceIds:['e1'],outcomeOrFinding:'x',eligible:true}],includedStudyIds:['study1'],createdBy:'r',createdAt:new Date().toISOString(),locked:false},
    [{id:'a1',studyId:'study1',locked:false}],
    evidence,
    [claim]
  );
  assert.equal(result.valid,false);
  assert.ok(result.blockers.some(x=>x.includes('mangler låst appraisal')));
  assert.deepEqual(result.provenance[0].evidenceIds,['e1']);
});
