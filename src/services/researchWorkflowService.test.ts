import test from 'node:test';
import assert from 'node:assert/strict';
import { createResearchWorkflowFromText, recordScreeningDecision, updateResearchClassification, verifyResearchClassification, verifyResearchEvidence, selectResearchInstrument, assertReadyForAppraisal } from './researchWorkflowService';

test('research workflow blocks appraisal until all human gates are satisfied', () => {
  const state=createResearchWorkflowFromText('Introduction\nQuestion\n\nMethods\nDesign\n\nResults\nFinding\n\nDiscussion\nInterpretation','study.txt','study-1');
  assert.throws(()=>assertReadyForAppraisal(state),/INCLUDED/);
  let next=recordScreeningDecision(state,'reviewer-1','INCLUDED');
  assert.throws(()=>assertReadyForAppraisal(next),/classification/i);
  const c={documentType:'QUALITATIVE_STUDY' as const,documentTypeName:'Qualitative study',studyDesign:'Kvalitativ',methodologicalApproach:'Kvalitativ' as const,methodologicalPurpose:'Levde erfaringer / Sosiale fenomener' as const,confidenceScore:95,confidenceStatus:'AI_CANDIDATE_REQUIRES_VERIFICATION' as const,statusBadgeText:'Requires verification',evidenceSignals:[],rationale:'Workflow test classification',hasMetadataContentConflict:false,recommendedInstrumentId:'jbi-qualitative-2017',recommendedInstrumentName:'JBI Critical Appraisal Checklist for Qualitative Research',recommendedInstrumentJustification:'Test',alternativeInstruments:[],methodologicalLimitations:'',instrumentSourceAndAuthority:'Test',instrumentRoleType:'CRITICAL_APPRAISAL' as const};
  next=updateResearchClassification(next,c);
  assert.ok(next.research!.evidenceBundle.classification);
  next=updateResearchClassification(next,{...c,confidenceStatus:'HUMAN_VERIFIED',humanDecision:{status:'APPROVED',verifiedBy:'reviewer-1',verifiedAt:new Date().toISOString(),rationale:'Reviewed'}});
  next=verifyResearchClassification(next,'reviewer-1',true);
  const candidate=next.research!.evidenceBundle.evidence.find(x=>x.source==='AI_CANDIDATE');
  assert.ok(candidate, 'Expected at least one AI candidate evidence item in gate test.');
  next=verifyResearchEvidence(next,candidate.id,true,'reviewer-1');
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
