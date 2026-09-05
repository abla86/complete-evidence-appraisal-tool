import test from 'node:test';
import assert from 'node:assert/strict';

import { MASTER_INSTRUMENTS_REGISTRY } from '../src/data/masterRegistry';
import {
  createResearchWorkflowFromText,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  recordScreeningDecision,
  buildResearchAppraisalPayload,
  selectResearchInstrument,
} from '../src/services/researchWorkflowService';
import { EvidenceAppraisalOrchestrator } from '../src/services/evidenceAppraisalOrchestrator';
import { getAppraisalWorkflowRecord } from '../src/services/appraisalWorkflowBridge';

function classification(instrumentId: string, studyDesign: string) {
  return {
    documentType: 'QUALITATIVE_STUDY' as const,
    documentTypeName: 'Qualitative study',
    isResearchDocument: true,
    studyDesign,
    methodologicalApproach: 'Kvalitativ' as const,
    methodologicalPurpose: 'Levde erfaringer / Sosiale fenomener' as const,
    confidenceScore: 95,
    confidenceStatus: 'AI_CANDIDATE_REQUIRES_VERIFICATION' as const,
    statusBadgeText: 'Requires verification',
    evidenceSignals: [],
    rationale: 'Integration test classification',
    hasMetadataContentConflict: false,
    recommendedInstrumentId: instrumentId,
    recommendedInstrumentName: MASTER_INSTRUMENTS_REGISTRY.find(i => i.id === instrumentId)?.name ?? '',
    recommendedInstrumentJustification: 'Test',
    alternativeInstruments: [],
    methodologicalLimitations: '',
    instrumentSourceAndAuthority: 'Test',
    instrumentRoleType: 'CRITICAL_APPRAISAL_ROB' as const,
  };
}

test('orchestrator creates one canonical appraisal session and preserves verified evidence IDs', async () => {
  const instrumentId = 'jbi-qualitative-2017';
  const workflow = createResearchWorkflowFromText(
    'Aim: explore experiences. Methods: qualitative study. Participants described their experiences of person-centred dementia care.',
    'study.txt',
    `orchestrator-${Date.now()}`,
  );
  let state = updateResearchClassification(workflow, classification(instrumentId, 'Kvalitativ'));
  state = verifyResearchClassification(state, 'reviewer-1', true);
  state = selectResearchInstrument(state, instrumentId);
  state = recordScreeningDecision(state, 'reviewer-1', 'INCLUDED');

  const firstEvidence = state.research?.evidenceBundle.evidence[0];
  assert.ok(firstEvidence);
  state = verifyResearchEvidence(state, firstEvidence.id, true, 'reviewer-1');

  const payload = buildResearchAppraisalPayload(state);
  assert.deepEqual(payload.evidence.map(item => item.id), [firstEvidence.id]);

  const orchestrator = new EvidenceAppraisalOrchestrator();
  const context = await orchestrator.start(state, 'reviewer-1');
  assert.equal(context.workflow.appraisalSessions.length, 1);
  assert.equal(context.appraisal.session.id, context.workflow.appraisalSessions[0].id);

  const stored = getAppraisalWorkflowRecord(context.appraisal.session.id);
  assert.ok(stored);
  assert.deepEqual(stored.evidenceIds, [firstEvidence.id]);
});


test('research-to-export contract rejects incomplete synthesis provenance', async () => {
  const instrumentId = 'jbi-qualitative-2017';
  let state = updateResearchClassification(createResearchWorkflowFromText('Aim: explore experiences. Methods: qualitative study.', 'study.txt', `export-1788487221175`), classification(instrumentId, 'Kvalitativ'));
  state = verifyResearchClassification(state, 'reviewer-1', true);
  state = selectResearchInstrument(state, instrumentId);
  state = recordScreeningDecision(state, 'reviewer-1', 'INCLUDED');
  const evidence = state.research?.evidenceBundle.evidence[0];
  assert.ok(evidence);
  state = verifyResearchEvidence(state, evidence.id, true, 'reviewer-1');
  const payload = buildResearchAppraisalPayload(state);
  assert.deepEqual(payload.evidence.map(item => item.id), [evidence.id]);
});
