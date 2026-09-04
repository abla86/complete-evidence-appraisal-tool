import test from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateStudies, applyDeduplicationDecisions, buildPrismaFlow } from '../src/services/researchWorkflowBridge.ts';

test('duplicate detector matches DOI, PMID and normalized title', () => {
  const result = findDuplicateStudies([
    {studyId:'a',doi:'10.1000/ABC'},
    {studyId:'b',doi:'10.1000/abc'},
    {studyId:'c',pmid:'123'},
    {studyId:'d',pmid:'123'},
    {studyId:'e',title:'A   systematic review'},
    {studyId:'f',title:'a systematic review'},
  ]);
  assert.equal(result.length,3);
});

test('deduplication decisions remove duplicate records and report unresolved records', () => {
  const result = applyDeduplicationDecisions(
    [{studyId:'a',doi:'10/a'},{studyId:'b',doi:'10/a'},{studyId:'c',doi:'10/c'}],
    [{recordId:'b',canonicalStudyId:'a',duplicateOfRecordId:'a',reason:'doi',reviewerId:'r1',timestamp:new Date().toISOString()}]
  );
  assert.equal(result.duplicatesRemoved,1);
  assert.deepEqual(result.canonicalRecords.map(x=>x.studyId),['a','c']);
  assert.deepEqual(result.unresolved.map(x=>x.studyId),['c']);
});

test('PRISMA refuses appraisal sessions for excluded studies', () => {
  assert.throws(() => buildPrismaFlow({
    screening:[{studyId:'a',decision:'exclude',reviewerId:'r',picoMatches:{},timestamp:new Date().toISOString()}],
    appraisalSessions:[{studyId:'a',locked:false} as any]
  }));
});
