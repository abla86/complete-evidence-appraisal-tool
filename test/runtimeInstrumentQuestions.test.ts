import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlankAppraisalSession, lockAppraisalSession, upsertAppraisalResponse, validateAppraisalSession } from '../src/services/universalAppraisalService';
import { getInstrumentOrNull } from '../src/services/universalAppraisalService';
import { getInstrumentQuestions } from '../src/services/runtimeInstrumentQuestions';

const fixtures: Record<string, string> = {
  'amstar-2': 'Ja',
  'agree-ii': '4',
  'rob-2': 'Low risk',
  'robins-i': 'Low risk',
};

for (const [instrumentId, answer] of Object.entries(fixtures)) {
  test(`runtime question adapter makes ${instrumentId} executable in canonical appraisal`, () => {
    const instrument = getInstrumentOrNull(instrumentId);
    assert.ok(instrument);
    const questions = getInstrumentQuestions(instrument);
    assert.equal(questions.length, instrument.itemCount);

    let session = createBlankAppraisalSession('study-runtime', instrumentId, 'reviewer-1');
    for (const question of questions) {
      session = upsertAppraisalResponse(session, {
        itemId: question.id,
        answer,
        rationale: 'Testbegrunnelse for runtime instrumentadapter.',
      });
    }

    const validation = validateAppraisalSession(session);
    assert.equal(validation.valid, true, validation.issues.join(' '));
    const locked = lockAppraisalSession(session);
    assert.equal(locked.locked, true);
    assert.equal(locked.responses.length, instrument.itemCount);
  });
}
