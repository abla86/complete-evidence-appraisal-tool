import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAuditEvent, createAssessment, enforceAiBoundary, finalizeAssessment, verifyAuditChain, verifyImmutableAssessment, classifyInput } from '../src/services/evidenceCore';

test('assessment kan opprettes og finaliseres deterministisk', () => {
  const a = createAssessment({ studyId:'study-1', studyTitle:'Test study', instrumentId:'amstar-2', instrumentVersion:'2017', instrumentChecksum:'abc', reviewerId:'r1', items:[{itemId:'1', answer:'Yes', rationale:'Reported clearly', reviewerId:'r1'}] });
  const f = finalizeAssessment(a, 'r1');
  assert.equal(f.lifecycle, 'FINALIZED');
  assert.equal(verifyImmutableAssessment(f), true);
});

test('AI-forslag kan ikke bli behandlet som verifisert svar', () => {
  const candidate = enforceAiBoundary({ itemId:'1', suggestedAnswer:'Yes' });
  assert.equal(candidate._status, 'AI_CANDIDATE');
});

test('audit chain oppdager manipulering', () => {
  const events: ReturnType<typeof appendAuditEvent>[] = [];
  appendAuditEvent(events, 'a1', 'r1', 'CREATE', { x:1 });
  appendAuditEvent(events, 'a1', 'r1', 'UPDATE', { x:2 });
  assert.equal(verifyAuditChain(events), true);
  events[0].action = 'TAMPERED';
  assert.equal(verifyAuditChain(events), false);
});

test('inputklassifisering flagger åpenbare personopplysningsrisikoer', () => {
  assert.equal(classifyInput('fødselsnummer og telefonnummer'), 'PERSONAL_DATA_RISK');
  assert.equal(classifyInput('systematic review DOI 10.1000/test'), 'PUBLIC_RESEARCH_DATA');
});

test('finalisering stopper uverifisert AI-evidens', () => {
  const a = createAssessment({ studyId:'study-2', studyTitle:'Test', instrumentId:'casp', instrumentVersion:'1', instrumentChecksum:'xyz', reviewerId:'r1', items:[{itemId:'1', answer:'Yes', rationale:'AI found this', reviewerId:'r1', aiSuggested:true, aiVerified:false}] });
  assert.throws(() => finalizeAssessment(a, 'r1'), /AI-forslag/);
});
