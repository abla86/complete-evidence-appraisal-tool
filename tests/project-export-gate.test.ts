import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProjectExportGate } from '../src/services/projectExportGate.ts';

const base = {
  claims: [],
  evidence: [],
  references: [],
  appraisal: [],
  quality: [],
};

test('export gate allows an empty project only when access permits export', () => {
  const result = evaluateProjectExportGate({
    ...base,
    projectAccess: { projectId: 'p1', permissions: ['EXPORT'] } as any,
  });
  assert.equal(result.canExport, true);
  assert.deepEqual(result.blockers, []);
});

test('export gate blocks a project without export permission', () => {
  const result = evaluateProjectExportGate({
    ...base,
    projectAccess: { projectId: 'p1', permissions: [] } as any,
  });
  assert.equal(result.canExport, false);
  assert.ok(result.blockers.some(message => message.includes('EXPORT')));
});

test('export gate blocks an open appraisal session', () => {
  const result = evaluateProjectExportGate({
    ...base,
    appraisal: [{ id: 'a1', studyId: 's1', locked: false } as any],
  });
  assert.equal(result.canExport, false);
  assert.ok(result.blockers.some(message => message.includes('ikke låst')));
});

test('export gate blocks unverified evidence', () => {
  const result = evaluateProjectExportGate({
    ...base,
    evidence: [{ id: 'e1', researcherVerified: false, excerpt: 'x' } as any],
  });
  assert.equal(result.canExport, false);
  assert.ok(result.blockers.some(message => message.includes('not researcher verified')));
});

test('export gate blocks quality assessment with missing appraisal', () => {
  const result = evaluateProjectExportGate({
    ...base,
    quality: [{ id: 'q1', appraisalSessionId: 'missing', evidenceId: 'e1', kind: 'GRADE', outcomeOrFinding: 'x', locked: true, reviewerId: 'r1' } as any],
  });
  assert.equal(result.canExport, false);
  assert.ok(result.blockers.some(message => message.includes('knyttet til en appraisal-session')));
});
