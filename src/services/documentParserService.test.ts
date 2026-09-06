import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentParserService } from './documentParserService';

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


