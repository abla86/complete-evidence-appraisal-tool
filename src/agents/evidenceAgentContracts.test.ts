import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertAgentOutputRequiresVerification,
  type EvidenceAgentResult,
} from './evidenceAgentContracts';

test('agent outputs cannot bypass human verification', () => {
  const output: EvidenceAgentResult<string> = {
    agentId: 'verification',
    runId: 'run-test',
    createdAt: new Date().toISOString(),
    context: { projectId: 'project-test', sourceIds: ['source-test'] },
    result: 'candidate',
    warnings: [],
    requiresHumanVerification: true,
  };

  assert.doesNotThrow(() => assertAgentOutputRequiresVerification(output));
  assert.throws(() =>
    assertAgentOutputRequiresVerification({
      ...output,
      requiresHumanVerification: false,
    }),
  );
});
