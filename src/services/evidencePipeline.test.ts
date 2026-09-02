import test from 'node:test';
import assert from 'node:assert/strict';
import { EvidencePipelineService } from './evidencePipelineService';

test('pipeline creates, transitions, and records checkpoints', async () => {
  const pipeline = new EvidencePipelineService();
  let state = pipeline.create('project-1');

  assert.equal(state.currentStage, 'identification');
  assert.equal(state.version, 1);

  state = await pipeline.transition(state, 'screening', {
    id: 'reviewer-1',
    role: 'reviewer',
  });

  assert.equal(state.currentStage, 'screening');
  assert.equal(state.version, 2);
  assert.equal(state.checkpoints.find(c => c.stage === 'identification')?.status, 'completed');
  assert.equal(state.checkpoints.find(c => c.stage === 'screening')?.status, 'in_progress');
  assert.equal(pipeline.getAuditTrail().length, 1);
});

test('pipeline blocks unauthorized consensus transition', async () => {
  const pipeline = new EvidencePipelineService();
  const state = pipeline.create('project-2');

  await assert.rejects(
    () => pipeline.transition(state, 'consensus', {
      id: 'reviewer-1',
      role: 'reviewer',
    }),
    /har ikke tilgang/,
  );
});

test('pipeline audit chain verifies after transitions', async () => {
  const pipeline = new EvidencePipelineService();
  let state = pipeline.create('project-3');
  state = await pipeline.transition(state, 'screening', { id: 'lead', role: 'lead_reviewer' });
  await pipeline.complete(state, { id: 'lead', role: 'lead_reviewer' });

  const audit = pipeline.getAuditTrail();
  assert.equal(audit.length, 2);
  assert.ok(audit[1].previousEntryHash);
});
