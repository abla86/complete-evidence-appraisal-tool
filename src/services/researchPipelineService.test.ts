import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPipelineSnapshot,
  advancePipeline,
  validatePipelineTransition,
  type PipelineStage,
} from './researchPipelineService';

test('pipeline only permits deterministic adjacent transitions', () => {
  assert.equal(validatePipelineTransition('SEARCH','IMPORT'), true);
  assert.equal(validatePipelineTransition('SEARCH','APPRAISAL'), false);
  assert.equal(validatePipelineTransition('EXPORT','SEARCH'), false);
});

test('blocked pipeline cannot advance', () => {
  const snapshot=buildPipelineSnapshot('SCREENING',[],['Human screening decision is required.']);
  const result=advancePipeline(snapshot,'PICO','reviewer-1');
  assert.equal(result.ok,false);
  assert.equal(result.snapshot.currentStage,'SCREENING');
});

test('advancePipeline records actor, records and rationale', () => {
  const snapshot=buildPipelineSnapshot('SEARCH',[]);
  const result=advancePipeline(snapshot,'IMPORT','reviewer-1',['source-1'],'Imported after database search');
  assert.equal(result.ok,true);
  assert.equal(result.snapshot.currentStage,'IMPORT');
  assert.equal(result.snapshot.links.length,1);
  assert.equal(result.snapshot.links[0].actor,'reviewer-1');
  assert.deepEqual(result.snapshot.links[0].recordIds,['source-1']);
  assert.equal(result.snapshot.links[0].rationale,'Imported after database search');
});
