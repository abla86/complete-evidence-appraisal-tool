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
  ].join('\n\n');
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
  ].join('\n\n');
  const result = IMRaDAnalysisService.analyze(text, 'artikkel.txt');
  assert.equal(result.explicitComplete, true);
  assert.deepEqual(result.missingSections, []);
});

test('IMRaD does not invent boundaries for unstructured text', () => {
  const result = IMRaDAnalysisService.analyze(
    'Introduction\nBackground and purpose are described.\n\nMethods\nParticipants and data collection are described.',
    'incomplete.txt'
  );
  assert.equal(result.complete, false);
  assert.ok(result.missingSections.includes('Results'));
  assert.ok(result.missingSections.includes('Discussion'));
  assert.match(result.methodologicalNotice, /genererer ikke kvalitetspoeng/);
});

test('an explicit heading without extracted content is not reported as a detected section', () => {
  const result = IMRaDAnalysisService.analyze(
    'Introduction\n\nMethods\nA methods section with enough content to be considered extracted. This describes participants and data collection in sufficient detail for the structural parser.',
    'empty-introduction.txt'
  );
  const introduction = result.sections.find(section => section.key === 'introduction');
  assert.equal(introduction?.explicitHeading, true);
  assert.equal(introduction?.detected, false);
  assert.equal(introduction?.status, 'MISSING');
});

test('unstructured text remains structurally missing rather than paragraph-inferred', () => {
  const result = IMRaDAnalysisService.analyze(
    'This is a long paragraph about a study and its context. '.repeat(10) +
    '\n\nAnother long paragraph discussing findings without a heading. '.repeat(10),
    'unstructured.txt'
  );
  assert.equal(result.detectedSectionCount, 0);
  assert.equal(result.explicitHeadingCount, 0);
  assert.equal(result.confidence, 0);
});
