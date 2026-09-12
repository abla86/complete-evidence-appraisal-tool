import { describe, expect, it, beforeEach } from 'vitest';
import {
  addCaseNote,
  assignCase,
  createCase,
  loadCases,
  saveCases,
  transitionCase,
  type WorkflowCase,
} from './caseWorkflowService';

describe('caseWorkflowService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a case at intake with an audit entry', () => {
    const created = createCase({
      title: 'Test appraisal case',
      type: 'Evidence appraisal',
      priority: 'NORMAL',
      description: 'Workflow test',
      tags: ['test'],
    });

    expect(created.status).toBe('NEW');
    expect(created.stageId).toBe('intake');
    expect(created.audit).toHaveLength(1);
    expect(loadCases()[0]?.id).toBe(created.id);
  });

  it('records assignment and notes without losing the case history', () => {
    const created = createCase({
      title: 'Audit case',
      type: 'Peer review',
      priority: 'HIGH',
      description: '',
      tags: [],
    });

    const assigned = assignCase(created.id, 'Methodologist');
    const noted = addCaseNote(assigned!.id, 'Initial review completed');

    expect(noted?.assignee).toBe('Methodologist');
    expect(noted?.audit.some(entry => entry.action === 'ASSIGNED')).toBe(true);
    expect(noted?.audit.some(entry => entry.action === 'NOTE_ADDED')).toBe(true);
  });

  it('moves a case through controlled workflow stages and closes it', () => {
    let current = createCase({
      title: 'Lifecycle case',
      type: 'Research screening',
      priority: 'NORMAL',
      description: '',
      tags: [],
    });

    const stages = ['triage', 'assessment', 'review', 'decision', 'closure'] as const;
    for (const stageId of stages) {
      const next = transitionCase(current.id, stageId);
      expect(next).not.toBeNull();
      current = next as WorkflowCase;
    }

    expect(current.stageId).toBe('closure');
    expect(current.status).toBe('CLOSED');
    expect(current.audit.filter(entry => entry.action === 'STAGE_CHANGED')).toHaveLength(5);
  });

  it('persists and restores cases using the workflow store contract', () => {
    const sample: WorkflowCase = {
      id: 'CASE-TEST',
      title: 'Persisted case',
      type: 'Implementation project',
      status: 'OPEN',
      priority: 'URGENT',
      stageId: 'triage',
      assignee: 'Lead reviewer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 3600000).toISOString(),
      description: 'Persistence contract',
      tags: ['persistence'],
      audit: [],
    };

    saveCases([sample]);
    expect(loadCases()).toEqual([sample]);
  });
});
