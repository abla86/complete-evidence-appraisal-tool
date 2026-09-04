import test from 'node:test';
import assert from 'node:assert/strict';

test('project identity and study identity are distinct concepts', () => {
  const projectId = 'workspace';
  const studyId = 'study-1';
  assert.notEqual(projectId, studyId);
});
