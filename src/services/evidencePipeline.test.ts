import test from 'node:test';
import assert from 'node:assert/strict';
import { EvidencePipelineService } from './evidencePipelineService';

test('pipeline creates, completes, transitions, and records checkpoints', async () => {
  const pipeline = new EvidencePipelineService();
  let state = pipeline.create('project-1');

  assert.equal(state.currentStage, 'identification');
  assert.equal(state.version, 1);
  assert.equal(state.checkpoints.find(c => c.stage === 'identification')?.status, 'in_progress');

  state = await pipeline.complete(state, {
    id: 'reviewer-1',
    role: 'reviewer',
  });
  assert.equal(state.checkpoints.find(c => c.stage === 'identification')?.status, 'completed');
  assert.equal(state.version, 2);

  state = await pipeline.transition(state, 'screening', {
    id: 'reviewer-1',
    role: 'reviewer',
  });

  assert.equal(state.currentStage, 'screening');
  assert.equal(state.version, 3);
  assert.equal(state.checkpoints.find(c => c.stage === 'screening')?.status, 'in_progress');
  assert.equal(pipeline.getAuditTrail().length, 2);
});

test('pipeline blocks unauthorized consensus transition', async () => {
  const pipeline = new EvidencePipelineService();
  const state = pipeline.create('project-2');

  await assert.rejects(
    () => pipeline.transition(state, 'consensus', {
      id: 'reviewer-1',
      role: 'reviewer',
    }),
    /Pipeline kan bare gå til neste steg/,
  );
});

test('pipeline audit chain verifies after transitions', async () => {
  const pipeline = new EvidencePipelineService();
  let state = pipeline.create('project-3');
  state = await pipeline.complete(state, { id: 'lead', role: 'lead_reviewer' });
  state = await pipeline.transition(state, 'screening', { id: 'lead', role: 'lead_reviewer' });
  state = await pipeline.complete(state, { id: 'lead', role: 'lead_reviewer' });

  const audit = pipeline.getAuditTrail();
  assert.equal(audit.length, 3);
  assert.ok(audit[1].previousEntryHash);
});
