import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessResearchWorkflow } from '../src/services/researchWorkflowRoutes';
import type { WorkflowState } from '../src/types/workflow.contracts';

function workflow(overrides: Partial<WorkflowState> = {}): WorkflowState {
  return {
    studyId: 'study-1',
    studyDesign: 'QUALITATIVE',
    screening: [],
    appraisalSessions: [],
    events: [],
    ...overrides,
  };
}

test('owned research workflow is accessible only to its owner', () => {
  const state = workflow({ ownerId: 'reviewer-a' });
  assert.equal(canAccessResearchWorkflow(state, 'reviewer-a'), true);
  assert.equal(canAccessResearchWorkflow(state, 'reviewer-b'), false);
});

test('legacy workflow without owner remains accessible to recorded reviewer', () => {
  const state = workflow({
    screening: [{ studyId: 'study-1', reviewerId: 'reviewer-a', decision: 'INCLUDED', updatedAt: '2026-01-01T00:00:00.000Z' }],
  });
  assert.equal(canAccessResearchWorkflow(state, 'reviewer-a'), true);
  assert.equal(canAccessResearchWorkflow(state, 'reviewer-b'), false);
});

test('legacy workflow without owner and without reviewer records is denied', () => {
  assert.equal(canAccessResearchWorkflow(workflow(), 'reviewer-a'), false);
});

test('blank reviewer identity is always denied', () => {
  assert.equal(canAccessResearchWorkflow(workflow({ ownerId: 'reviewer-a' }), ''), false);
  assert.equal(canAccessResearchWorkflow(workflow({ ownerId: 'reviewer-a' }), '   '), false);
});
