import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceResearchOrchestrator } from './evidenceResearchOrchestrator';

test('canonical facade can create, plan, and prepare evidence without bypassing gates', async () => {
  let workflow = evidenceResearchOrchestrator.createFromText(
    'Methods: qualitative study. Results: participants described experiences.',
    'study.txt',
    'e2e-study',
  );

  const plan = await evidenceResearchOrchestrator.plan(
    workflow,
    'What are participants experiences?',
  );
  assert.equal(plan.requiresHumanVerification, true);
  assert.equal(plan.agentId, 'research-planner');

  const candidate = workflow.research?.evidenceBundle.evidence[0];
  assert.ok(candidate);

  const prepared = await evidenceResearchOrchestrator.prepareEvidenceCandidates(
    workflow,
    [{
      id: candidate.id,
      claim: 'Participants described experiences.',
      verificationState: 'HUMAN_VERIFIED',
      provenance: [{
        sourceId: candidate.id,
        sourceType: 'USER_DOCUMENT',
        retrievedAt: new Date().toISOString(),
      }],
    }],
  );
  assert.equal(prepared.result[0].verificationState, 'UNVERIFIED');

  workflow = evidenceResearchOrchestrator.verifyEvidence(
    workflow,
    candidate.id,
    true,
    'reviewer-1',
  );

  assert.equal(
    workflow.research?.evidenceBundle.evidence[0]?.source,
    'HUMAN_VERIFIED',
  );
});
