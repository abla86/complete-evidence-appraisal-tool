import test from 'node:test';
import assert from 'node:assert/strict';
import { compareReviewInstances } from '../src/services/researchWorkflowBridge.ts';

const base = { id:'1', appraisalId:'a', studyId:'s', instrumentId:'jbi', status:'completed' as const, responses:{'1':'Yes'}, comments:[] };

test('dual review requires different reviewers', () => {
  assert.throws(() => compareReviewInstances({...base, reviewerId:'r1'}, {...base, id:'2', reviewerId:'r1'}), /to forskjellige/);
});
test('comparison requires completed reviews', () => {
  assert.throws(() => compareReviewInstances({...base, reviewerId:'r1'}, {...base, id:'2', reviewerId:'r2', status:'inProgress'}), /completed/);
});


import { RbacService } from '../src/services/rbacService.ts';
import { assignReviewsAuthorized, resolveReviewAuthorized } from '../src/services/dualReviewService.ts';

const reviewerSession = { userId:'r1', name:'Reviewer 1', role:'reviewer' as const, currentProjectId:'p1', authorizedProjectIds:['p1'] };
const leadSession = { userId:'lead', name:'Lead', role:'lead_reviewer' as const, currentProjectId:'p1', authorizedProjectIds:['p1'] };

test('RBAC blocks reviewer from adjudicating disagreement', () => {
  assert.throws(() => resolveReviewAuthorized({ appraisalId:'a', reviewer:'r1', disagreements:[{itemId:'1', reviewer1Score:'Yes', reviewer2Score:'No', disagreement:true}], method:'consensus', responses:{'1':'Yes'}, rationale:'Reason', authorization:{session:reviewerSession, projectId:'p1'} }), /ikke tillatelse/);
});

test('RBAC requires project authorization for dual-review assignment', () => {
  assert.throws(() => assignReviewsAuthorized({ appraisalId:'a', studyId:'s', instrumentId:'jbi', reviewers:['r1','r2'], config:{instrumentId:'jbi',minReviewers:2,conflictThreshold:0.3,arbitrationMethod:'consensus'}, authorization:{session:{...leadSession, authorizedProjectIds:[]}, projectId:'p1'} }), /tilgang til prosjektet/);
});

test('lead reviewer can adjudicate inside an authorized project', () => {
  const result = resolveReviewAuthorized({ appraisalId:'a', reviewer:'lead', disagreements:[{itemId:'1', reviewer1Score:'Yes', reviewer2Score:'No', disagreement:true}], method:'consensus', responses:{'1':'Yes'}, rationale:'Explicit adjudication rationale', authorization:{session:leadSession, projectId:'p1'} });
  assert.equal(result.status, 'resolved');
});
