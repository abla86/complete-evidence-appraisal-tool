import test from 'node:test';
import assert from 'node:assert/strict';
import { IMPLEMENTATION_AND_MIXED_INSTRUMENTS } from '../src/data/instruments/implementationAndMixed.ts';

test('RE-AIM is represented as a multidimensional profile, not a multiplicative total score', () => {
  const instrument = IMPLEMENTATION_AND_MIXED_INSTRUMENTS.find(x => x.id === 're-aim');
  assert.ok(instrument);
  assert.match(instrument.interpretationModel, /ikke reduseres til en validert multiplikativ totalskår/);
});

test('KTA explicitly has no quality-point scoring model', () => {
  const instrument = IMPLEMENTATION_AND_MIXED_INSTRUMENTS.find(x => x.id === 'kta');
  assert.ok(instrument);
  assert.equal(instrument.scoringModel, 'none');
});
