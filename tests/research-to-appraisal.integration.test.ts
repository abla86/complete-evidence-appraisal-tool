import test from 'node:test';
import assert from 'node:assert/strict';

import { MASTER_INSTRUMENTS_REGISTRY } from '../src/data/masterRegistry';
import {
  createResearchWorkflowFromText,
  updateResearchClassification,
  verifyResearchClassification,
  verifyResearchEvidence,
  buildResearchAppraisalPayload,
  getVerifiedResearchEvidence,
} from '../src/services/researchWorkflowService';
import { evidenceAppraisalOrchestrator } from '../src/services/evidenceAppraisalOrchestrator';
import { getAppraisalWorkflowRecord } from '../src/services/appraisalWorkflowBridge';
import { validateAppraisalSession } from '../src/services/universalAppraisalService';
import { researchWorkflowStore } from '../src/services/researchWorkflowStore';

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
    instrumentRoleType: 'CRITICAL_APPRAISAL' as const,
  };
}

function readyWorkflow(studyId: string) {
  const workflow = createResearchWorkflowFromText(
    'Methods: qualitative study. Participants described their experiences of person-centred dementia care.',
    'study.txt',
    studyId,
  );
  const classified = updateResearchClassification(
    workflow,
    classification('jbi-qualitative-2017', 'Kvalitativ'),
  );
  return verifyResearchClassification(classified, 'reviewer-1', true);
}

test('research evidence must be human verified before appraisal payload', () => {
  const workflow = createResearchWorkflowFromText(
    'Methods: qualitative study. Participants described their experiences of person-centred dementia care.',
    'study.txt',
    'integration-study',
  );

  const withClassification = updateResearchClassification(
    workflow,
    classification('jbi-qualitative-2017', 'Kvalitativ'),
  );
  assert.throws(() => buildResearchAppraisalPayload(withClassification));

  const verifiedClassification = verifyResearchClassification(withClassification, 'reviewer-1', true);
  const firstEvidence = verifiedClassification.research?.evidenceBundle.evidence[0];
  assert.ok(firstEvidence);

  const verifiedEvidence = verifyResearchEvidence(verifiedClassification, firstEvidence.id, true, 'reviewer-1');
  const payload = buildResearchAppraisalPayload(verifiedEvidence);

  assert.equal(payload.studyId, 'integration-study');
  assert.equal(payload.instrumentId, 'jbi-qualitative-2017');
  assert.equal(payload.evidence.length, 1);
  assert.equal(payload.evidence[0].source, 'HUMAN_VERIFIED');
});

test('rejected evidence is never included in verified evidence', () => {
  const verifiedClassification = readyWorkflow('integration-study-reject');
  const firstEvidence = verifiedClassification.research?.evidenceBundle.evidence[0];
  assert.ok(firstEvidence);

  const rejected = verifyResearchEvidence(verifiedClassification, firstEvidence.id, false, 'reviewer-1');
  assert.equal(rejected.research?.evidenceBundle.evidence[0].source, 'REJECTED');
  assert.deepEqual(getVerifiedResearchEvidence(rejected), []);
  assert.throws(() => buildResearchAppraisalPayload(rejected));
});

test('orchestrator creates exactly one shared appraisal session', async () => {
  const studyId = 'integration-orchestrator';
  const verifiedClassification = readyWorkflow(studyId);
  const firstEvidence = verifiedClassification.research?.evidenceBundle.evidence[0];
  assert.ok(firstEvidence);
  const verifiedWorkflow = verifyResearchEvidence(verifiedClassification, firstEvidence.id, true, 'reviewer-1');

  researchWorkflowStore.save(verifiedWorkflow);

  const context = await evidenceAppraisalOrchestrator.start(verifiedWorkflow, 'reviewer-1');
  assert.equal(context.workflow.appraisalSessions.length, 1);
  assert.equal(context.workflow.appraisalSessions[0].id, context.appraisal.session.id);
  assert.deepEqual(getAppraisalWorkflowRecord(context.appraisal.session.id), context.appraisal);
});

test('all registered instrument sessions validate against their registry questions', () => {
  const instruments = MASTER_INSTRUMENTS_REGISTRY.filter(i => i.questions?.length);
  assert.ok(instruments.length > 0);

  for (const instrument of instruments) {
    const session = {
      id: `test-session-${instrument.id}`,
      studyId: 'study',
      instrumentId: instrument.id,
      instrumentVersion: instrument.version,
      reviewerId: 'reviewer',
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      locked: false,
    };
    const result = validateAppraisalSession(session);
    assert.equal(result.missingItemIds.length, instrument.questions?.length ?? 0, instrument.id);
    assert.equal(result.valid, false, instrument.id);
  }
});
