import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentParserService, normalizeExtractedText } from './documentParserService';

test('extractSections does not invent IMRaD boundaries from paragraph count', () => {
  const text = [
    'This is a study title',
    '',
    'Introduction',
    'The study addresses the research question.',
    '',
    'Methods',
    'Participants were recruited according to the protocol.',
    '',
    'Results',
    'The primary outcome was reported.',
    '',
    'Discussion',
    'The findings are interpreted in relation to previous research.'
  ].join('\n');
  const sections = DocumentParserService.extractSections(text);
  assert.deepEqual(sections.map(section => section.title), [
    'Introduction / Background',
    'Methods / Design',
    'Results / Findings',
    'Discussion / Limitations'
  ]);
  assert.match(sections[1].content, /Participants were recruited/);
});

test('unstructured documents are explicitly retained for manual review', () => {
  const text = 'A short document without reliable section headings.\n\nAnother paragraph with no methodological heading.';
  const sections = DocumentParserService.extractSections(text);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].title, 'Hovedtekst â€“ manuell gjennomgang');
});

test('file validation rejects unsupported extensions', () => {
  const result = DocumentParserService.validateFile({ name: 'study.exe', size: 100 });
  assert.equal(result.valid, false);
});



test('extracted text removes spaces before punctuation without changing punctuation', () => {
  const input = 'Results , methods ; outcomes : significant . ( p = 0.04 ) 95 %';
  assert.equal(normalizeExtractedText(input), 'Results, methods; outcomes: significant. (p = 0.04) 95%');
});

test('extracted text preserves scientific punctuation, Unicode and line boundaries', () => {
  const input = 'CI 95 %: 1.02 – 1.45\r\n“Effect size” ; α = 0.05, p < 0.001 .';
  assert.equal(normalizeExtractedText(input), 'CI 95%: 1.02 – 1.45\n“Effect size”; α = 0.05, p < 0.001.');
});

test('extracted text removes spacing before closing punctuation and normalizes PDF whitespace', () => {
  assert.equal(normalizeExtractedText('Dose ( 10 mg ) , not  100 mg .'), 'Dose (10 mg), not  100 mg.');
});
