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


function makeMinimalPdf(lines: string[]): ArrayBuffer {
  const escaped = lines.map(line => line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'));
  const stream = ['BT', '/F1 12 Tf', '72 720 Td', ...escaped.flatMap((line, index) => index === 0 ? ['(' + line + ') Tj'] : ['0 -18 Td', '(' + line + ') Tj']), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + new TextEncoder().encode(stream).length + ' >>\nstream\n' + stream + '\nendstream'
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objects.length; i += 1) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += (i + 1) + ' 0 obj\n' + objects[i] + '\nendobj\n';
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (const offset of offsets.slice(1)) pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
  pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
  const bytes = new TextEncoder().encode(pdf);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

test('extracts punctuation, decimals and line boundaries from an actual PDF file', async () => {
  const content = makeMinimalPdf(['Results, methods. p = 0.04', 'CI 95%: 1.02 - 1.45']);
  const parsed = await DocumentParserService.parseFile({ name: 'punctuation-fixture.pdf', size: content.byteLength, content });
  assert.equal(parsed.fileType, 'pdf');
  assert.match(parsed.extractedText, /Results, methods\\. p = 0\\.04/u);
  assert.match(parsed.extractedText, /CI 95%: 1\\.02 - 1\\.45/u);
  assert.equal(parsed.pages.length, 1);
});
