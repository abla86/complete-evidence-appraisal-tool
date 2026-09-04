import test from 'node:test';
import assert from 'node:assert/strict';
import { IMRaDAnalysisService } from './imradAnalysisService';

test('IMRaD detects explicit English structure', () => {
  const text = [
    'Introduction',
    'Background and purpose. The aim was to investigate the research question.',
    'Methods',
    'We conducted a prospective cohort study with participants and data collection.',
    'Results',
    'The primary outcome was estimated and findings are presented with confidence intervals.',
    'Discussion',
    'The main findings are interpreted in relation to previous research, including strengths and limitations.'
  ].join('

');

  const result = IMRaDAnalysisService.analyze(text, 'article.txt');
  assert.equal(result.standard, 'IMRaD');
  assert.equal(result.complete, true);
  assert.equal(result.explicitComplete, true);
  assert.equal(result.detectedSectionCount, 4);
});

test('IMRaD detects common Norwegian headings', () => {
  const text = [
    'Bakgrunn',
    'Formålet var å undersøke problemstillingen i studien.',
    'Metode',
    'Studiedesign, deltakere, datainnsamling og analyse er beskrevet.',
    'Resultater',
    'Resultatene viser hovedutfallet for deltakerne.',
    'Diskusjon',
    'Funnene drøftes i lys av tidligere forskning og begrensninger.'
  ].join('

');

  const result = IMRaDAnalysisService.analyze(text, 'artikkel.txt');
  assert.equal(result.explicitComplete, true);
  assert.deepEqual(result.missingSections, []);
});

test('missing sections remain structural findings, not quality verdicts', () => {
  const result = IMRaDAnalysisService.analyze(
    'Introduction
Background and purpose are described.

Methods
Participants and data collection are described.',
    'incomplete.txt'
  );

  assert.equal(result.complete, false);
  assert.ok(result.missingSections.includes('Results'));
  assert.ok(result.missingSections.includes('Discussion'));
  assert.match(result.methodologicalNotice, /genererer ikke kvalitetspoeng/);
});

test('short or empty text cannot receive high IMRaD confidence', () => {
  const empty = IMRaDAnalysisService.analyze('');
  assert.equal(empty.detectedSectionCount, 0);
  assert.equal(empty.confidence, 0);

  const short = IMRaDAnalysisService.analyze('Introduction
A short text.');
  assert.ok(short.confidence < 0.5);
});
