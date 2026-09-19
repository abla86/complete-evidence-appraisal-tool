import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDoi, isValidDoi, buildJournalArticleReference, classifyMetadata } from '../lib/apa7.js';

test('normalizes DOI URL and prefix',()=>assert.equal(normalizeDoi('https://doi.org/10.1000/ABC.1'),'10.1000/ABC.1'));
test('validates DOI syntax without claiming verification',()=>assert.equal(isValidDoi('10.1000/ABC.1'),true));
test('builds deterministic journal reference',()=>assert.equal(buildJournalArticleReference({authors:['Smith, J.','Doe, A.'],year:2026,title:'Example study',journal:'Journal of Testing',volume:10,issue:2,pages:'10-20',doi:'10.1000/test.1'}),'Smith, J., & Doe, A. (2026). Example study. Journal of Testing, 10(2), 10-20. https://doi.org/10.1000/test.1'));
test('metadata classification is not verification',()=>assert.deepEqual(classifyMetadata({authors:['Smith, J.'],year:2026,title:'Example',journal:'Journal',doi:'10.1000/test'}),'COMPLETE'));
