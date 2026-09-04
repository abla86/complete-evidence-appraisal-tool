import test from 'node:test';
import assert from 'node:assert/strict';
import { createResearchWorkflowFromText, recordScreeningDecision, updateResearchClassification, verifyResearchClassification, verifyResearchEvidence, selectResearchInstrument, assertReadyForAppraisal } from './researchWorkflowService';

test('research workflow blocks appraisal until all human gates are satisfied', () => {
  const state=createResearchWorkflowFromText('Introduction\nQuestion\n\nMethods\nDesign\n\nResults\nFinding\n\nDiscussion\nInterpretation','study.txt','study-1');
  assert.throws(()=>assertReadyForAppraisal(state),/INCLUDED/);
  let next=recordScreeningDecision(state,'reviewer-1','INCLUDED');
  assert.throws(()=>assertReadyForAppraisal(next),/classification/i);
  const c=next.research!.evidenceBundle.classification;
  assert.ok(c);
  next=updateResearchClassification(next,{...c,confidenceStatus:'HUMAN_VERIFIED',humanDecision:{status:'APPROVED',verifiedBy:'reviewer-1',verifiedAt:new Date().toISOString(),rationale:'Reviewed'}});
  next=verifyResearchClassification(next,'reviewer-1',true);
  const candidate=next.research!.evidenceBundle.evidence.find(x=>x.source==='AI_CANDIDATE');
  if(candidate) next=verifyResearchEvidence(next,candidate.id,true,'reviewer-1');
  const instrument=next.research!.selectedInstrumentId;
  if(instrument) {
    next=selectResearchInstrument(next,instrument);
    assert.doesNotThrow(()=>assertReadyForAppraisal(next));
  }
});

test('excluded studies cannot pass appraisal readiness', () => {
  const state=createResearchWorkflowFromText('Introduction\nText','excluded.txt','study-2');
  const next=recordScreeningDecision(state,'reviewer-1','EXCLUDED');
  assert.throws(()=>assertReadyForAppraisal(next),/INCLUDED/);
});
