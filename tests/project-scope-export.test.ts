import test from 'node:test';
import assert from 'node:assert/strict';
import { createResearchProject, assertStudyBelongsToProject } from '../src/domain/researchProject.ts';

test('project owns a unique set of studies', () => {
  const project = createResearchProject({id:'p1',name:'Review',studyIds:['s1','s1','s2']});
  assert.deepEqual(project.studyIds,['s1','s2']);
});

test('study outside project is rejected', () => {
  const project = createResearchProject({id:'p1',name:'Review',studyIds:['s1']});
  assert.throws(() => assertStudyBelongsToProject(project,'s2'), /PROJECT_SCOPE_DENIED/);
});
