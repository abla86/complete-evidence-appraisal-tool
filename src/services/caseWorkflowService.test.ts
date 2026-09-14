import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STAGES,
  addCaseNote,
  assignCase,
  createCase,
  loadCases,
  saveCases,
  transitionCase,
  type WorkflowCase,
} from './caseWorkflowService';

const storage = new Map<string, string>();
const localStorageMock: Storage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => { storage.set(key, value); },
  removeItem: key => { storage.delete(key); },
  clear: () => { storage.clear(); },
  key: index => Array.from(storage.keys())[index] ?? null,
  get length() { return storage.size; },
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });

describe('caseWorkflowService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a case at intake with an audit entry', () => {
    const created = createCase({ title: 'Test appraisal case', type: 'Evidence appraisal', priority: 'NORMAL', description: 'Workflow test' });
    assert.equal(created.status, 'NEW');
    assert.equal(created.stageId, 'intake');
    assert.equal(created.audit.length, 1);
    assert.equal(loadCases().length, 0);
  });

  it('records assignment and notes without losing the case history', () => {
    const created = createCase({ title: 'Audit case', type: 'Peer review', priority: 'HIGH', description: '' });
    const assigned = assignCase(created, 'Methodologist', 'Reviewer');
    const noted = addCaseNote(assigned, 'Initial review completed', 'Reviewer');
    assert.equal(noted.assignee, 'Methodologist');
    assert.ok(noted.audit.some(entry => entry.action === 'ASSIGNMENT_CHANGED'));
    assert.ok(noted.audit.some(entry => entry.action === 'NOTE_ADDED'));
  });

  it('moves a case through controlled workflow stages and closes it', () => {
    let current = createCase({ title: 'Lifecycle case', type: 'Research screening', priority: 'NORMAL', description: '' });
    for (const stage of DEFAULT_STAGES.slice(1)) {
      current = transitionCase(current, stage, 'Reviewer');
    }
    assert.equal(current.stageId, 'closure');
    assert.equal(current.status, 'CLOSED');
    assert.equal(current.audit.filter(entry => entry.action === 'STAGE_CHANGED').length, 5);
  });

  it('persists and restores cases using the workflow store contract', () => {
    const sample: WorkflowCase = {
      id: 'CASE-TEST', title: 'Persisted case', type: 'Implementation project', status: 'OPEN', priority: 'URGENT', stageId: 'triage',
      assignee: 'Lead reviewer', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dueAt: new Date(Date.now() + 3600000).toISOString(),
      description: 'Persistence contract', tags: ['persistence'], audit: [],
    };
    saveCases([sample]);
    assert.deepEqual(loadCases(), [sample]);
  });
});
