import test from 'node:test';
import assert from 'node:assert/strict';
import { EvidenceAgentOrchestrator } from './evidenceAgentOrchestrator';

test('research planning remains a candidate until human verification', async () => {
  const orchestrator = new EvidenceAgentOrchestrator();
  const output = await orchestrator.plan(
    { projectId: 'project-1', sourceIds: [] },
    'What is the effect of intervention X?',
  );

  assert.equal(output.agentId, 'research-planner');
  assert.equal(output.requiresHumanVerification, true);
  assert.match(output.result.researchQuestion, /effect of intervention X/i);
});

test('retrieved candidate evidence is never promoted automatically', async () => {
  const orchestrator = new EvidenceAgentOrchestrator();
  const output = await orchestrator.retrieve(
    { projectId: 'project-1', sourceIds: ['source-1'] },
    [{
      id: 'claim-1',
      claim: 'Candidate finding',
      verificationState: 'HUMAN_VERIFIED',
      provenance: [{
        sourceId: 'source-1',
        sourceType: 'PUBLISHED_SOURCE',
        retrievedAt: new Date().toISOString(),
      }],
    }],
  );

  assert.equal(output.result[0].verificationState, 'UNVERIFIED');
  assert.equal(output.requiresHumanVerification, true);
});
