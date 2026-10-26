import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentParserService, normalizeExtractedText, reconstructPdfTextItems } from './documentParserService';

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
  assert.equal(sections[0].title, 'Hovedtekst – manuell gjennomgang');
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

test('reconstructs PDF text from item positions without inserting spaces before punctuation', () => {
  const items = [
    { str: 'Results', transform: [10, 0, 0, 10, 10, 100], width: 34, height: 10 },
    { str: ',', transform: [10, 0, 0, 10, 44, 100], width: 2, height: 10 },
    { str: 'methods', transform: [10, 0, 0, 10, 50, 100], width: 34, height: 10 },
    { str: '.', transform: [10, 0, 0, 10, 84, 100], width: 2, height: 10, hasEOL: true },
    { str: 'Next line', transform: [10, 0, 0, 10, 10, 85], width: 40, height: 10 }
  ];
  assert.equal(reconstructPdfTextItems(items), 'Results, methods.\nNext line');
});


test('preserves separators before leading-decimal values and tabular columns', () => {
  assert.equal(normalizeExtractedText('Values: .05 .10'), 'Values: .05 .10');
  assert.equal(normalizeExtractedText('10\t.05\t20'), '10\t.05\t20');
});

test('does not merge words around ambiguous curly quotation marks', () => {
  assert.equal(normalizeExtractedText('The „control“ group was interviewed.'), 'The „control“ group was interviewed.');
  assert.equal(normalizeExtractedText('in ’90s cohorts'), 'in ’90s cohorts');
});

test('normalization handles very long whitespace runs without changing values', () => {
  const input = 'Value' + ' '.repeat(20000) + '.05';
  assert.equal(normalizeExtractedText(input), input);
});
