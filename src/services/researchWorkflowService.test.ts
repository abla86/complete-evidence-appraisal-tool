import test from 'node:test';
import assert from 'node:assert/strict';
import { createResearchWorkflowFromText, recordScreeningDecision, updateResearchClassification, verifyResearchClassification, verifyResearchEvidence, selectResearchInstrument, assertReadyForAppraisal } from './researchWorkflowService';

test('research workflow enforces human gates before appraisal', () => {
 const state=createResearchWorkflowFromText([
  'Introduction','Question and background.','','Methods','A qualitative study.','','Results','Findings.','','Discussion','Interpretation.'
 ].join('\n\n'),'study.txt','study-1');
 assert.throws(()=>assertReadyForAppraisal(state),/INCLUDED/);
 let next=recordScreeningDecision(state,'reviewer-1','INCLUDED');
 assert.throws(()=>assertReadyForAppraisal(next),/classification/i);
 const c=state.research!.evidenceBundle.classification;
 assert.ok(c);
 next=updateResearchClassification(next,{...c!,confidenceStatus:'HUMAN_VERIFIED',humanDecision:{status:'APPROVED',verifiedBy:'reviewer-1',verifiedAt:new Date().toISOString(),rationale:'Reviewed'}});
 next=verifyResearchClassification(next,'reviewer-1',true);
 const candidate=next.research!.evidenceBundle.evidence.find(x=>x.source==='AI_CANDIDATE');
 if(candidate) next=verifyResearchEvidence(next,candidate.id,true,'reviewer-1');
 const instrument=next.research!.selectedInstrumentId;
 if(instrument) { next=selectResearchInstrument(next,instrument); assert.doesNotThrow(()=>assertReadyForAppraisal(next)); }
});
