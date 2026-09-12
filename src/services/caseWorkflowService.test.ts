import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addCaseNote,
  assignCase,
  createCase,
  DEFAULT_STAGES,
  transitionCase,
  type WorkflowCase,
} from './caseWorkflowService';

test('creates a case at intake with an audit entry', () => {
  const created = createCase({ title: 'Test appraisal case', type: 'Evidence appraisal', priority: 'NORMAL', description: 'Workflow test' });
  assert.equal(created.status, 'NEW');
  assert.equal(created.stageId, 'intake');
  assert.equal(created.tags.length, 0);
  assert.equal(created.audit.length, 1);
});

test('records assignment and notes without losing the case history', () => {
  const created = createCase({ title: 'Audit case', type: 'Peer review', priority: 'HIGH', description: '' });
  const assigned = assignCase(created, 'Methodologist', 'reviewer-1');
  const noted = addCaseNote(assigned, 'Initial review completed', 'reviewer-1');
  assert.equal(noted.assignee, 'Methodologist');
  assert.equal(noted.audit.some(entry => entry.action === 'ASSIGNMENT_CHANGED'), true);
  assert.equal(noted.audit.some(entry => entry.action === 'NOTE_ADDED'), true);
});

test('moves a case through controlled workflow stages and closes it', () => {
  let current: WorkflowCase = createCase({ title: 'Lifecycle case', type: 'Research screening', priority: 'NORMAL', description: '' });
  const stageIds = ['triage', 'assessment', 'review', 'decision', 'closure'] as const;
  for (const stageId of stageIds) {
    const stage = DEFAULT_STAGES.find(item => item.id === stageId);
    assert.ok(stage);
    current = transitionCase(current, stage, 'reviewer-1');
  }
  assert.equal(current.stageId, 'closure');
  assert.equal(current.status, 'CLOSED');
  assert.equal(current.audit.filter(entry => entry.action === 'STAGE_CHANGED').length, 5);
});
